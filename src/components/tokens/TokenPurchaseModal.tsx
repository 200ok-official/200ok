"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (amount: number, discountCode?: string) => Promise<void>;
}

// 預設加值選項
const PURCHASE_OPTIONS = [
  { tokens: 100, price: 100, bonus: 0, label: "入門方案" },
  { tokens: 500, price: 500, bonus: 50, label: "推薦方案", popular: true },
  { tokens: 1000, price: 1000, bonus: 150, label: "超值方案" },
  { tokens: 2000, price: 2000, bonus: 400, label: "尊榮方案" },
];

export const TokenPurchaseModal: React.FC<Props> = ({ isOpen, onClose, onPurchase }) => {
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountValidation, setDiscountValidation] = useState<{
    valid: boolean;
    discount_amount: number;
    message: string;
  } | null>(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);

  if (!isOpen) return null;

  const validateDiscountCode = async (code: string) => {
    if (!code.trim()) {
      setDiscountValidation(null);
      return;
    }

    setValidatingDiscount(true);
    try {
      const response = await fetch("/api/v1/tokens/validate-discount?discount_code=" + encodeURIComponent(code), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setDiscountValidation(result.data);
      } else {
        setDiscountValidation({
          valid: false,
          discount_amount: 0,
          message: "驗證失敗",
        });
      }
    } catch (error) {
      console.error("Discount validation error:", error);
      setDiscountValidation({
        valid: false,
        discount_amount: 0,
        message: "驗證失敗",
      });
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handleDiscountCodeChange = (code: string) => {
    setDiscountCode(code);
    if (code.trim()) {
      // 延遲驗證，避免每次輸入都發送請求
      const timer = setTimeout(() => {
        validateDiscountCode(code);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDiscountValidation(null);
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const amount = isCustom ? parseInt(customAmount) : selectedAmount;
      
      if (isNaN(amount) || amount < 10) {
        alert("最少購買 10 代幣");
        return;
      }
      
      if (amount > 2000) {
        alert("單次最多購買 2000 代幣");
        return;
      }

      // 計算折扣後金額
      const discountAmount = discountValidation?.valid ? discountValidation.discount_amount : 0;
      const finalPrice = Math.max(0, amount - discountAmount);

      // 如果折扣後金額不為 0，顯示提示
      if (finalPrice > 0) {
        alert("暫時未開通金流加值，如需更多代幣請聯絡開發者");
        return;
      }

      await onPurchase(amount, discountCode.trim() || undefined);
      onClose();
      setCustomAmount("");
      setIsCustom(false);
      setDiscountCode("");
      setDiscountValidation(null);
    } catch (error: any) {
      console.error("Purchase error:", error);
      alert(error?.message || "購買失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const selectedOption = PURCHASE_OPTIONS.find(opt => opt.tokens === selectedAmount);
  const actualTokens = isCustom 
    ? parseInt(customAmount) || 0
    : (selectedOption ? selectedOption.tokens + selectedOption.bonus : 0);

  const currentAmount = isCustom ? parseInt(customAmount) || 0 : selectedAmount;
  const discountAmount = discountValidation?.valid ? discountValidation.discount_amount : 0;
  const finalPrice = Math.max(0, currentAmount - discountAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#20263e] to-[#3a4158] text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">購買代幣</h2>
              <p className="text-sm text-gray-300 mt-1">選擇加值方案或輸入折扣碼</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors text-3xl leading-none"
              disabled={loading}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 預設方案 */}
          <div>
            <h3 className="text-lg font-semibold text-[#20263e] mb-4">推薦方案</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PURCHASE_OPTIONS.map((option) => (
                <button
                  key={option.tokens}
                  onClick={() => {
                    setSelectedAmount(option.tokens);
                    setIsCustom(false);
                  }}
                  disabled={loading}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    !isCustom && selectedAmount === option.tokens
                      ? "border-[#20263e] bg-[#20263e] bg-opacity-5 shadow-lg"
                      : "border-gray-300 hover:border-[#20263e] hover:shadow-md"
                  }`}
                >
                  {/* 熱門標籤 */}
                  {option.popular && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      最熱門
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">{option.label}</p>
                      <p className="text-2xl font-bold text-[#20263e]">
                        {option.tokens}
                        {option.bonus > 0 && (
                          <span className="text-base text-green-600"> +{option.bonus}</span>
                        )}
                      </p>
                    </div>
                    {!isCustom && selectedAmount === option.tokens && (
                      <span className="text-[#20263e] text-xl">✓</span>
                    )}
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">支付金額</p>
                    <p className="text-xl font-bold text-[#20263e]">
                      NT$ {option.price.toLocaleString()}
                    </p>
                  </div>

                  {option.bonus > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      <span>🎁</span>
                      <span>贈 {option.bonus} 代幣</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 分隔線 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">或</span>
            </div>
          </div>

          {/* 自訂金額 */}
          <div>
            <h3 className="text-lg font-semibold text-[#20263e] mb-3">自訂金額</h3>
            <div
              className={`p-4 rounded-xl border-2 transition-all ${
                isCustom
                  ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                  : "border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setIsCustom(true);
                  }}
                  onFocus={() => setIsCustom(true)}
                  placeholder="輸入代幣數量"
                  min="10"
                  max="2000"
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-lg font-semibold rounded-lg border border-gray-300 focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20"
                />
                <span className="text-gray-600 font-medium">代幣</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 最少 10 代幣，最多 2000 代幣
              </p>
            </div>
          </div>

          {/* 折扣碼輸入 */}
          <div>
            <h3 className="text-lg font-semibold text-[#20263e] mb-3">折扣碼</h3>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => handleDiscountCodeChange(e.target.value.toUpperCase())}
                  placeholder="輸入折扣碼（選填）"
                  disabled={loading || validatingDiscount}
                  className="w-full px-4 py-3 text-base rounded-lg border-2 border-gray-300 focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20 disabled:bg-gray-100"
                />
                {validatingDiscount && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#20263e]"></div>
                  </div>
                )}
              </div>
              
              {discountValidation && (
                <div className={`text-sm px-3 py-2 rounded-lg ${
                  discountValidation.valid 
                    ? "bg-green-50 text-green-700 border border-green-200" 
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {discountValidation.valid ? "✓" : "✗"} {discountValidation.message}
                </div>
              )}
            </div>
          </div>

          {/* 付款說明 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-amber-900 mb-2">💳 付款說明</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• 目前僅支援折扣碼全額折抵兌換代幣</li>
              <li>• 暫未開通線上金流付款功能</li>
              <li>• 如需更多代幣，請使用折扣碼或聯絡開發者</li>
              <li>• 每個折扣碼每個帳號僅能使用一次</li>
            </ul>
          </div>

          {/* 總計資訊 */}
          {((!isCustom && selectedAmount) || (isCustom && customAmount && parseInt(customAmount) >= 10)) && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">購買數量</span>
                  <span className="text-lg font-bold text-[#20263e]">
                    {currentAmount} 代幣
                  </span>
                </div>
                
                {!isCustom && selectedOption && selectedOption.bonus > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <span className="font-medium">贈送代幣</span>
                    <span className="text-lg font-bold">+{selectedOption.bonus} 代幣</span>
                  </div>
                )}
                
                <div className="pt-2 border-t-2 border-gray-300 flex items-center justify-between">
                  <span className="text-base font-bold text-gray-800">實際獲得</span>
                  <span className="text-xl font-bold text-[#20263e]">
                    {actualTokens.toLocaleString()} 代幣
                  </span>
                </div>
                
                <div className="pt-2 border-t border-gray-300 space-y-2">
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="font-medium">原價</span>
                    <span className="text-lg font-semibold">
                      NT$ {currentAmount.toLocaleString()}
                    </span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-green-600">
                      <span className="font-medium">折扣碼折抵</span>
                      <span className="text-lg font-semibold">
                        - NT$ {discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t-2 border-gray-400 flex items-center justify-between">
                    <span className="text-base font-bold text-gray-800">應付金額</span>
                    <span className={`text-2xl font-bold ${finalPrice === 0 ? 'text-green-600' : 'text-[#20263e]'}`}>
                      NT$ {finalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={
                loading || 
                validatingDiscount ||
                (isCustom && (!customAmount || parseInt(customAmount) < 10 || parseInt(customAmount) > 2000))
              }
              className="flex-1 bg-gradient-to-r from-[#20263e] to-[#3a4158] hover:from-[#2a3250] hover:to-[#4a5168] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "處理中..." : finalPrice === 0 ? `確認兌換 (${actualTokens} 代幣)` : `確認購買 (NT$ ${finalPrice})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
