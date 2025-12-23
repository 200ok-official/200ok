"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (amount: number, discountCode?: string) => Promise<void>;
}

// 預設加值選項
const PURCHASE_OPTIONS = [
  { tokens: 100, price: 100, bonus: 0, label: "入門方案", color: "bg-gray-100 border-gray-200" },
  { tokens: 500, price: 500, bonus: 50, label: "推薦方案", popular: true, color: "bg-blue-50 border-blue-200" },
  { tokens: 1000, price: 1000, bonus: 150, label: "超值方案", color: "bg-purple-50 border-purple-200" },
  { tokens: 2000, price: 2000, bonus: 400, label: "尊榮方案", color: "bg-amber-50 border-amber-200" },
];

// 從環境變數讀取折扣碼設定
// 格式: "CODE1:100,CODE2:500,CODE3:1000" (折扣碼:折扣金額)
const parseDiscountCodes = (): Record<string, number> => {
  const discountCodesEnv = process.env.NEXT_PUBLIC_DISCOUNT_CODES || "";
  const codes: Record<string, number> = {};
  
  if (!discountCodesEnv) return codes;
  
  discountCodesEnv.split(",").forEach((item) => {
    const [code, amount] = item.trim().split(":");
    if (code && amount) {
      codes[code.toUpperCase().trim()] = parseInt(amount.trim(), 10);
    }
  });
  
  return codes;
};

const DISCOUNT_CODES = parseDiscountCodes();

