import { BaseService } from "./base.service";
import { TokenService } from "./token.service";
import { ConnectionService } from "./connection.service";
import { BadRequestError, UnauthorizedError, NotFoundError } from "@/middleware/error.middleware";

export type ConversationType = 'direct' | 'project_proposal';

export interface Conversation {
  id: string;
  type: ConversationType;
  project_id?: string;
  bid_id?: string;
  is_unlocked: boolean;
  initiator_id: string;
  recipient_id: string;
  initiator_paid: boolean;
  recipient_paid: boolean;
  initiator_unlocked_at?: string;
  recipient_unlocked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_urls?: string[];
  is_read: boolean;
  created_at: string;
}

export class ConversationService extends BaseService {
  private tokenService: TokenService;
  private connectionService: ConnectionService;

  constructor() {
    super();
    this.tokenService = new TokenService();
    this.connectionService = new ConnectionService();
  }

  /**
   * 創建直接聯絡對話（付費 200 代幣）
   */
  async createDirectConversation(
    initiatorId: string,
    recipientId: string
  ): Promise<Conversation> {
    // 1. 檢查是否已存在連接
    const existingConnection = await this.connectionService.getConnectionStatus(
      initiatorId,
      recipientId,
      'direct'
    );

    if (existingConnection) {
      if (existingConnection.status === 'connected') {
        throw new BadRequestError("已存在與該使用者的對話");
      }
      // 如果是 pending 或 expired，允許重新創建
    }

    // 2. 檢查餘額
    const hasSufficient = await this.tokenService.hasSufficientBalance(initiatorId, 200);
    if (!hasSufficient) {
      throw new BadRequestError("代幣餘額不足，需要 200 代幣");
    }

    // 3. 創建對話
    const { data: conversation, error } = await this.db
      .from("conversations")
      .insert({
        type: 'direct',
        initiator_id: initiatorId,
        recipient_id: recipientId,
        initiator_paid: true,
        recipient_paid: true, // 直接聯絡只需發起者付費
        is_unlocked: true,
        initiator_unlocked_at: new Date().toISOString(),
        recipient_unlocked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestError(`創建對話失敗: ${error.message}`);
    }

    // 4. 扣除代幣
    await this.tokenService.deductTokens(
      initiatorId,
      200,
      'unlock_direct_contact',
      conversation.id,
      `解鎖與使用者 ${recipientId} 的直接聯絡`
    );

    // 5. 創建連接記錄
    await this.connectionService.createConnection(
      initiatorId,
      recipientId,
      'direct',
      conversation.id,
      undefined // 直接聯絡不過期
    );

    return conversation;
  }

  /**
   * 創建提案對話（工程師提交提案，付費 100 代幣）
   */
  async createProposalConversation(
    initiatorId: string,
    projectId: string,
    initialMessage: string,
    bidData: {
      amount: number;
      estimated_days: number;
      proposal: string;
    }
  ): Promise<{ conversation_id: string; bid_id: string }> {
    // 1. 獲取案件資訊，找出發案者
    const { data: project, error: projectError } = await this.db
      .from("projects")
      .select("client_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new BadRequestError(`找不到案件 (ID: ${projectId}, Error: ${projectError?.message || 'No data'})`);
    }

    const recipientId = project.client_id;

    // 確保不能向自己的案件提案
    if (initiatorId === recipientId) {
      throw new BadRequestError("不能向自己的案件提案");
    }

    // 2. 檢查餘額
    const hasSufficient = await this.tokenService.hasSufficientBalance(initiatorId, 100);
    if (!hasSufficient) {
      throw new BadRequestError("代幣餘額不足，需要 100 代幣");
    }

    // 3. 創建投標記錄
    const { data: bid, error: bidError } = await this.db
      .from("bids")
      .insert({
        project_id: projectId,
        freelancer_id: initiatorId,
        bid_amount: bidData.amount,
        estimated_days: bidData.estimated_days,
        proposal: bidData.proposal,
        status: 'pending',
      })
      .select()
      .single();

    if (bidError || !bid) {
      throw new BadRequestError(`創建投標失敗: ${bidError?.message || '未知錯誤'}`);
    }

    // 4. 創建對話
    const { data: conversation, error } = await this.db
      .from("conversations")
      .insert({
        type: 'project_proposal',
        project_id: projectId,
        bid_id: bid.id,
        initiator_id: initiatorId,
        recipient_id: recipientId,
        initiator_paid: true,
        recipient_paid: false,
        is_unlocked: false,
        initiator_unlocked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestError(`創建提案對話失敗: ${error.message}`);
    }

    // 5. 發送初始訊息
    const { error: messageError } = await this.db
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: initiatorId,
        content: initialMessage,
      });

    if (messageError) {
      console.error("發送初始訊息失敗:", messageError);
      // 不拋出錯誤，因為對話已經創建成功
    }

    // 6. 扣除代幣
    await this.tokenService.deductTokens(
      initiatorId,
      100,
      'submit_proposal',
      conversation.id,
      `提交提案到案件 ${projectId}`
    );

    // 7. 創建連接記錄（pending 狀態，7天後過期）
    await this.connectionService.createConnection(
      initiatorId,
      recipientId,
      'project_proposal',
      conversation.id,
      7 // 7天後過期
    );

    return {
      conversation_id: conversation.id,
      bid_id: bid.id,
    };
  }

