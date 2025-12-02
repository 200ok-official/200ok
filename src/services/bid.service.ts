import { BaseService } from "./base.service";
import { ConversationService } from "./conversation.service";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "@/middleware/error.middleware";

export type BidStatus = 'pending' | 'accepted' | 'rejected';
export type ProjectStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'closed' | 'cancelled';

export interface CreateBidData {
  proposal_content: string;
  proposed_amount: number;
  estimated_days: number;
}

export interface UpdateBidData {
  proposal?: string;
  bid_amount?: number;
}

export class BidService extends BaseService {
  private conversationService: ConversationService;

  constructor() {
    super();
    this.conversationService = new ConversationService();
  }

  /**
   * 建立投標（含付費對話創建）
   */
  async createBid(
    projectId: string,
    freelancerId: string,
    data: CreateBidData
  ) {
    // 檢查案件是否存在且狀態為 open
    const { data: project, error: projectError } = await this.db
      .from("projects")
      .select("id, client_id, status, budget_min, budget_max, budget_estimate_only, title")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new NotFoundError("案件不存在");
    }

    if ((project as any).status !== 'open') {
      throw new BadRequestError("此案件目前不接受投標");
    }

    // 不能投標自己的案件
    if ((project as any).client_id === freelancerId) {
      throw new BadRequestError("不能投標自己的案件");
    }

    // 檢查是否已投標過
    const { data: existingBid } = await this.db
      .from("bids")
      .select("id")
      .eq("project_id", projectId)
      .eq("freelancer_id", freelancerId)
      .single();

    if (existingBid) {
      throw new BadRequestError("您已經投標過此案件");
    }

    // 驗證報價是否在預算範圍內（如果不是「先估型」）
    if (!(project as any).budget_estimate_only) {
      if (
        data.proposed_amount < (project as any).budget_min ||
        data.proposed_amount > (project as any).budget_max
      ) {
        throw new BadRequestError(
          `報價需在預算範圍內：$${(project as any).budget_min} - $${(project as any).budget_max}`
        );
      }
    }

    // 建立投標
    const { data: bid, error } = await this.db
      .from("bids")
      .insert({
        project_id: projectId,
        freelancer_id: freelancerId,
        proposal: data.proposal_content,
        bid_amount: data.proposed_amount,
        estimated_days: data.estimated_days,
      })
      .select(
        `
        *,
        freelancer:users!bids_freelancer_id_fkey(id, name, avatar_url, rating, skills, bio),
        project:projects(id, title, client_id)
      `
      )
      .single();

    if (error || !bid) {
      throw new BadRequestError(`投標失敗: ${error?.message}`);
    }

    // 創建提案對話（自動扣款 100 代幣）
    const conversation = await this.conversationService.createProposalConversation(
      freelancerId,
      (project as any).client_id,
      projectId,
      (bid as any).id
    );

    // 發送初始提案訊息
    await this.conversationService.sendMessage(
      conversation.id,
      freelancerId,
      data.proposal_content
    );

    // 建立通知給發案者
    await this.db.from("notifications").insert({
      user_id: (project as any).client_id,
      type: "bid_received",
      title: "收到新提案",
      content: `${(bid as any).freelancer.name} 對您的案件「${(project as any).title}」提交了提案`,
      related_project_id: projectId,
      related_bid_id: (bid as any).id,
    });

