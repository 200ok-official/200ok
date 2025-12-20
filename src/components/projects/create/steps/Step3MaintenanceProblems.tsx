"use client";

import React from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

interface Props {
  data: any;
  updateData: (data: any) => void;
}

export const Step3MaintenanceProblems: React.FC<Props> = ({ data, updateData }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#20263e] mb-2">
          目前遇到什麼問題？
        </h2>
        <p className="text-sm text-[#c5ae8c]">
          告訴我們為什麼需要調整或改善這個系統
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 目前的問題 */}
        <div className="space-y-2">
          <label className="block text-base font-semibold text-[#20263e]">
            目前遇到哪些問題？ <span className="text-red-500">*</span>
          </label>
          <textarea
            value={data.maint_current_problems || ""}
            onChange={(e) => updateData({ maint_current_problems: e.target.value })}
            placeholder="例如：系統速度很慢、手機版跑版、報表功能太陽春..."
            className="w-full px-3 py-2 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20 min-h-[100px] text-sm"
            rows={4}
          />
        </div>

        {/* 希望改善的地方 */}
        <div className="space-y-2">
          <label className="block text-base font-semibold text-[#20263e]">
            希望改善或優化哪些地方？ <span className="text-red-500">*</span>
          </label>
          <textarea
            value={data.maint_desired_improvements || ""}
            onChange={(e) => updateData({ maint_desired_improvements: e.target.value })}
            placeholder="例如：提升系統效能、優化手機介面、改善報表功能..."
            className="w-full px-3 py-2 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20 min-h-[100px] text-sm"
            rows={4}
          />
        </div>
      </div>

      {/* 新功能需求 */}
      <div className="space-y-2">
        <label className="block text-base font-semibold text-[#20263e]">
          有需要新增的功能嗎？（選填）
        </label>
        <textarea
          value={data.maint_new_features || ""}
          onChange={(e) => updateData({ maint_new_features: e.target.value })}
          placeholder="例如：加入會員等級制度、串接 LINE 通知..."
          className="w-full px-3 py-2 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20 min-h-[80px] text-sm"
          rows={3}
        />
      </div>

      {/* 小提示 */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
        <CheckCircleIcon className="w-5 h-5 text-green-800 shrink-0" />
        <p className="text-xs text-green-800 pt-1">
          <strong>提示：</strong> 描述得越清楚，接案者就越能準確評估工作內容和報價。如果有截圖或範例會更好！
        </p>
      </div>
    </div>
  );
};

