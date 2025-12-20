"use client";

import React from "react";
import { getProjectTypeHints } from "../config/projectTypeHints";
import {
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ScaleIcon,
  PencilSquareIcon,
  SparklesIcon,
  CheckIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface Props {
  data: any;
  updateData: (data: any) => void;
}

const CONCERN_OPTIONS = [
  { value: "security", label: "擔心資料安全", icon: ShieldCheckIcon },
  { value: "complexity", label: "怕操作太難", icon: QuestionMarkCircleIcon },
  { value: "scalability", label: "想之後能持續擴充功能", icon: ChartBarIcon },
  { value: "nda", label: "需要簽署保密協議（NDA）", icon: DocumentTextIcon },
  { value: "copyright", label: "版權歸屬需求", icon: ScaleIcon },
  { value: "modification_limit", label: "修改次數限制", icon: PencilSquareIcon },
  { value: "warranty", label: "保固服務", icon: ShieldCheckIcon },
];

export const Step10Additional: React.FC<Props> = ({ data, updateData }) => {
  const hints = getProjectTypeHints(data.projectType);
  
  const handleConcernToggle = (value: string) => {
    const concerns = data.concerns || [];
    if (concerns.includes(value)) {
      updateData({ concerns: concerns.filter((c: string) => c !== value) });
    } else {
      updateData({ concerns: [...concerns, value] });
    }
  };

  const isConcernSelected = (value: string) => {
    return (data.concerns || []).includes(value);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#20263e] mb-3">
          還有沒有其他補充？
        </h2>
        <p className="text-[#c5ae8c]">
          告訴我們您特別關心或需要強調的部分
        </p>
      </div>

      {/* 關注事項選擇 */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-[#20263e] mb-3">
          特別關注的事項（可複選）
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CONCERN_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleConcernToggle(option.value)}
              className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                isConcernSelected(option.value)
                  ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                  : "border-[#c5ae8c] hover:border-[#20263e]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <option.icon className="w-6 h-6 text-[#20263e]" />
                  <span className="text-base font-semibold text-[#20263e]">
                    {option.label}
                  </span>
                </div>
                {isConcernSelected(option.value) && (
                  <CheckIcon className="w-6 h-6 text-[#20263e]" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 其他特殊需求 */}
      <div className="space-y-4 mt-8">
        <label className="block text-sm font-semibold text-[#20263e] mb-2">
          其他特殊需求或補充說明
        </label>
        <textarea
          value={data.specialRequirements || ""}
          onChange={(e) => updateData({ specialRequirements: e.target.value })}
          placeholder="如果還有其他想說明的事項，請在這裡補充..."
          className="w-full px-4 py-3 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20"
          rows={6}
        />
      </div>

      {/* 完成提示 */}
      <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg">
        <div className="text-center">
          <SparklesIcon className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-[#20263e] mb-2">
            太棒了！您已經完成所有問題
          </h3>
          <p className="text-sm text-[#c5ae8c] mb-4">
            點擊下方「發布專案」按鈕，讓優秀的接案工程師開始為您報價
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-green-700">
            <CheckIcon className="w-5 h-5" />
            <span>專案資訊完整度：高</span>
          </div>
        </div>
      </div>

      {/* 最後提示 */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
        <InformationCircleIcon className="w-5 h-5 text-yellow-800 shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-800">
          <strong>提醒：</strong> 發布後，專案會先以「草稿」狀態儲存，您可以隨時修改。確認無誤後，再點擊「發布」讓接案者看到您的專案。
        </p>
      </div>
    </div>
  );
};

