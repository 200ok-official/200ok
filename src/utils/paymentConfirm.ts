/**
 * 模擬付費確認工具
 * 用於顯示付費確認對話框
 */

export interface PaymentConfirmOptions {
  amount: number;
  purpose: string;
  details?: string[];
  warningMessage?: string;
  isSimulated?: boolean;
}

/**
 * 顯示付費確認對話框
 */
export async function confirmPayment(options: PaymentConfirmOptions): Promise<boolean> {
  const { amount, purpose, details, warningMessage, isSimulated = true } = options;
  
  let message = `確認支付 ${amount} 代幣來${purpose}？\n\n`;
  
  if (details && details.length > 0) {
    message += details.map(d => `• ${d}`).join('\n') + '\n\n';
  }
  
  if (warningMessage) {
    message += `⚠️ ${warningMessage}\n\n`;
  }
  
  if (isSimulated) {
    message += '（目前為模擬支付）';
  }
  
  return confirm(message);
}

/**
 * 預設的付費選項
 */
export const paymentPresets = {
  /**
   * 直接聯絡（200 代幣）
   */
  directContact: (userName: string): PaymentConfirmOptions => ({
    amount: 200,
    purpose: '解鎖直接聯絡',
    details: [
      `與 ${userName} 開通聯絡渠道`,
      '查看對方的聯絡資訊',
      '開通站內文字通訊',
    ],
  }),
  
  /**
   * 提交提案（工程師付 100 代幣）
   */
  submitProposal: (projectTitle: string): PaymentConfirmOptions => ({
    amount: 100,
    purpose: '提交提案',
    details: [
      `案件：${projectTitle}`,
      '提案將發送給發案者',
      '7日內無回應將退回代幣',
    ],
    warningMessage: '提交後無法修改提案內容',
  }),
  
  /**
   * 查看提案（發案者付 100 代幣）
   */
  viewProposal: (freelancerName: string): PaymentConfirmOptions => ({
    amount: 100,
    purpose: '查看提案並解鎖聊天',
    details: [
      `工程師：${freelancerName}`,
      '查看完整提案內容',
      '開通雙向聊天功能',
      '查看對方聯絡資訊',
    ],
  }),
};

