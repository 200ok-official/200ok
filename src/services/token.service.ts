import { BaseService } from "./base.service";
import { BadRequestError, UnauthorizedError } from "@/middleware/error.middleware";

export type TransactionType = 
  | 'unlock_direct_contact'
  | 'submit_proposal'
  | 'view_proposal'
  | 'refund'
  | 'platform_fee'
  | 'purchase';

export interface TokenBalance {
  balance: number;
  total_earned: number;
  total_spent: number;
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  transaction_type: TransactionType;
  reference_id?: string;
  description?: string;
  created_at: string;
}

export class TokenService extends BaseService {
  /**
   * 取得使用者代幣餘額
   */
  async getBalance(userId: string): Promise<TokenBalance> {
    const { data, error } = await this.db
      .from("user_tokens")
      .select("balance, total_earned, total_spent")
      .eq("user_id", userId)
      .single();

    if (error) {
      // 如果不存在，創建新帳戶
      if (error.code === "PGRST116") {
        await this.createTokenAccount(userId);
        return { balance: 1000, total_earned: 1000, total_spent: 0 };
      }
      throw new BadRequestError(`取得代幣餘額失敗: ${error.message}`);
    }

    return data;
  }

  /**
   * 創建代幣帳戶（新使用者）
   */
  private async createTokenAccount(userId: string): Promise<void> {
    const initialBalance = 1000;

    const { error } = await this.db
      .from("user_tokens")
      .insert({
        user_id: userId,
        balance: initialBalance,
        total_earned: initialBalance,
        total_spent: 0,
      });

    if (error) {
      throw new BadRequestError(`創建代幣帳戶失敗: ${error.message}`);
    }

    // 記錄初始贈送交易
    await this.recordTransaction(
      userId,
      initialBalance,
      initialBalance,
      "platform_fee",
      undefined,
      "新用戶註冊贈送"
    );
  }

  /**
   * 檢查餘額是否足夠
   */
  async hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance.balance >= amount;
  }

  /**
   * 扣除代幣（內部方法，需要在交易中使用）
   */
  async deductTokens(
    userId: string,
    amount: number,
    transactionType: TransactionType,
    referenceId?: string,
    description?: string
  ): Promise<TokenBalance> {
    // 檢查餘額
    const currentBalance = await this.getBalance(userId);
    if (currentBalance.balance < amount) {
      throw new BadRequestError("代幣餘額不足");
    }

    const newBalance = currentBalance.balance - amount;
    const newTotalSpent = currentBalance.total_spent + amount;

    // 扣除代幣
    const { data: updated, error } = await this.db
      .from("user_tokens")
      .update({
        balance: newBalance,
        total_spent: newTotalSpent,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new BadRequestError(`扣除代幣失敗: ${error.message}`);
    }

    // 記錄交易
    await this.recordTransaction(
      userId,
      -amount,
      updated.balance,
      transactionType,
      referenceId,
      description
    );

    return updated;
  }

  /**
   * 增加代幣（退款等）
   */
  async addTokens(
    userId: string,
    amount: number,
    transactionType: TransactionType,
    referenceId?: string,
    description?: string
  ): Promise<TokenBalance> {
    const currentBalance = await this.getBalance(userId);
    const newBalance = currentBalance.balance + amount;
    const newTotalEarned = currentBalance.total_earned + amount;

    const { data: updated, error } = await this.db
      .from("user_tokens")
      .update({
        balance: newBalance,
        total_earned: newTotalEarned,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new BadRequestError(`增加代幣失敗: ${error.message}`);
    }

    // 記錄交易
    await this.recordTransaction(
      userId,
      amount,
      updated.balance,
      transactionType,
      referenceId,
      description
    );

    return updated;
  }

  /**
   * 記錄交易
   */
  private async recordTransaction(
    userId: string,
    amount: number,
    balanceAfter: number,
    transactionType: TransactionType,
    referenceId?: string,
    description?: string
  ): Promise<void> {
    const { error } = await this.db
      .from("token_transactions")
      .insert({
        user_id: userId,
        amount,
        balance_after: balanceAfter,
        transaction_type: transactionType,
        reference_id: referenceId,
        description,
      });

    if (error) {
      console.error("[RECORD_TRANSACTION_ERROR]", error);
      // 不拋出錯誤，避免影響主要流程
    }
  }

  /**
   * 取得交易記錄
   */
  async getTransactions(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    // 先取得交易記錄
    const { data: transactions, error } = await this.db
      .from("token_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new BadRequestError(`取得交易記錄失敗: ${error.message}`);
    }

    if (!transactions || transactions.length === 0) {
      return [];
    }

    // 收集所有需要查詢的 conversation_id
    const conversationIds = transactions
      .filter(t => t.reference_id && 
        ['unlock_direct_contact', 'submit_proposal', 'view_proposal'].includes(t.transaction_type))
      .map(t => t.reference_id)
      .filter(Boolean);

    // 如果有 conversation_id，批次查詢相關對話
    let conversationsMap = new Map();
    if (conversationIds.length > 0) {
      const { data: conversations } = await this.db
        .from("conversations")
        .select("id, initiator_id, recipient_id")
        .in("id", conversationIds);

      if (conversations) {
        // 收集所有用戶 ID
        const userIds = new Set<string>();
        conversations.forEach(conv => {
          if (conv.initiator_id !== userId) userIds.add(conv.initiator_id);
          if (conv.recipient_id !== userId) userIds.add(conv.recipient_id);
        });

        // 批次查詢用戶名稱
        let usersMap = new Map();
        if (userIds.size > 0) {
          const { data: users } = await this.db
            .from("users")
            .select("id, name")
            .in("id", Array.from(userIds));

          if (users) {
            users.forEach(user => usersMap.set(user.id, user.name));
          }
        }

        // 建立 conversation -> 對方名稱的映射
        conversations.forEach(conv => {
          const otherId = conv.initiator_id === userId ? conv.recipient_id : conv.initiator_id;
          conversationsMap.set(conv.id, usersMap.get(otherId) || null);
        });
      }
    }

    // 處理交易記錄，添加對方使用者名稱
    const processedData = transactions.map((transaction: any) => {
      let relatedUserName = null;
      
      if (transaction.reference_id && conversationsMap.has(transaction.reference_id)) {
        relatedUserName = conversationsMap.get(transaction.reference_id);
      }

      return {
        ...transaction,
        related_user_name: relatedUserName,
      };
    });

    return processedData;
  }

  /**
   * 退款（7日無回應）
   */
  async refundProposal(
    userId: string,
    amount: number,
    conversationId: string
  ): Promise<void> {
    await this.addTokens(
      userId,
      amount,
      "refund",
      conversationId,
      "提案 7 日無回應，退回代幣"
    );
  }
}

