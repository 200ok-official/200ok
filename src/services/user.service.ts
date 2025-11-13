import { BaseService } from "./base.service";
import { NotFoundError, BadRequestError } from "@/middleware/error.middleware";
import { hashPassword, comparePassword } from "@/utils/password";

export type UserRole = 'freelancer' | 'client' | 'admin';

export interface UpdateUserData {
  name?: string;
  bio?: string;
  skills?: string[];
  avatar_url?: string;
  portfolio_links?: string[];
}

export interface UpdatePasswordData {
  current_password: string;
  new_password: string;
}

export class UserService extends BaseService {
  /**
   * 取得使用者資料（公開）
   */
  async getUserById(userId: string) {
    const { data: user, error } = await this.db
      .from("users")
      .select(
        `
        id,
        name,
        email,
        roles,
        bio,
        skills,
        avatar_url,
        portfolio_links,
        rating,
        created_at
      `
      )
      .eq("id", userId)
      .single();

    if (error || !user) {
      throw new NotFoundError("使用者不存在");
    }

    // 計算統計資訊
    const [projectsCount, bidsCount, reviewsCount] = await Promise.all([
      this.db.from("projects").select("id", { count: "exact" }).eq("client_id", userId),
      this.db.from("bids").select("id", { count: "exact" }).eq("freelancer_id", userId),
      this.db.from("reviews").select("id", { count: "exact" }).eq("reviewee_id", userId),
    ]);

    return {
      ...user,
      _count: {
        projects_created: projectsCount.count || 0,
        bids: bidsCount.count || 0,
        reviews_received: reviewsCount.count || 0,
      },
    };
  }

  /**
   * 取得使用者完整資料（私密，含手機等）
   */
  async getUserProfile(userId: string) {
    const { data: user, error } = await this.db
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !user) {
      throw new NotFoundError("使用者不存在");
    }

    // 計算統計資訊
    const [projectsCount, bidsCount, reviewsCount] = await Promise.all([
      this.db.from("projects").select("id", { count: "exact" }).eq("client_id", userId),
      this.db.from("bids").select("id", { count: "exact" }).eq("freelancer_id", userId),
      this.db.from("reviews").select("id", { count: "exact" }).eq("reviewee_id", userId),
    ]);

