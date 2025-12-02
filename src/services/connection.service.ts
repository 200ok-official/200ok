import { BaseService } from "./base.service";
import { BadRequestError } from "@/middleware/error.middleware";

export type ConnectionStatus = 'pending' | 'connected' | 'expired';
export type ConnectionType = 'direct' | 'project_proposal';

export interface UserConnection {
  id: string;
  initiator_id: string;
  recipient_id: string;
  connection_type: ConnectionType;
  status: ConnectionStatus;
  conversation_id: string | null;
  initiator_unlocked_at: string;
  recipient_unlocked_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectionStatusDetail {
  connection_id: string;
  status: ConnectionStatus;
  conversation_id: string | null;
  initiator_id: string;
  recipient_id: string;
  initiator_unlocked_at: string;
  recipient_unlocked_at: string | null;
  created_at: string;
}

export class ConnectionService extends BaseService {
  /**
   * 檢查兩個用戶是否已連接
   */
  async areUsersConnected(
    user1Id: string,
    user2Id: string,
    type: ConnectionType = 'direct'
  ): Promise<boolean> {
    const { data, error } = await this.db.rpc('are_users_connected', {
      user1_id: user1Id,
      user2_id: user2Id,
      conn_type: type,
    });

    if (error) {
      console.error('[ARE_USERS_CONNECTED_ERROR]', error);
      return false;
    }

    return data === true;
  }

  /**
   * 獲取連接狀態詳情
   */
  async getConnectionStatus(
    user1Id: string,
    user2Id: string,
    type: ConnectionType = 'direct'
  ): Promise<ConnectionStatusDetail | null> {
    const { data, error } = await this.db.rpc('get_connection_status', {
      user1_id: user1Id,
      user2_id: user2Id,
      conn_type: type,
    });

    if (error) {
      console.error('[GET_CONNECTION_STATUS_ERROR]', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0];
  }

  /**
   * 創建新連接（發起者付費時調用）
   */
  async createConnection(
    initiatorId: string,
    recipientId: string,
    type: ConnectionType,
    conversationId: string,
    expiresInDays?: number
  ): Promise<UserConnection> {
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // 對於直接聯絡，雙方都立即解鎖
    const isDirectContact = type === 'direct';

    const { data, error } = await this.db
      .from('user_connections')
      .insert({
        initiator_id: initiatorId,
        recipient_id: recipientId,
        connection_type: type,
        status: isDirectContact ? 'connected' : 'pending',
        conversation_id: conversationId,
        initiator_unlocked_at: new Date().toISOString(),
        recipient_unlocked_at: isDirectContact ? new Date().toISOString() : null,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestError(`創建連接失敗: ${error.message}`);
    }

    return data;
  }

  /**
   * 接收者解鎖（接收者付費時調用）
   */
  async unlockConnection(
    connectionId: string,
    recipientId: string
  ): Promise<UserConnection> {
    const { data, error } = await this.db
      .from('user_connections')
      .update({
        recipient_unlocked_at: new Date().toISOString(),
        status: 'connected',
        expires_at: null,
      })
      .eq('id', connectionId)
      .eq('recipient_id', recipientId)
      .select()
      .single();

    if (error) {
      throw new BadRequestError(`解鎖連接失敗: ${error.message}`);
    }

    return data;
  }

  /**
   * 獲取用戶的所有連接
   */
  async getUserConnections(
    userId: string,
    status?: ConnectionStatus
  ): Promise<any[]> {
    const { data, error } = await this.db.rpc('get_user_connections', {
      p_user_id: userId,
      p_status: status || null,
    });

    if (error) {
      throw new BadRequestError(`獲取連接列表失敗: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 檢查連接是否需要付費（用於前端顯示）
   */
  async checkNeedsPayment(
    currentUserId: string,
    targetUserId: string,
    type: ConnectionType = 'direct'
  ): Promise<{
    needsPayment: boolean;
    status: ConnectionStatus | null;
    conversationId: string | null;
    userRole: 'initiator' | 'recipient' | 'none';
  }> {
    const connection = await this.getConnectionStatus(currentUserId, targetUserId, type);

    if (!connection) {
      return {
        needsPayment: true,
        status: null,
        conversationId: null,
        userRole: 'none',
      };
    }

    const isInitiator = connection.initiator_id === currentUserId;
    const isRecipient = connection.recipient_id === currentUserId;

    // 如果已連接，不需要付費
    if (connection.status === 'connected') {
      return {
        needsPayment: false,
        status: 'connected',
        conversationId: connection.conversation_id,
        userRole: isInitiator ? 'initiator' : 'recipient',
      };
    }

    // Pending 狀態：
    // - 如果是發起者，已經付費，不需要再付
    // - 如果是接收者，需要付費
    if (connection.status === 'pending') {
      return {
        needsPayment: isRecipient,
        status: 'pending',
        conversationId: connection.conversation_id,
        userRole: isInitiator ? 'initiator' : isRecipient ? 'recipient' : 'none',
      };
    }

    // Expired - 需要重新付費
    return {
      needsPayment: true,
      status: 'expired',
      conversationId: null,
      userRole: 'none',
    };
  }

  /**
   * 標記過期的連接
   */
  async markExpiredConnections(): Promise<number> {
    const { data, error } = await this.db.rpc('mark_expired_connections');

    if (error) {
      console.error('[MARK_EXPIRED_ERROR]', error);
      return 0;
    }

    return data || 0;
  }

  /**
   * 獲取連接（用於遷移現有數據）
   */
  async findExistingConnection(
    user1Id: string,
    user2Id: string,
    type: ConnectionType
  ): Promise<UserConnection | null> {
    const { data, error } = await this.db
      .from('user_connections')
      .select('*')
      .or(
        `and(initiator_id.eq.${user1Id},recipient_id.eq.${user2Id}),and(initiator_id.eq.${user2Id},recipient_id.eq.${user1Id})`
      )
      .eq('connection_type', type)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 找不到記錄
        return null;
      }
      console.error('[FIND_CONNECTION_ERROR]', error);
      return null;
    }

    return data;
  }
}

