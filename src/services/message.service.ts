import { BaseService } from "./base.service";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "@/middleware/error.middleware";

export interface CreateMessageData {
  content: string;
  receiver_id: string;
  attachment_urls?: string[];
}

export class MessageService extends BaseService {
  /**
   * 發送訊息
   */
  async sendMessage(
    projectId: string,
    senderId: string,
    data: CreateMessageData
  ) {
    // 檢查案件是否存在
    const { data: project, error } = await this.db
      .from("projects")
      .select("id, client_id")
      .eq("id", projectId)
      .single();

    if (error || !project) {
      throw new NotFoundError("案件不存在");
    }

    // 取得接受的投標
    const { data: acceptedBid } = await this.db
      .from("bids")
      .select("freelancer_id")
      .eq("project_id", projectId)
      .eq("status", "accepted")
      .single();

    const acceptedFreelancerId = acceptedBid?.freelancer_id;
    const isClient = (project as any).client_id === senderId;
    const isAcceptedFreelancer = acceptedFreelancerId === senderId;

    if (!isClient && !isAcceptedFreelancer) {
      throw new ForbiddenError("您沒有權限在此案件中發送訊息");
    }

    // 檢查接收者是否有效
    const { receiver_id } = data;
    const isReceiverClient = (project as any).client_id === receiver_id;
    const isReceiverFreelancer = acceptedFreelancerId === receiver_id;

    if (!isReceiverClient && !isReceiverFreelancer) {
      throw new BadRequestError("無效的接收者");
    }

    if (senderId === receiver_id) {
      throw new BadRequestError("不能發送訊息給自己");
    }

    // 建立訊息
    const { data: message, error: insertError } = await this.db
      .from("messages")
      .insert({
        project_id: projectId,
        sender_id: senderId,
        receiver_id: receiver_id,
        content: data.content,
        attachment_urls: data.attachment_urls || [],
      })
      .select(
        `
        *,
        sender:users!messages_sender_id_fkey(id, name, avatar_url),
        receiver:users!messages_receiver_id_fkey(id, name, avatar_url)
      `
      )
      .single();

    if (insertError || !message) {
      throw new BadRequestError(`發送訊息失敗: ${insertError?.message}`);
    }

    // 建立通知給接收者
    await this.db.from("notifications").insert({
      user_id: receiver_id,
      type: "message",
      title: "收到新訊息",
      content: `${(message as any).sender.name} 發送了一則訊息`,
      related_project_id: projectId,
    });

    return message;
  }

  /**
   * 取得案件的訊息列表
   */
  async getProjectMessages(
    projectId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ) {
    const offset = (page - 1) * limit;

    // 檢查案件是否存在
    const { data: project, error } = await this.db
      .from("projects")
      .select("id, client_id")
      .eq("id", projectId)
      .single();

    if (error || !project) {
      throw new NotFoundError("案件不存在");
    }

    // 取得接受的投標
    const { data: acceptedBid } = await this.db
      .from("bids")
      .select("freelancer_id")
      .eq("project_id", projectId)
      .eq("status", "accepted")
      .single();

    // 檢查權限
    const isClient = (project as any).client_id === userId;
    const isAcceptedFreelancer = acceptedBid?.freelancer_id === userId;

    if (!isClient && !isAcceptedFreelancer) {
      throw new ForbiddenError("您沒有權限查看此案件的訊息");
    }

    // 查詢訊息
    const [
      { data: messages, error: messagesError },
      { count: total },
    ] = await Promise.all([
      this.db
        .from("messages")
        .select(
          `
          *,
          sender:users!messages_sender_id_fkey(id, name, avatar_url),
          receiver:users!messages_receiver_id_fkey(id, name, avatar_url)
        `
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })
        .range(offset, offset + limit - 1),
      this.db
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
    ]);

    if (messagesError) {
      throw new BadRequestError(`取得訊息失敗: ${messagesError.message}`);
    }

    // 標記所有未讀訊息為已讀
    await this.db
      .from("messages")
      .update({ is_read: true })
      .eq("project_id", projectId)
      .eq("receiver_id", userId)
      .eq("is_read", false);

    return {
      messages: messages || [],
      pagination: {
        page,
        limit,
        total: total || 0,
        total_pages: Math.ceil((total || 0) / limit),
      },
    };
  }

  /**
   * 標記訊息為已讀
   */
  async markMessageAsRead(messageId: string, userId: string) {
    const { data: message, error: fetchError } = await this.db
      .from("messages")
      .select("id, receiver_id, is_read")
      .eq("id", messageId)
      .single();

    if (fetchError || !message) {
      throw new NotFoundError("訊息不存在");
    }

    if ((message as any).receiver_id !== userId) {
      throw new ForbiddenError("您沒有權限標記此訊息為已讀");
    }

    if ((message as any).is_read) {
      return message;
    }

    const { data: updatedMessage, error } = await this.db
      .from("messages")
      .update({ is_read: true })
      .eq("id", messageId)
      .select()
      .single();

    if (error || !updatedMessage) {
      throw new BadRequestError(`標記已讀失敗: ${error?.message}`);
    }

    return updatedMessage;
  }

  /**
   * 取得所有對話列表
   */
  async getConversations(userId: string) {
    // 找出所有與此使用者相關的專案（作為發案者或接案者）
    const { data: projects, error } = await this.db
      .from("projects")
      .select(
        `
        *,
        client:users!projects_client_id_fkey(id, name, avatar_url)
      `
      )
      .or(`client_id.eq.${userId}`);

    if (error) {
      throw new BadRequestError(`取得對話列表失敗: ${error.message}`);
    }

    // 取得作為接案者的專案
    const { data: acceptedBids } = await this.db
      .from("bids")
      .select("project_id")
      .eq("freelancer_id", userId)
      .eq("status", "accepted");

    const freelancerProjectIds = (acceptedBids || []).map((b: any) => b.project_id);

    if (freelancerProjectIds.length > 0) {
      const { data: freelancerProjects } = await this.db
        .from("projects")
        .select(
          `
          *,
          client:users!projects_client_id_fkey(id, name, avatar_url)
        `
        )
        .in("id", freelancerProjectIds);

      if (freelancerProjects) {
        projects?.push(...freelancerProjects);
      }
    }

    // 整理對話列表
    const conversations = await Promise.all(
      (projects || []).map(async (project: any) => {
        const isClient = project.client_id === userId;

        // 取得對方使用者資訊
        let otherUser = null;
        if (isClient) {
          const { data: acceptedBid } = await this.db
            .from("bids")
            .select("freelancer:users!bids_freelancer_id_fkey(id, name, avatar_url)")
            .eq("project_id", project.id)
            .eq("status", "accepted")
            .single();

          otherUser = acceptedBid ? (acceptedBid as any).freelancer : null;
        } else {
          otherUser = project.client;
        }

        if (!otherUser) {
          return null;
        }

        // 取得最後一則訊息
        const { data: lastMessage } = await this.db
          .from("messages")
          .select("*")
          .eq("project_id", project.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // 計算未讀訊息數
        const { count: unreadCount } = await this.db
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("project_id", project.id)
          .eq("receiver_id", userId)
          .eq("is_read", false);

        return {
          project_id: project.id,
          project_title: project.title,
          other_user: otherUser,
          last_message: lastMessage || null,
          unread_count: unreadCount || 0,
        };
      })
    );

    return conversations.filter((conv) => conv !== null);
  }

  /**
   * 取得未讀訊息數量
   */
  async getUnreadCount(userId: string) {
    const { count } = await this.db
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("is_read", false);

    return { unread_count: count || 0 };
  }
}