    return {
      ...user,
      _count: {
        projects_created: projectsCount.count || 0,
        bids: bidsCount.count || 0,
        reviews_received: reviewsCount.count || 0,
      },
    };
  }

  /**
   * 更新使用者資料
   */
  async updateUser(userId: string, data: UpdateUserData) {
    // 檢查使用者是否存在
    await this.checkExists("users", userId, "使用者不存在");

    // 更新資料
    const { data: updatedUser, error } = await this.db
      .from("users")
      .update({
        ...(data.name && { name: data.name }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.skills && { skills: data.skills }),
        ...(data.avatar_url && { avatar_url: data.avatar_url }),
        ...(data.portfolio_links && { portfolio_links: data.portfolio_links }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select(
        `
        id,
        name,
        email,
        roles,
        bio,
        skills,
        avatar_url,
        portfolio_links,
        rating,
        updated_at
      `
      )
      .single();

    if (error || !updatedUser) {
      throw new BadRequestError(`更新失敗: ${error?.message}`);
    }

    return updatedUser;
  }

  /**
   * 更新密碼
   */
  async updatePassword(userId: string, data: UpdatePasswordData) {
    const { data: user, error: fetchError } = await this.db
      .from("users")
      .select("id, password_hash")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      throw new NotFoundError("使用者不存在");
    }

    if (!user.password_hash) {
      throw new BadRequestError("此帳號使用社群登入，無法修改密碼");
    }

    // 驗證目前密碼
    const isCurrentPasswordValid = await comparePassword(
      data.current_password,
      user.password_hash
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestError("目前密碼錯誤");
    }

    // 雜湊新密碼
    const newPasswordHash = await hashPassword(data.new_password);

    // 更新密碼
    const { error } = await this.db
      .from("users")
      .update({ password_hash: newPasswordHash })
      .eq("id", userId);

    if (error) {
      throw new BadRequestError(`更新密碼失敗: ${error.message}`);
    }

    // 刪除所有 refresh tokens（強制重新登入）
    await this.db.from("refresh_tokens").delete().eq("user_id", userId);
  }

  /**
   * 上傳大頭照
   */
  async uploadAvatar(userId: string, avatarUrl: string) {
    const { data: user, error } = await this.db
      .from("users")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId)
      .select("id, avatar_url")
      .single();

    if (error || !user) {
      throw new BadRequestError(`上傳大頭照失敗: ${error?.message}`);
    }

    return user;
  }

  /**
   * 更新技能標籤
   */
  async updateSkills(userId: string, skills: string[]) {
    const { data: user, error } = await this.db
      .from("users")
      .update({ skills })
      .eq("id", userId)
      .select("id, skills")
      .single();

    if (error || !user) {
      throw new BadRequestError(`更新技能失敗: ${error?.message}`);
    }

    return user;
  }

  /**
   * 新增角色
   */
  async addRole(userId: string, role: UserRole) {
    const { data: user, error: fetchError } = await this.db
      .from("users")
      .select("roles")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      throw new NotFoundError("使用者不存在");
    }

    if (user.roles.includes(role)) {
      throw new BadRequestError("此角色已存在");
    }

    const { data: updatedUser, error } = await this.db
      .from("users")
      .update({
        roles: [...user.roles, role],
      })
      .eq("id", userId)
      .select("id, roles")
      .single();

    if (error || !updatedUser) {
      throw new BadRequestError(`新增角色失敗: ${error?.message}`);
    }

    return updatedUser;
  }

  /**
   * 取得使用者的評價
   */
  async getUserReviews(userId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const [{ data: reviews, error }, { count: total }] = await Promise.all([
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
   * 取得使用者統計資訊
   */
  async getUserStats(userId: string) {
    const { data: user, error: userError } = await this.db
      .from("users")
      .select("rating, roles")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      throw new NotFoundError("使用者不存在");
    }

    const [{ count: projectsCreated }, { count: bidsCount }, { count: completedProjects }] =
      await Promise.all([
        this.db.from("projects").select("id", { count: "exact", head: true }).eq("client_id", userId),
        this.db.from("bids").select("id", { count: "exact", head: true }).eq("freelancer_id", userId),
        this.db
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("status", "completed")
          .or(`client_id.eq.${userId},bids.freelancer_id.eq.${userId}`),
      ]);

    return {
      rating: user.rating,
      projects_created: projectsCreated || 0,
      bids_count: bidsCount || 0,
      completed_projects: completedProjects || 0,
      is_freelancer: user.roles.includes('freelancer'),
      is_client: user.roles.includes('client'),
    };
  }

  /**
   * 搜尋使用者（接案者）
   */
  async searchFreelancers(params: {
    skills?: string[];
    minRating?: number;
    page?: number;
    limit?: number;
  }) {
    const { skills, minRating, page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    // 使用 PostgREST 的 cs (contains) 操作符來查詢 roles 數組
    let query = this.db
      .from("users")
      .select("id, name, bio, skills, avatar_url, rating, portfolio_links, created_at")
      .filter("roles", "cs", `{freelancer}`);

    if (skills && skills.length > 0) {
      query = query.overlaps("skills", skills);
    }

    if (minRating !== undefined) {
      query = query.gte("rating", minRating);
    }

    const [{ data: users, error }, { count: total }] = await Promise.all([
      query
        .order("rating", { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1),
      this.db
        .from("users")
        .select("id", { count: "exact", head: true })
        .filter("roles", "cs", `{freelancer}`),
    ]);

    if (error) {
      throw new BadRequestError(`搜尋失敗: ${error.message}`);
    }

    return {
      users: users || [],
      pagination: {
        page,
        limit,
        total: total || 0,
        total_pages: Math.ceil((total || 0) / limit),
      },
    };
  }
}
