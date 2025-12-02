"use client";

import React from "react";

interface Props {
  data: any;
  updateData: (data: any) => void;
}

const BUDGET_RANGES = [
  { min: 10000, max: 30000, label: "1 - 3 萬", desc: "小幅調整" },
  { min: 30000, max: 50000, label: "3 - 5 萬", desc: "中等修改" },
  { min: 50000, max: 100000, label: "5 - 10 萬", desc: "大幅改善" },
  { min: 100000, max: 200000, label: "10 - 20 萬", desc: "重大更新" },
  { min: 200000, max: 999999999, label: "20 萬以上", desc: "全面升級" },
];

export const Step5MaintenanceBudgetSimple: React.FC<Props> = ({ data, updateData }) => {
  const handleBudgetSelect = (min: number, max: number) => {
    updateData({ budgetMin: min, budgetMax: max });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#20263e] mb-3">
          預算與時程
        </h2>
        <p className="text-[#c5ae8c]">
          讓我們了解您的預算範圍和時間安排
        </p>
      </div>

      {/* 預算範圍 */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-[#20263e]">
          您的預算大概是多少？ <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-[#c5ae8c]">
          可以先選個大概範圍，實際金額可以跟接案者討論
        </p>
        <div className="space-y-3">
          {BUDGET_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => handleBudgetSelect(range.min, range.max)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                data.budgetMin === range.min && data.budgetMax === range.max
                  ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                  : "border-[#c5ae8c] hover:border-[#20263e]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#20263e] text-lg mb-1">
                    NT$ {range.label}
                  </div>
                  <div className="text-sm text-[#c5ae8c]">{range.desc}</div>
                </div>
                {data.budgetMin === range.min && data.budgetMax === range.max && (
                  <span className="text-[#20263e] text-2xl">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 預算說明 */}
      <div className="p-4 bg-[#f5f3ed] rounded-lg">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.budgetEstimateOnly || false}
            onChange={(e) => updateData({ budgetEstimateOnly: e.target.checked })}
            className="mt-1 w-4 h-4 text-[#20263e] border-[#c5ae8c] rounded focus:ring-[#20263e]"
          />
          <span className="text-sm text-[#20263e]">
            預算僅供參考，實際金額可與接案者協商調整
          </span>
        </label>
      </div>

      {/* 完成期限 */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-[#20263e]">
          希望什麼時候完成？（選填）
        </label>
        <input
          type="date"
          value={data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : ""}
          onChange={(e) => updateData({ deadline: e.target.value ? new Date(e.target.value) : undefined })}
          className="w-full px-4 py-3 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20"
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.deadlineFlexible !== false}
            onChange={(e) => updateData({ deadlineFlexible: e.target.checked })}
            className="w-4 h-4 text-[#20263e] border-[#c5ae8c] rounded focus:ring-[#20263e]"
          />
          <span className="text-sm text-[#20263e]">
            時間可以彈性調整
          </span>
        </label>
      </div>

      {/* 付款方式 */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-[#20263e]">
          希望怎麼付款？ <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          {[
            { value: "installment", label: "分期付款", desc: "例如：開始 50%，完成 50%", icon: "📊" },
            { value: "milestone", label: "依進度付款", desc: "完成一個階段付一次", icon: "🎯" },
            { value: "full_after", label: "完成後付款", desc: "全部做完後才付錢", icon: "✅" },
            { value: "negotiable", label: "再討論", desc: "與接案者協商決定", icon: "💬" },
          ].map((method) => (
            <button
              key={method.value}
              onClick={() => updateData({ paymentMethod: method.value })}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                data.paymentMethod === method.value
                  ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                  : "border-[#c5ae8c] hover:border-[#20263e]"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{method.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-[#20263e] mb-1">
                    {method.label}
                  </div>
                  <div className="text-sm text-[#c5ae8c]">{method.desc}</div>
                </div>
                {data.paymentMethod === method.value && (
                  <span className="text-[#20263e] text-xl">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 小提示 */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 小提示：</strong> 預算和付款方式都可以跟接案者討論調整，不用擔心！
        </p>
      </div>
    </div>
  );
};

