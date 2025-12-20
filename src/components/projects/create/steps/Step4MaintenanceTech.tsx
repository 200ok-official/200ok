"use client";

import React from "react";
import {
  CommandLineIcon,
  CodeBracketIcon,
  PencilSquareIcon,
  ShoppingBagIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  DocumentMinusIcon,
  LockOpenIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface Props {
  data: any;
  updateData: (data: any) => void;
}

const TECH_OPTIONS = [
  { value: "php", label: "PHP", icon: CommandLineIcon },
  { value: "python", label: "Python", icon: CommandLineIcon },
  { value: "nodejs", label: "Node.js", icon: CommandLineIcon },
  { value: "java", label: "Java", icon: CommandLineIcon },
  { value: "csharp", label: "C# / .NET", icon: CommandLineIcon },
  { value: "wordpress", label: "WordPress", icon: PencilSquareIcon },
  { value: "shopify", label: "Shopify", icon: ShoppingBagIcon },
  { value: "react", label: "React", icon: CodeBracketIcon },
  { value: "vue", label: "Vue.js", icon: CodeBracketIcon },
  { value: "not_sure", label: "不確定", icon: QuestionMarkCircleIcon },
];

export const Step4MaintenanceTech: React.FC<Props> = ({ data, updateData }) => {
  const toggleTech = (tech: string) => {
    const current = data.maint_known_tech_stack || [];
    const updated = current.includes(tech)
      ? current.filter((t: string) => t !== tech)
      : [...current, tech];
    updateData({ maint_known_tech_stack: updated });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#20263e] mb-2">
          關於系統的技術資訊
        </h2>
        <p className="text-sm text-[#c5ae8c]">
          幫助接案者了解系統的技術背景（不知道也沒關係）
        </p>
      </div>

      {/* 技術棧 */}
      <div className="space-y-3">
        <label className="block text-base font-semibold text-[#20263e]">
          您知道系統是用什麼技術做的嗎？
        </label>
        <p className="text-xs text-[#c5ae8c] mb-2">
          如果不確定，可以選「不確定」，或詢問當初的開發者
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {TECH_OPTIONS.map((tech) => (
            <button
              key={tech.value}
              onClick={() => toggleTech(tech.value)}
              className={`p-2.5 rounded-lg border transition-all ${
                (data.maint_known_tech_stack || []).includes(tech.value)
                  ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                  : "border-[#e5e7eb] hover:border-[#c5ae8c]"
              }`}
            >
              <div className="text-center space-y-1.5 flex flex-col items-center">
                <tech.icon className="w-8 h-8 text-[#20263e]" />
                <span className="text-xs font-medium text-[#20263e] block whitespace-nowrap">
                  {tech.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 是否有原始碼 */}
        <div className="space-y-2">
          <label className="block text-base font-semibold text-[#20263e]">
            您手上有原始碼嗎？ <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateData({ maint_has_source_code: true })}
              className={`py-2 px-1 rounded-lg border transition-all ${
                data.maint_has_source_code === true
                  ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                  : "border-[#e5e7eb] hover:border-[#20263e]"
              }`}
            >
              <CheckCircleIcon className="w-6 h-6 text-[#20263e] mx-auto mb-1" />
              <span className="text-xs font-medium text-[#20263e]">有</span>
            </button>
            <button
              onClick={() => updateData({ maint_has_source_code: false })}
              className={`py-2 px-1 rounded-lg border transition-all ${
                data.maint_has_source_code === false
                  ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                  : "border-[#e5e7eb] hover:border-[#20263e]"
              }`}
            >
              <XCircleIcon className="w-6 h-6 text-[#20263e] mx-auto mb-1" />
              <span className="text-xs font-medium text-[#20263e]">沒有</span>
            </button>
          </div>
        </div>

        {/* 是否有文件 */}
        <div className="space-y-2">
          <label className="block text-base font-semibold text-[#20263e]">
            有系統說明文件嗎？ <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateData({ maint_has_documentation: true })}
              className={`py-2 px-1 rounded-lg border transition-all ${
                data.maint_has_documentation === true
                  ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                  : "border-[#e5e7eb] hover:border-[#20263e]"
              }`}
            >
              <DocumentTextIcon className="w-6 h-6 text-[#20263e] mx-auto mb-1" />
              <span className="text-xs font-medium text-[#20263e]">有</span>
            </button>
            <button
              onClick={() => updateData({ maint_has_documentation: false })}
              className={`py-2 px-1 rounded-lg border transition-all ${
                data.maint_has_documentation === false
                  ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                  : "border-[#e5e7eb] hover:border-[#20263e]"
              }`}
            >
              <DocumentMinusIcon className="w-6 h-6 text-[#20263e] mx-auto mb-1" />
              <span className="text-xs font-medium text-[#20263e]">沒有</span>
            </button>
          </div>
        </div>

        {/* 是否可提供存取 */}
        <div className="space-y-2">
          <label className="block text-base font-semibold text-[#20263e]">
            可以提供系統存取嗎？ <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateData({ maint_can_provide_access: true })}
              className={`py-2 px-1 rounded-lg border transition-all ${
                data.maint_can_provide_access === true
                  ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                  : "border-[#e5e7eb] hover:border-[#20263e]"
              }`}
            >
              <LockOpenIcon className="w-6 h-6 text-[#20263e] mx-auto mb-1" />
              <span className="text-xs font-medium text-[#20263e]">可以</span>
            </button>
            <button
              onClick={() => updateData({ maint_can_provide_access: false })}
              className={`py-2 px-1 rounded-lg border transition-all ${
                data.maint_can_provide_access === false
                  ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                  : "border-[#e5e7eb] hover:border-[#20263e]"
              }`}
            >
              <LockClosedIcon className="w-6 h-6 text-[#20263e] mx-auto mb-1" />
              <span className="text-xs font-medium text-[#20263e]">不便</span>
            </button>
          </div>
        </div>
      </div>

      {/* 技術聯絡人 */}
      <div className="space-y-2">
        <label className="block text-base font-semibold text-[#20263e]">
          有技術人員可以協助對接嗎？（選填）
        </label>
        <textarea
          value={data.maint_technical_contact || ""}
          onChange={(e) => updateData({ maint_technical_contact: e.target.value })}
          placeholder="例如：可聯絡原開發者、有內部 IT 人員..."
          className="w-full px-3 py-2 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20 min-h-[60px] text-sm"
          rows={2}
        />
      </div>

      {/* 小提示 */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-800 shrink-0" />
        <p className="text-xs text-yellow-800 pt-1">
          <strong>注意：</strong> 如果沒有原始碼或無法提供系統存取，接案者可能需要「重新開發」而非「修改維護」。
        </p>
      </div>
    </div>
  );
};