  /**
   * 發案者解鎖提案（付費 100 代幣）
   */
  async unlockProposal(
    conversationId: string,
    recipientId: string
  ): Promise<Conversation> {
    // 取得對話
    const { data: conversation, error } = await this.db
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("recipient_id", recipientId)
      .single();

    if (error || !conversation) {
      throw new NotFoundError("找不到該對話");
    }

    if (conversation.type !== 'project_proposal') {
      throw new BadRequestError("只有提案對話需要解鎖");
    }

    if (conversation.recipient_paid) {
      throw new BadRequestError("您已經解鎖過此提案");
    }

    // 檢查餘額
    const hasSufficient = await this.tokenService.hasSufficientBalance(recipientId, 100);
    if (!hasSufficient) {
      throw new BadRequestError("代幣餘額不足，需要 100 代幣");
    }

    // 更新對話狀態
    const { data: updated, error: updateError } = await this.db
      .from("conversations")
      .update({
        recipient_paid: true,
        is_unlocked: true,
        recipient_unlocked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)
      .select()
      .single();

    if (updateError) {
      throw new BadRequestError(`解鎖提案失敗: ${updateError.message}`);
    }

    // 扣除代幣
    await this.tokenService.deductTokens(
      recipientId,
      100,
      'view_proposal',
      conversationId,
      `查看提案 ${conversation.bid_id}`
    );

    // 更新連接狀態為 connected
    const { data: connectionData } = await this.db
      .from('user_connections')
      .select('id')
      .eq('conversation_id', conversationId)
      .single();

    if (connectionData) {
      await this.connectionService.unlockConnection(
        connectionData.id,
        recipientId
      );
    }

    return updated;
  }

  /**
   * 查找現有的直接對話
   */
  private async findExistingDirectConversation(
    userId1: string,
    userId2: string
  ): Promise<Conversation | null> {
    const { data } = await this.db
      .from("conversations")
      .select("*")
      .eq("type", "direct")
      .or(`and(initiator_id.eq.${userId1},recipient_id.eq.${userId2}),and(initiator_id.eq.${userId2},recipient_id.eq.${userId1})`)
      .single();

    return data;
  }

  /**
   * 取得使用者的所有對話
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    // 使用安全函式取得對話列表
    const { data, error } = await this.db
      .rpc('get_my_conversations', { p_user_id: userId });

    if (error) {
      throw new BadRequestError(`取得對話列表失敗: ${error.message}`);
    }

    // 補充額外資訊（使用者、專案、最後訊息）
    if (data && data.length > 0) {
      const conversationIds = data.map((c: any) => c.id);
      
      // 取得使用者資訊
      const userIds = [...new Set(data.flatMap((c: any) => [c.initiator_id, c.recipient_id]))];
      const { data: users } = await this.db
        .from('users')
        .select('id, name, avatar_url')
        .in('id', userIds);
      
      // 取得專案資訊
      const projectIds = data.filter((c: any) => c.project_id).map((c: any) => c.project_id);
      const { data: projects } = projectIds.length > 0 
        ? await this.db.from('projects').select('id, title').in('id', projectIds)
        : { data: [] };
      
      // 取得最後訊息
      const { data: lastMessages } = await this.db
        .from('messages')
        .select('conversation_id, content, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });
      
      // 組合資料
      return data.map((conv: any) => ({
        ...conv,
        initiator: users?.find((u: any) => u.id === conv.initiator_id),
        recipient: users?.find((u: any) => u.id === conv.recipient_id),
        project: projects?.find((p: any) => p.id === conv.project_id),
        last_message: lastMessages?.filter((m: any) => m.conversation_id === conv.id).slice(0, 1),
      }));
    }

    return data || [];
  }

  /**
   * 取得單一對話
   */
  async getConversation(conversationId: string, userId: string): Promise<Conversation> {
    const { data, error } = await this.db
      .from("conversations")
      .select(`
        *,
        initiator:users!conversations_initiator_id_fkey(id, name, email, phone, avatar_url),
        recipient:users!conversations_recipient_id_fkey(id, name, email, phone, avatar_url),
        project:projects(id, title)
      `)
      .eq("id", conversationId)
      .or(`initiator_id.eq.${userId},recipient_id.eq.${userId}`)
      .single();

    if (error || !data) {
      throw new NotFoundError("找不到該對話或無權限查看");
    }

    return data;
  }

  /**
   * 發送訊息
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string
  ): Promise<Message> {
    // 檢查對話是否存在且已解鎖
    const conversation = await this.getConversation(conversationId, senderId);

    if (!conversation.is_unlocked) {
      throw new UnauthorizedError("對話尚未解鎖，無法發送訊息");
    }

    // 如果是提案對話，檢查發送限制
    if (conversation.type === 'project_proposal') {
      // 工程師（發起者）只能在發案者回應前發送一次（提案內容）
      if (senderId === conversation.initiator_id && !conversation.recipient_paid) {
        const { count } = await this.db
          .from("messages")
          .select("*", { count: 'exact', head: true })
          .eq("conversation_id", conversationId)
          .eq("sender_id", senderId);

        if (count && count > 0) {
          throw new UnauthorizedError("請等待發案者解鎖提案後才能繼續對話");
        }
      }
    }

    // 創建訊息
    const { data: message, error } = await this.db
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestError(`發送訊息失敗: ${error.message}`);
    }

    // 更新對話的 updated_at
    await this.db
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return message;
  }

  /**
   * 取得對話的訊息列表
   */
  async getMessages(
    conversationId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    // 檢查權限
    await this.getConversation(conversationId, userId);

    // 先獲取訊息
    const { data: messages, error } = await this.db
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new BadRequestError(`取得訊息失敗: ${error.message}`);
    }

    if (!messages || messages.length === 0) {
      return [];
    }

    // 獲取所有發送者的資訊
    const senderIds = [...new Set(messages.map(m => m.sender_id))];
    const { data: senders } = await this.db
      .from("users")
      .select("id, name, avatar_url")
      .in("id", senderIds);

    // 建立發送者映射
    const senderMap = new Map();
    if (senders) {
      senders.forEach(sender => senderMap.set(sender.id, sender));
    }

    // 組合訊息和發送者資訊
    const data = messages.map(message => ({
      ...message,
      sender: senderMap.get(message.sender_id) || { id: message.sender_id, name: 'Unknown', avatar_url: null }
    }));

    return data || [];
  }

  /**
   * 標記訊息為已讀
   */
  async markAsRead(messageIds: string[], userId: string): Promise<void> {
    const { error } = await this.db
      .from("messages")
      .update({ is_read: true })
      .in("id", messageIds)
      .neq("sender_id", userId); // 只標記別人發送的訊息

    if (error) {
      console.error("[MARK_AS_READ_ERROR]", error);
    }
  }

  /**
   * 取得未讀訊息數量
   */
  async getUnreadCount(userId: string): Promise<number> {
    // 使用安全函式取得未讀訊息統計
    const { data, error } = await this.db
      .rpc('get_unread_messages', { p_user_id: userId });

    if (error) {
      console.error("[GET_UNREAD_COUNT_ERROR]", error);
      return 0;
    }

    // 計算總未讀數
    if (data && Array.isArray(data)) {
      return data.reduce((total: number, item: any) => total + (item.unread_count || 0), 0);
    }

    return 0;
  }
}

