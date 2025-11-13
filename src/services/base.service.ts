import { db } from "@/lib/supabase";
import { NotFoundError } from "@/middleware/error.middleware";

/**
 * 基礎 Service 類別（Supabase 版本）
 * 提供常用的資料庫操作方法
 */
export abstract class BaseService {
  protected db = db;

  /**
   * 檢查資源是否存在
   */
  protected async checkExists(
    table: string,
    id: string,
    errorMessage: string = "資源不存在"
  ): Promise<void> {
    const { data, error } = await this.db
      .from(table)
      .select("id")
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new NotFoundError(errorMessage);
    }
  }

  /**
   * 安全刪除（軟刪除）
   * 註：需要在 table 中加入 deleted_at 欄位
   */
  protected async softDelete(table: string, id: string): Promise<void> {
    const { error } = await this.db
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(`軟刪除失敗: ${error.message}`);
    }
  }

  /**
   * 批次操作
   */
  protected async batchOperation<T>(
    operations: Promise<T>[]
  ): Promise<T[]> {
    return Promise.all(operations);
  }
}
