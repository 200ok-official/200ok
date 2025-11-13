import { BaseService } from "./base.service";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "@/middleware/error.middleware";

export type ProjectStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'closed' | 'cancelled';

export interface CreateReviewData {
  rating: number;
  comment?: string;
  tags?: string[];
}

export class ReviewService extends BaseService {
  /**
   * 建立評價
   */
  async createReview(
    projectId: string,
    reviewerId: string,
    data: CreateReviewData
  ) {
    // 檢查案件是否存在且已完成
    const { data: project, error } = await this.db
      .from("projects")
      .select("id, client_id, status, title")
      .eq("id", projectId)
      .single();

    if (error || !project) {
      throw new NotFoundError("案件不存在");
    }

    if ((project as any).status !== 'completed') {
      throw new BadRequestError("只有已完成的案件可以評價");
    }

    // 取得接受的投標
    const { data: acceptedBid } = await this.db
      .from("bids")
      .select("freelancer_id")
      .eq("project_id", projectId)
      .eq("status", "accepted")
      .single();

    const acceptedFreelancerId = acceptedBid?.freelancer_id;
    const isClient = (project as any).client_id === reviewerId;

    if (!isClient && reviewerId !== acceptedFreelancerId) {
      throw new ForbiddenError("您沒有權限對此案件評價");
    }

    const revieweeId = isClient ? acceptedFreelancerId : (project as any).client_id;

    if (!revieweeId) {
      throw new BadRequestError("找不到被評價者");
    }

    // 檢查是否已經評價過
    const { data: existingReview } = await this.db
      .from("reviews")
      .select("id")
      .eq("reviewer_id", reviewerId)
      .eq("reviewee_id", revieweeId)
      .eq("project_id", projectId)
      .single();

    if (existingReview) {
      throw new BadRequestError("您已經對此案件評價過了");
    }

    // 驗證評分範圍
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestError("評分必須在 1 到 5 之間");
    }

    // 建立評價
    const { data: review, error: insertError } = await this.db
      .from("reviews")
      .insert({
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        project_id: projectId,
        rating: data.rating,
        comment: data.comment,
        tags: data.tags || [],
      })
      .select(
        `
        *,
        reviewer:users!reviews_reviewer_id_fkey(id, name, avatar_url),
        reviewee:users!reviews_reviewee_id_fkey(id, name, avatar_url),
        project:projects(id, title)
      `
      )
      .single();

    if (insertError || !review) {
      throw new BadRequestError(`建立評價失敗: ${insertError?.message}`);
    }

    // 更新被評價者的平均評分
    await this.updateUserRating(revieweeId);

    // 建立通知給被評價者
    await this.db.from("notifications").insert({
      user_id: revieweeId,
      type: "review_reminder",
      title: "收到新評價",
      content: `${(review as any).reviewer.name} 對您在案件「${(project as any).title}」的表現給予了評價`,
      related_project_id: projectId,
    });

