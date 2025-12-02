"use client";

import React from "react";

interface Props {
  data: any;
  updateData: (data: any) => void;
}

const COMMON_GOALS = [
  "讓顧客更快預約 / 查詢資訊",
  "減少重複手動作業",
  "提升銷售轉換率",
  "自動統計數據報表",
  "提升品牌形象",
  "降低營運成本",
  "改善客戶體驗",
  "提高工作效率",
];

export const Step3Goals: React.FC<Props> = ({ data, updateData }) => {
  const handleGoalToggle = (goal: string) => {
    const currentGoals: string = data.goals || "";
    const parts = currentGoals
      .split(/[\n、,]/)
      .map((g: string) => g.trim())
      .filter(Boolean);

    const exists = parts.includes(goal);
    const next = exists
      ? parts.filter((g: string) => g !== goal)
      : [...parts, goal];

    updateData({ goals: next.join("、") });
  };

  const isGoalSelected = (goal: string) => {
    const currentGoals: string = data.goals || "";
    return currentGoals.split("、").some((g) => g.trim() === goal);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-[#20263e] mb-2">
          這個軟體主要想幫你達成什麼目的？
        </h2>
        <p className="text-sm text-[#c5ae8c]">
          告訴我們你想解決的問題或達成的目標
        </p>
      </div>

      {/* 常見目標快選 */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-[#20263e] mb-3">
          常見目標（點擊選擇）：
        </p>
        <div className="flex flex-wrap gap-2">
          {COMMON_GOALS.map((goal, index) => (
            <button
              key={index}
              onClick={() => handleGoalToggle(goal)}
              className={`px-3 py-1.5 rounded-full text-xs md:text-sm transition-all ${
                isGoalSelected(goal)
                  ? "bg-[#20263e] text-white"
                  : "bg-white border border-[#c5ae8c] text-[#20263e] hover:border-[#20263e]"
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      {/* 自訂目標 */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#20263e] mb-2">
          專案目標與期望成果
        </label>
        <textarea
          value={data.goals || ""}
          onChange={(e) => updateData({ goals: e.target.value })}
          placeholder="請以「、」分開多個目標，例如：提升預約效率、減少人工整理報表、改善手機版體驗"
          className="w-full px-3 py-2 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20 text-sm min-h-[72px]"
          rows={3}
        />
      </div>

      {/* 小提示 */}
      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">
          <strong>✅ 小提示：</strong> AI 會根據您的目標自動生成專案摘要，幫助接案者快速理解需求。
        </p>
      </div>
    </div>
  );
};

