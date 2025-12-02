"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (amount: number) => Promise<void>;
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

  if (!isOpen) return null;

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

      await onPurchase(amount);
      onClose();
      setCustomAmount("");
      setIsCustom(false);
    } catch (error) {
      console.error("Purchase error:", error);
      alert("購買失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const selectedOption = PURCHASE_OPTIONS.find(opt => opt.tokens === selectedAmount);
  const actualTokens = isCustom 
    ? parseInt(customAmount) || 0
    : (selectedOption ? selectedOption.tokens + selectedOption.bonus : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#20263e] to-[#3a4158] text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">購買代幣</h2>
              <p className="text-sm text-gray-300 mt-1">選擇加值方案或自訂金額</p>
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
        <div className="p-6">
          {/* 預設方案 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#20263e] mb-4">推薦方案</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PURCHASE_OPTIONS.map((option) => (
                <button
                  key={option.tokens}
                  onClick={() => {
                    setSelectedAmount(option.tokens);
                    setIsCustom(false);
                  }}
                  disabled={loading}
                  className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                    !isCustom && selectedAmount === option.tokens
                      ? "border-[#20263e] bg-[#20263e] bg-opacity-5 shadow-lg"
                      : "border-gray-300 hover:border-[#20263e] hover:shadow-md"
                  }`}
                >
                  {/* 熱門標籤 */}
                  {option.popular && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      最熱門
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{option.label}</p>
                      <p className="text-3xl font-bold text-[#20263e]">
                        {option.tokens}
                        {option.bonus > 0 && (
                          <span className="text-lg text-green-600"> +{option.bonus}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        = {option.tokens + option.bonus} 代幣
                      </p>
                    </div>
                    {!isCustom && selectedAmount === option.tokens && (
                      <span className="text-[#20263e] text-2xl">✓</span>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">支付金額</p>
                    <p className="text-2xl font-bold text-[#20263e]">
                      NT$ {option.price.toLocaleString()}
                    </p>
                  </div>

                  {option.bonus > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                      <span>🎁</span>
                      <span>贈送 {option.bonus} 代幣</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 分隔線 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">或</span>
            </div>
          </div>

          {/* 自訂金額 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#20263e] mb-4">自訂金額</h3>
            <div
              className={`p-5 rounded-xl border-2 transition-all ${
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
                  className="flex-1 px-4 py-3 text-lg font-semibold rounded-lg border border-gray-300 focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20"
                />
                <span className="text-gray-600 font-medium">代幣</span>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                💡 最少 10 代幣，最多 2000 代幣
              </p>
              {isCustom && customAmount && parseInt(customAmount) >= 10 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">支付金額</p>
                  <p className="text-2xl font-bold text-[#20263e]">
                    NT$ {parseInt(customAmount).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 付款說明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">💳 付款說明</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 代幣購買後立即生效</li>
              <li>• 目前為模擬付款，實際金流將於正式上線時啟用</li>
              <li>• 1 代幣 = NT$ 1 元</li>
              <li>• 購買記錄可在交易明細中查看</li>
            </ul>
          </div>

          {/* 總計資訊 */}
          {((!isCustom && selectedAmount) || (isCustom && customAmount && parseInt(customAmount) >= 10)) && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 mb-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-700 font-medium">購買數量</span>
                <span className="text-xl font-bold text-[#20263e]">
                  {isCustom ? customAmount : selectedAmount} 代幣
                </span>
              </div>
              
              {!isCustom && selectedOption && selectedOption.bonus > 0 && (
                <div className="flex items-center justify-between mb-3 text-green-600">
                  <span className="font-medium">贈送代幣</span>
                  <span className="text-xl font-bold">+{selectedOption.bonus} 代幣</span>
                </div>
              )}
              
              <div className="pt-3 border-t-2 border-gray-300 flex items-center justify-between">
                <span className="text-lg font-bold text-gray-800">實際獲得</span>
                <span className="text-2xl font-bold text-[#20263e]">
                  {actualTokens.toLocaleString()} 代幣
                </span>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-300 flex items-center justify-between">
                <span className="text-gray-700 font-medium">支付金額</span>
                <span className="text-2xl font-bold text-[#20263e]">
                  NT$ {(isCustom ? parseInt(customAmount) : selectedAmount).toLocaleString()}
                </span>
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
              disabled={loading || (isCustom && (!customAmount || parseInt(customAmount) < 10 || parseInt(customAmount) > 2000))}
              className="flex-1 bg-gradient-to-r from-[#20263e] to-[#3a4158] hover:from-[#2a3250] hover:to-[#4a5168]"
            >
              {loading ? "處理中..." : `確認購買${actualTokens > 0 ? ` (${actualTokens} 代幣)` : ""}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