export const TokenPurchaseModal: React.FC<Props> = ({ isOpen, onClose, onPurchase }) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 折扣碼相關狀態
  const [discountCode, setDiscountCode] = useState("");
  const [discountValidation, setDiscountValidation] = useState<{
    valid: boolean;
    discount_amount: number;
    message: string;
  } | null>(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 當 Modal 開啟時重置狀態
  useEffect(() => {
    if (isOpen) {
      setSelectedAmount(500);
      setCustomAmount("");
      setIsCustom(false);
      setDiscountCode("");
      setDiscountValidation(null);
    }
  }, [isOpen]);

  // 清理 debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  // 前端驗證折扣碼（從環境變數）
  const validateDiscountCode = (code: string) => {
    if (!code.trim()) {
      setDiscountValidation(null);
      return;
    }

    setValidatingDiscount(true);
    
    // 模擬短暫延遲讓 UI 更自然
    setTimeout(() => {
      const upperCode = code.toUpperCase().trim();
      const discountAmount = DISCOUNT_CODES[upperCode];
      
      if (discountAmount !== undefined && discountAmount > 0) {
        setDiscountValidation({
          valid: true,
          discount_amount: discountAmount,
          message: `折扣 NT$ ${discountAmount}`,
        });
      } else {
        setDiscountValidation({
          valid: false,
          discount_amount: 0,
          message: "無效的折扣碼",
        });
      }
      setValidatingDiscount(false);
    }, 300);
  };

  const handleDiscountCodeChange = (code: string) => {
    setDiscountCode(code);
    
    // 清除之前的 timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (code.trim()) {
      // 防抖動驗證
      debounceTimerRef.current = setTimeout(() => {
        validateDiscountCode(code.toUpperCase());
      }, 500);
    } else {
      setDiscountValidation(null);
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const amount = isCustom ? parseInt(customAmount) : selectedAmount;
      
      // 基本驗證
      if (isNaN(amount) || amount < 10) {
        alert("最少購買 10 代幣");
        setLoading(false);
        return;
      }
      if (amount > 2000) {
        alert("單次最多購買 2000 代幣");
        setLoading(false);
        return;
      }

      // 計算最終金額
      const currentDiscount = discountValidation?.valid ? discountValidation.discount_amount : 0;
      const finalPrice = Math.max(0, amount - currentDiscount);

      // 金流未開通阻擋邏輯
      if (finalPrice > 0) {
        alert("暫時未開通金流加值，如需更多代幣請聯絡開發者。\n目前僅支援使用折扣碼全額折抵。");
        setLoading(false);
        return;
      }

      await onPurchase(amount, discountCode.trim() || undefined);
      // 成功後關閉視窗 (由父組件控制 onClose 或此處調用)
      onClose();
    } catch (error: any) {
      console.error("Purchase error:", error);
      alert(error?.message || "購買失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  // 計算顯示數據
  const currentAmount = isCustom ? (parseInt(customAmount) || 0) : selectedAmount;
  const selectedOption = PURCHASE_OPTIONS.find(opt => opt.tokens === selectedAmount);
  
  // 贈送代幣計算
  let bonusTokens = 0;
  if (!isCustom && selectedOption) {
    bonusTokens = selectedOption.bonus;
  }
  
  const totalTokens = currentAmount + bonusTokens;
  const currentDiscount = discountValidation?.valid ? discountValidation.discount_amount : 0;
  const finalPrice = Math.max(0, currentAmount - currentDiscount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* 左側：方案選擇區 */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-50/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#20263e]">選擇代幣方案</h2>
            <button 
              onClick={onClose}
              className="md:hidden text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* 預設選項 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PURCHASE_OPTIONS.map((option) => (
                <button
                  key={option.tokens}
                  onClick={() => {
                    setSelectedAmount(option.tokens);
                    setIsCustom(false);
                  }}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group ${
                    !isCustom && selectedAmount === option.tokens
                      ? "border-[#20263e] ring-1 ring-[#20263e] bg-white shadow-md"
                      : "border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm"
                  }`}
                >
                  {option.popular && (
                    <span className="absolute -top-3 -right-2 bg-[#ff4d4f] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
                      HOT
                    </span>
                  )}
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-gray-500 font-medium mb-1">{option.label}</div>
                      <div className="text-2xl font-bold text-[#20263e]">
                        {option.tokens} <span className="text-sm font-normal text-gray-400">代幣</span>
                      </div>
                    </div>
                    {option.bonus > 0 && (
                      <div className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                        +{option.bonus} 贈送
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">NT$ {option.price}</span>
                    {!isCustom && selectedAmount === option.tokens && (
                      <div className="w-5 h-5 bg-[#20263e] rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* 自訂金額區塊 */}
            <div 
              className={`mt-6 p-4 rounded-xl border-2 transition-all ${
                isCustom 
                  ? "border-[#20263e] ring-1 ring-[#20263e] bg-white shadow-md" 
                  : "border-gray-200 bg-white"
              }`}
              onClick={() => setIsCustom(true)}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${isCustom ? "bg-[#20263e] text-white" : "bg-gray-100 text-gray-400"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 block mb-1">自訂金額</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setIsCustom(true);
                      }}
                      onFocus={() => setIsCustom(true)}
                      placeholder="輸入 10-2000"
                      className="w-full text-lg font-semibold bg-transparent border-none p-0 focus:ring-0 placeholder-gray-300 text-[#20263e]"
                    />
                    <span className="text-gray-400 text-sm whitespace-nowrap">代幣</span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 mt-2 px-1">
              * 自訂金額無贈送代幣優惠，單次上限 2000 代幣
            </p>
          </div>
        </div>

        {/* 右側：結帳摘要區 */}
        <div className="w-full md:w-[380px] bg-white border-l border-gray-100 flex flex-col h-full">
          <div className="p-6 md:p-8 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h3 className="text-xl font-bold text-gray-900">訂單摘要</h3>
              <button 
                onClick={onClose}
                className="hidden md:block text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* 購買內容明細 */}
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-gray-600">
                <span>購買代幣</span>
                <span className="font-semibold text-gray-900">{currentAmount}</span>
              </div>
              
              {bonusTokens > 0 && (
                <div className="flex justify-between items-center text-green-600 bg-green-50 p-2 rounded-lg">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                    活動贈送
                  </span>
                  <span className="font-bold">+{bonusTokens}</span>
                </div>
              )}

              <div className="h-px bg-gray-100 my-2"></div>

              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-[#20263e]">總計獲得</span>
                <span className="font-bold text-[#20263e]">{totalTokens.toLocaleString()} 代幣</span>
              </div>
            </div>

            {/* 折扣碼輸入 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">折扣碼</label>
              <div className="relative">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => handleDiscountCodeChange(e.target.value.toUpperCase())}
                  placeholder="輸入折扣碼"
                  className={`w-full pl-4 pr-10 py-2.5 rounded-lg border-2 outline-none transition-colors ${
                    discountValidation?.valid 
                      ? "border-green-500 focus:border-green-500" 
                      : discountCode && discountValidation?.valid === false
                      ? "border-red-300 focus:border-red-300"
                      : "border-gray-200 focus:border-[#20263e]"
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {validatingDiscount ? (
                    <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-[#20263e] rounded-full"></div>
                  ) : discountValidation?.valid ? (
                    <div className="text-green-500 bg-green-100 rounded-full p-0.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  ) : null}
                </div>
              </div>
              {/* 驗證訊息 */}
              {discountValidation && (
                <div className={`text-xs mt-1.5 flex items-center gap-1 ${
                  discountValidation.valid ? "text-green-600" : "text-red-500"
                }`}>
                  {discountValidation.valid 
                    ? `✓ ${discountValidation.message}` 
                    : `✗ ${discountValidation.message}`
                  }
                </div>
              )}
            </div>

            <div className="mt-auto">
              {/* 金額計算 */}
              <div className="space-y-2 mb-6 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>小計</span>
                  <span>NT$ {currentAmount.toLocaleString()}</span>
                </div>
                {currentDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>折扣減免</span>
                    <span>- NT$ {currentDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-baseline">
                  <span className="text-gray-900 font-bold">應付金額</span>
                  <span className={`text-3xl font-bold ${finalPrice === 0 ? 'text-green-600' : 'text-[#20263e]'}`}>
                    NT$ {finalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <Button
                onClick={handlePurchase}
                disabled={loading || validatingDiscount || (isCustom && currentAmount < 10)}
                className={`w-full py-6 text-lg shadow-lg transition-transform active:scale-[0.98] ${
                  finalPrice === 0 
                    ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800" 
                    : "bg-gradient-to-r from-[#20263e] to-[#3a4158] hover:from-[#2a3250] hover:to-[#4a5168]"
                }`}
              >
                {loading ? "處理中..." : finalPrice === 0 ? "立即兌換" : "前往付款"}
              </Button>
              
              <p className="text-[10px] text-gray-400 text-center mt-3">
                點擊確認即代表同意服務條款
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
