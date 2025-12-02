import { NextRequest } from "next/server";
import { z } from "zod";
import { TokenService } from "@/services/token.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { successResponse } from "@/lib/response";

const purchaseSchema = z.object({
  amount: z.number()
    .min(10, "最少購買 10 代幣")
    .max(2000, "單次最多購買 2000 代幣"),
  payment_method: z.string().optional().default("simulated"), // 模擬付款
});

/**
 * 購買代幣（模擬付款）
 * POST /api/v1/tokens/purchase
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  const authUser = requireAuth(request);
  const data = await validateBody(request, purchaseSchema);

  const tokenService = new TokenService();

  // 模擬付款處理
  // TODO: 實際金流整合時，這裡會呼叫金流 API
  
  // 計算贈送代幣（bonuses）
  let bonus = 0;
  if (data.amount >= 2000) {
    bonus = 400;
  } else if (data.amount >= 1000) {
    bonus = 150;
  } else if (data.amount >= 500) {
    bonus = 50;
  }

  const totalTokens = data.amount + bonus;

  // 增加代幣（購買類型的交易不需要 reference_id）
  await tokenService.addTokens(
    authUser.userId,
    totalTokens,
    'purchase',
    undefined, // 購買不需要 reference_id
    bonus > 0 
      ? `購買 ${data.amount} 代幣（贈送 ${bonus} 代幣）` 
      : `購買 ${data.amount} 代幣`
  );

  // 獲取更新後的餘額
  const balanceData = await tokenService.getBalance(authUser.userId);
  const balance = balanceData.balance;

  return successResponse({
    purchased_amount: data.amount,
    bonus_amount: bonus,
    total_received: totalTokens,
    new_balance: balance,
    payment_method: data.payment_method,
    status: "success",
    message: bonus > 0 
      ? `成功購買 ${data.amount} 代幣，獲得 ${bonus} 贈送代幣！`
      : `成功購買 ${data.amount} 代幣！`,
  }, "購買成功");
});