    return review;
  }

  /**
   * 更新使用者的平均評分
   */
  private async updateUserRating(userId: string) {
    const { data: reviews } = await this.db
      .from("reviews")
      .select("rating")
      .eq("reviewee_id", userId);

    if (!reviews || reviews.length === 0) {
      return 0;
    }

    const averageRating =
      reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;

    await this.db
      .from("users")
      .update({ rating: averageRating })
      .eq("id", userId);

    return averageRating;
  }

  /**
   * 取得使用者的評價列表
   */
  async getUserReviews(
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const offset = (page - 1) * limit;

    const [
      { data: reviews, error },
      { count: total },
    ] = await Promise.all([
      this.db
        .from("reviews")
        .select(
          `
          *,
          reviewer:users!reviews_reviewer_id_fkey(id, name, avatar_url),
          project:projects(id, title)
        `
        )
        .eq("reviewee_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1),
      this.db
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("reviewee_id", userId),
    ]);

    if (error) {
      throw new BadRequestError(`取得評價失敗: ${error.message}`);
    }

    return {
      reviews: reviews || [],
      pagination: {
        page,
        limit,
        total: total || 0,
        total_pages: Math.ceil((total || 0) / limit),
      },
    };
  }

  /**
   * 取得案件的評價（雙方互評後才顯示）
   */
  async getProjectReviews(projectId: string) {
    const { data: project, error } = await this.db
      .from("projects")
      .select("id, client_id")
      .eq("id", projectId)
      .single();

    if (error || !project) {
      throw new NotFoundError("案件不存在");
    }

    const { data: acceptedBid } = await this.db
      .from("bids")
      .select("freelancer_id")
      .eq("project_id", projectId)
      .eq("status", "accepted")
      .single();

    const freelancerId = acceptedBid?.freelancer_id;
    if (!freelancerId) {
      return { reviews: [], both_reviewed: false };
    }

    // 查詢雙方的評價
    const { data: reviews } = await this.db
      .from("reviews")
      .select(
        `
        *,
        reviewer:users!reviews_reviewer_id_fkey(id, name, avatar_url),
        reviewee:users!reviews_reviewee_id_fkey(id, name, avatar_url)
      `
      )
      .eq("project_id", projectId);

    const clientReview = (reviews || []).find(
      (r: any) => r.reviewer_id === (project as any).client_id
    );
    const freelancerReview = (reviews || []).find(
      (r: any) => r.reviewer_id === freelancerId
    );
    const bothReviewed = !!clientReview && !!freelancerReview;

    return {
      reviews: bothReviewed ? reviews || [] : [],
      both_reviewed: bothReviewed,
    };
  }

  /**
   * 檢查是否可以評價
   */
  async canReview(projectId: string, userId: string) {
    const { data: project, error } = await this.db
      .from("projects")
      .select("id, status, client_id")
      .eq("id", projectId)
      .single();

    if (error || !project) {
      throw new NotFoundError("案件不存在");
    }

    if ((project as any).status !== 'completed') {
      return {
        can_review: false,
        reason: "案件尚未完成",
      };
    }

    const { data: acceptedBid } = await this.db
      .from("bids")
      .select("freelancer_id")
      .eq("project_id", projectId)
      .eq("status", "accepted")
      .single();

    const isClient = (project as any).client_id === userId;
    const isFreelancer = acceptedBid?.freelancer_id === userId;

    if (!isClient && !isFreelancer) {
      return {
        can_review: false,
        reason: "您不是此案件的相關人員",
      };
    }

    const revieweeId = isClient
      ? acceptedBid?.freelancer_id
      : (project as any).client_id;

    if (!revieweeId) {
      return {
        can_review: false,
        reason: "找不到被評價者",
      };
    }

    const { data: existingReview } = await this.db
      .from("reviews")
      .select("id")
      .eq("reviewer_id", userId)
      .eq("reviewee_id", revieweeId)
      .eq("project_id", projectId)
      .single();

    if (existingReview) {
      return {
        can_review: false,
        reason: "您已經評價過此案件",
      };
    }

    return {
      can_review: true,
      reviewee_id: revieweeId,
    };
  }

  /**
   * 取得評價統計
   */
  async getReviewStats(userId: string) {
    const [
      { count: totalReviews },
      { data: ratingDistribution },
      { data: reviews },
    ] = await Promise.all([
      this.db
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("reviewee_id", userId),
      this.db
        .from("reviews")
        .select("rating")
        .eq("reviewee_id", userId),
      this.db
        .from("reviews")
        .select("rating")
        .eq("reviewee_id", userId),
    ]);

    // 計算評分分布
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    (ratingDistribution || []).forEach((item: any) => {
      distribution[item.rating] = (distribution[item.rating] || 0) + 1;
    });

    // 計算平均評分
    const averageRating =
      (reviews || []).length > 0
        ? (reviews || []).reduce((sum: number, r: any) => sum + r.rating, 0) /
          (reviews || []).length
        : 0;

    return {
      total_reviews: totalReviews || 0,
      average_rating: averageRating,
      rating_distribution: distribution,
    };
  }
}