    return {
      ...bid,
      conversation_id: conversation.id,
    };
  }

  /**
   * 取得案件的所有投標
   */
  async getProjectBids(projectId: string, clientId: string) {
    // 檢查案件是否存在
    const { data: project, error: projectError } = await this.db
      .from("projects")
      .select("id, client_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new NotFoundError("案件不存在");
    }

    // 只有發案者可以查看所有投標
    if ((project as any).client_id !== clientId) {
      throw new ForbiddenError("您沒有權限查看此案件的投標");
    }

    // 查詢投標
    const { data: bids, error } = await this.db
      .from("bids")
      .select(
        `
        *,
        freelancer:users!bids_freelancer_id_fkey(id, name, avatar_url, rating, skills, bio, portfolio_links)
      `
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new BadRequestError(`取得投標失敗: ${error.message}`);
    }

    return bids || [];
  }

  /**
   * 取得投標詳情
   */
  async getBidById(bidId: string, userId: string) {
    const { data: bid, error } = await this.db
      .from("bids")
      .select(
        `
        *,
        freelancer:users!bids_freelancer_id_fkey(id, name, avatar_url, rating, skills, bio, portfolio_links),
        project:projects(id, title, client_id, status)
      `
      )
      .eq("id", bidId)
      .single();

    if (error || !bid) {
      throw new NotFoundError("投標不存在");
    }

    // 只有投標者本人或發案者可以查看
    if (
      (bid as any).freelancer_id !== userId &&
      (bid as any).project.client_id !== userId
    ) {
      throw new ForbiddenError("您沒有權限查看此投標");
    }

    return bid;
  }

  /**
   * 更新投標
   */
  async updateBid(bidId: string, freelancerId: string, data: UpdateBidData) {
    // 檢查投標是否存在
    const { data: bid, error: fetchError } = await this.db
      .from("bids")
      .select(
        `
        id,
        freelancer_id,
        status,
        project:projects(budget_min, budget_max, budget_estimate_only)
      `
      )
      .eq("id", bidId)
      .single();

    if (fetchError || !bid) {
      throw new NotFoundError("投標不存在");
    }

    // 檢查權限
    if ((bid as any).freelancer_id !== freelancerId) {
      throw new ForbiddenError("您沒有權限修改此投標");
    }

    // 只有 pending 狀態可以修改
    if ((bid as any).status !== 'pending') {
      throw new BadRequestError("只有待審核的投標可以修改");
    }

    // 驗證報價是否在預算範圍內（如果有更新報價且不是「先估型」）
    if (data.bid_amount && !(bid as any).project.budget_estimate_only) {
      if (
        data.bid_amount < (bid as any).project.budget_min ||
        data.bid_amount > (bid as any).project.budget_max
      ) {
        throw new BadRequestError(
          `報價需在預算範圍內：$${(bid as any).project.budget_min} - $${(bid as any).project.budget_max}`
        );
      }
    }

    // 更新投標
    const { data: updatedBid, error } = await this.db
      .from("bids")
      .update({
        ...(data.proposal && { proposal: data.proposal }),
        ...(data.bid_amount && { bid_amount: data.bid_amount }),
      })
      .eq("id", bidId)
      .select(
        `
        *,
        freelancer:users!bids_freelancer_id_fkey(id, name, avatar_url, rating, skills)
      `
      )
      .single();

    if (error || !updatedBid) {
      throw new BadRequestError(`更新投標失敗: ${error?.message}`);
    }

    return updatedBid;
  }

  /**
   * 撤回投標
   */
  async withdrawBid(bidId: string, freelancerId: string) {
    // 檢查投標是否存在
    const { data: bid, error: fetchError } = await this.db
      .from("bids")
      .select("id, freelancer_id, status")
      .eq("id", bidId)
      .single();

    if (fetchError || !bid) {
      throw new NotFoundError("投標不存在");
    }

    // 檢查權限
    if ((bid as any).freelancer_id !== freelancerId) {
      throw new ForbiddenError("您沒有權限撤回此投標");
    }

    // 只有 pending 狀態可以撤回
    if ((bid as any).status !== 'pending') {
      throw new BadRequestError("只有待審核的投標可以撤回");
    }

    // 刪除投標
    const { error } = await this.db.from("bids").delete().eq("id", bidId);

    if (error) {
      throw new BadRequestError(`撤回投標失敗: ${error.message}`);
    }
  }

  /**
   * 接受投標
   */
  async acceptBid(bidId: string, clientId: string) {
    // 檢查投標是否存在
    const { data: bid, error: fetchError } = await this.db
      .from("bids")
      .select(
        `
        *,
        project:projects(id, client_id, status, title),
        freelancer:users!bids_freelancer_id_fkey(id, name)
      `
      )
      .eq("id", bidId)
      .single();

    if (fetchError || !bid) {
      throw new NotFoundError("投標不存在");
    }

    // 檢查權限
    if ((bid as any).project.client_id !== clientId) {
      throw new ForbiddenError("您沒有權限接受此投標");
    }

    // 案件狀態必須是 open
    if ((bid as any).project.status !== 'open') {
      throw new BadRequestError("此案件目前不接受投標");
    }

    // 投標狀態必須是 pending
    if ((bid as any).status !== 'pending') {
      throw new BadRequestError("此投標狀態不允許接受");
    }

    // 更新投標狀態為 accepted
    const { data: acceptedBid, error: updateError } = await this.db
      .from("bids")
      .update({ status: 'accepted' })
      .eq("id", bidId)
      .select(
        `
        *,
        freelancer:users!bids_freelancer_id_fkey(id, name, avatar_url, rating, skills)
      `
      )
      .single();

    if (updateError || !acceptedBid) {
      throw new BadRequestError(`接受投標失敗: ${updateError?.message}`);
    }

    // 更新案件狀態為 in_progress 並記錄被接受的投標
    await this.db
      .from("projects")
      .update({
        status: 'in_progress',
        accepted_bid_id: bidId,
      })
      .eq("id", (bid as any).project.id);

    // 拒絕其他所有 pending 的投標
    const { data: otherBids } = await this.db
      .from("bids")
      .select("id, freelancer_id")
      .eq("project_id", (bid as any).project.id)
      .neq("id", bidId)
      .eq("status", 'pending');

    if (otherBids && otherBids.length > 0) {
      await this.db
        .from("bids")
        .update({ status: 'rejected' })
        .eq("project_id", (bid as any).project.id)
        .neq("id", bidId)
        .eq("status", 'pending');

      // 為其他投標者建立通知
      const notifications = otherBids.map((otherBid: any) => ({
        user_id: otherBid.freelancer_id,
        type: "bid_rejected",
        title: "投標未被接受",
        content: `您對案件「${(bid as any).project.title}」的投標未被接受`,
        related_project_id: (bid as any).project.id,
        related_bid_id: otherBid.id,
      }));

      await this.db.from("notifications").insert(notifications);
    }

    // 為接案者建立通知
    await this.db.from("notifications").insert({
      user_id: (bid as any).freelancer.id,
      type: "bid_accepted",
      title: "投標已接受",
      content: `恭喜！您對案件「${(bid as any).project.title}」的投標已被接受`,
      related_project_id: (bid as any).project.id,
      related_bid_id: bidId,
    });

    return acceptedBid;
  }

  /**
   * 拒絕投標
   */
  async rejectBid(bidId: string, clientId: string) {
    // 檢查投標是否存在
    const { data: bid, error: fetchError } = await this.db
      .from("bids")
      .select(
        `
        *,
        project:projects(id, client_id, title),
        freelancer:users!bids_freelancer_id_fkey(id, name)
      `
      )
      .eq("id", bidId)
      .single();

    if (fetchError || !bid) {
      throw new NotFoundError("投標不存在");
    }

    // 檢查權限
    if ((bid as any).project.client_id !== clientId) {
      throw new ForbiddenError("您沒有權限拒絕此投標");
    }

    // 投標狀態必須是 pending
    if ((bid as any).status !== 'pending') {
      throw new BadRequestError("此投標狀態不允許拒絕");
    }

    // 更新投標狀態
    const { data: rejectedBid, error } = await this.db
      .from("bids")
      .update({ status: 'rejected' })
      .eq("id", bidId)
      .select(
        `
        *,
        freelancer:users!bids_freelancer_id_fkey(id, name, avatar_url)
      `
      )
      .single();

    if (error || !rejectedBid) {
      throw new BadRequestError(`拒絕投標失敗: ${error?.message}`);
    }

    // 建立通知
    await this.db.from("notifications").insert({
      user_id: (bid as any).freelancer.id,
      type: "bid_rejected",
      title: "投標未被接受",
      content: `您對案件「${(bid as any).project.title}」的投標未被接受`,
      related_project_id: (bid as any).project.id,
      related_bid_id: bidId,
    });

    return rejectedBid;
  }

  /**
   * 取得我的投標
   */
  async getMyBids(
    freelancerId: string,
    status?: BidStatus,
    page: number = 1,
    limit: number = 10
  ) {
    const offset = (page - 1) * limit;

    let query = this.db
      .from("bids")
      .select(
        `
        *,
        project:projects(
          *,
          client:users!projects_client_id_fkey(id, name, avatar_url, rating),
          tags:project_tags(tag:tags(*))
        )
      `,
        { count: "exact" }
      )
      .eq("freelancer_id", freelancerId);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: bids, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new BadRequestError(`取得我的投標失敗: ${error.message}`);
    }

    return {
      bids: bids || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    };
  }
}
