"use client";

import React from "react";
import { getProjectTypeHints } from "../config/projectTypeHints";

interface Props {
  data: any;
  updateData: (data: any) => void;
}

const OUTPUT_OPTIONS = [
  { value: "backend_dashboard", label: "後台管理介面", desc: "查看所有數據和管理內容" },
  { value: "sales_report", label: "銷售報表", desc: "自動生成業績統計" },
  { value: "email_notification", label: "Email 通知", desc: "重要事件即時通知" },
  { value: "excel_export", label: "Excel 匯出", desc: "資料可匯出成試算表" },
  { value: "data_analysis", label: "數據分析圖表", desc: "視覺化數據呈現" },
  { value: "other", label: "其他", desc: "自行描述" },
];

export const Step5Outputs: React.FC<Props> = ({ data, updateData }) => {
  const hints = getProjectTypeHints(data.projectType);
  // 如果有類型特定的選項，優先使用；否則使用預設選項
  const outputOptions = hints.outputs.options && hints.outputs.options.length > 0 
    ? hints.outputs.options 
    : OUTPUT_OPTIONS;
  
  const handleOutputToggle = (value: string) => {
    const outputs = data.outputs || [];
    if (outputs.includes(value)) {
      updateData({ outputs: outputs.filter((o: string) => o !== value) });
    } else {
      updateData({ outputs: [...outputs, value] });
    }
  };

  const isOutputSelected = (value: string) => {
    return (data.outputs || []).includes(value);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#20263e] mb-3">
          軟體完成後，你希望自己能看到什麼？
        </h2>
        <p className="text-[#c5ae8c]">
          選擇你需要的輸出或管理功能（可複選）
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {outputOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleOutputToggle(option.value)}
            className={`p-5 rounded-xl border-2 transition-all text-left hover:shadow-md ${
              isOutputSelected(option.value)
                ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                : "border-[#c5ae8c] hover:border-[#20263e]"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#20263e] mb-1">
                  {option.label}
                </h3>
                <p className="text-sm text-[#c5ae8c]">{option.desc}</p>
              </div>
              {isOutputSelected(option.value) && (
                <span className="text-[#20263e] text-xl">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* 其他輸入框 */}
      {isOutputSelected("other") && (
        <div className="mt-6 p-6 bg-[#f5f3ed] rounded-lg">
          <label className="block text-sm font-semibold text-[#20263e] mb-2">
            請描述你想要的輸出或管理功能：
          </label>
          <textarea
            value={data.outputsOther || ""}
            onChange={(e) => updateData({ outputsOther: e.target.value })}
            placeholder="例如：希望能看到每日訪客統計、會員成長曲線..."
            className="w-full px-4 py-3 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20"
            rows={3}
          />
        </div>
      )}

      {/* 小提示 */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 小提示：</strong> {hints.outputs.hint}
        </p>
      </div>
    </div>
  );
};

