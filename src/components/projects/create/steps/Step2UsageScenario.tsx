"use client";

import React from "react";

interface Props {
  data: any;
  updateData: (data: any) => void;
}

const EXAMPLE_SCENARIOS = [
  "客人打開手機 → 選擇服務 → 線上預約",
  "員工登入後台 → 填寫表單 → 自動算薪",
  "老師輸入成績 → 自動產生成績圖",
  "顧客瀏覽商品 → 加入購物車 → 線上結帳",
  "客服收到訊息 → 機器人先回覆 → 人工接手",
];

export const Step2UsageScenario: React.FC<Props> = ({ data, updateData }) => {
  const handleExampleSelect = (example: string) => {
    updateData({ usageScenario: example });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-[#20263e] mb-2">
          你想像這個軟體會被怎麼使用？
        </h2>
        <p className="text-sm text-[#c5ae8c]">
          描述一下使用者會如何操作這個軟體
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#20263e]">
          使用情境描述
        </label>
        <textarea
          value={data.usageScenario || ""}
          onChange={(e) => updateData({ usageScenario: e.target.value })}
          placeholder="例如：客人打開手機 → 選擇服務項目 → 選擇時間 → 預約完成 → 收到確認通知"
          className="w-full px-3 py-2 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20 text-sm min-h-[72px]"
          rows={3}
        />
      </div>

      {/* 範例參考 */}
      <div className="mt-4">
        <p className="text-sm font-semibold text-[#20263e] mb-2">
          參考範例（點擊套用）：
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {EXAMPLE_SCENARIOS.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleSelect(example)}
              className="text-left p-2.5 rounded-lg border border-[#c5ae8c] hover:border-[#20263e] hover:bg-[#f5f3ed] transition-all"
            >
              <span className="text-xs md:text-sm text-[#20263e] leading-snug">
                {example}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 小提示 */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 小提示：</strong> 用「→」符號來表示步驟流程，讓接案者更容易理解使用情境。
        </p>
      </div>
    </div>
  );
};

