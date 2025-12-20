"use client";

import React from "react";
import { getProjectTypeHints } from "../config/projectTypeHints";
import {
  TableCellsIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  CameraIcon,
  CreditCardIcon,
  UserGroupIcon,
  EnvelopeIcon,
  CpuChipIcon,
  MapIcon,
  CalendarIcon,
  ChartPieIcon,
  LinkIcon,
  XMarkIcon,
  CheckIcon,
  BoltIcon,
  WrenchScrewdriverIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

interface Props {
  data: any;
  updateData: (data: any) => void;
}

const INTEGRATION_OPTIONS = [
  { value: "google_sheets", label: "Google Sheets" },
  { value: "line", label: "LINE" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "payment", label: "金流串接" },
  { value: "crm", label: "CRM" },
  { value: "email", label: "Email" },
  { value: "openai", label: "OpenAI/ChatGPT" },
  { value: "maps", label: "Google Maps" },
  { value: "calendar", label: "行事曆" },
  { value: "analytics", label: "GA/分析" },
  { value: "other", label: "其他" },
  { value: "none", label: "不需要" },
];

const ICON_MAP: Record<string, any> = {
  google_sheets: TableCellsIcon,
  line: ChatBubbleLeftRightIcon,
  facebook: GlobeAltIcon,
  instagram: CameraIcon,
  payment: CreditCardIcon,
  crm: UserGroupIcon,
  email: EnvelopeIcon,
  openai: CpuChipIcon,
  maps: MapIcon,
  calendar: CalendarIcon,
  analytics: ChartPieIcon,
  other: LinkIcon,
  none: XMarkIcon,
};

const TECH_OPTIONS = [
  { value: "php", label: "PHP" },
  { value: "python", label: "Python" },
  { value: "nodejs", label: "Node.js" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#/.NET" },
  { value: "react", label: "React" },
  { value: "vue", label: "Vue.js" },
  { value: "flutter", label: "Flutter" },
  { value: "ios", label: "iOS (Swift)" },
  { value: "android", label: "Android" },
  { value: "wordpress", label: "WordPress" },
  { value: "shopify", label: "Shopify" },
  { value: "sql", label: "SQL" },
  { value: "firebase", label: "Firebase" },
  { value: "aws", label: "AWS" },
  { value: "other", label: "其他" },
];

export const Step7Integrations: React.FC<Props> = ({ data, updateData }) => {
  const hints = getProjectTypeHints(data.projectType);
  // 如果有類型特定的優先選項，將它們放在前面
  const priorityOptions = hints.integrations.priorityOptions || [];
  const otherOptions = INTEGRATION_OPTIONS.filter(
    opt => !priorityOptions.some(po => po.value === opt.value)
  );
  const displayOptions = [...priorityOptions, ...otherOptions];
  
  const handleIntegrationToggle = (value: string) => {
    const integrations = data.integrations || [];
    
    if (value === "none") {
      updateData({ integrations: ["none"] });
      return;
    }
    
    const filteredIntegrations = integrations.filter((i: string) => i !== "none");
    
    if (filteredIntegrations.includes(value)) {
      updateData({ integrations: filteredIntegrations.filter((i: string) => i !== value) });
    } else {
      updateData({ integrations: [...filteredIntegrations, value] });
    }
  };

  const handleTechToggle = (tech: string) => {
    const currentTechs = data.requiredTechStacks || [];
    if (currentTechs.includes(tech)) {
      updateData({ requiredTechStacks: currentTechs.filter((t: string) => t !== tech) });
    } else {
      updateData({ requiredTechStacks: [...currentTechs, tech] });
    }
  };

  const isIntegrationSelected = (value: string) => {
    return (data.integrations || []).includes(value);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-[#20263e] mb-2">
          技術與整合需求
        </h2>
        <p className="text-sm text-[#c5ae8c]">
          告訴我們您需要的外部工具整合和技術偏好
        </p>
      </div>

      {/* 外部工具整合 */}
      <div className="space-y-3">
        <label className="block text-base font-semibold text-[#20263e] flex items-center gap-2">
          <BoltIcon className="w-5 h-5" />
          需要整合哪些外部工具？
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {displayOptions.map((option) => {
            const Icon = ICON_MAP[option.value] || QuestionMarkCircleIcon;
            return (
              <button
                key={option.value}
                onClick={() => handleIntegrationToggle(option.value)}
                className={`p-2.5 rounded-lg border transition-all flex flex-col items-center justify-center gap-1.5 hover:shadow-sm ${
                  isIntegrationSelected(option.value)
                    ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                    : "border-[#e5e7eb] hover:border-[#c5ae8c]"
                }`}
              >
                <Icon className="w-8 h-8 text-[#20263e]" />
                <span className="text-xs font-medium text-[#20263e] whitespace-nowrap">
                  {option.label}
                </span>
                {isIntegrationSelected(option.value) && (
                  <span className="absolute top-1 right-1 text-[#20263e]">
                    <CheckIcon className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 其他整合說明 */}
        {isIntegrationSelected("other") && (
          <div className="mt-3">
            <input
              type="text"
              value={data.integrationsOther || ""}
              onChange={(e) => updateData({ integrationsOther: e.target.value })}
              placeholder="請說明其他需要整合的工具..."
              className="w-full px-3 py-2 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none text-sm"
            />
          </div>
        )}
      </div>

      {/* 技術需求 */}
      <div className="space-y-3 pt-4 border-t border-[#e5e7eb]">
        <div className="flex items-center justify-between">
          <label className="block text-base font-semibold text-[#20263e] flex items-center gap-2">
            <WrenchScrewdriverIcon className="w-5 h-5" />
            有指定的技術需求嗎？（選填）
          </label>
          <span className="text-xs text-[#c5ae8c]">可複選</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {TECH_OPTIONS.map((tech) => (
            <button
              key={tech.value}
              onClick={() => handleTechToggle(tech.value)}
              className={`px-3 py-1.5 rounded-full border transition-all text-xs font-medium ${
                (data.requiredTechStacks || []).includes(tech.value)
                  ? "border-[#20263e] bg-[#20263e] text-white"
                  : "border-[#e5e7eb] text-[#20263e] hover:border-[#c5ae8c] bg-white"
              }`}
            >
              {tech.label}
            </button>
          ))}
        </div>

        {/* 其他技術說明 */}
        {(data.requiredTechStacks || []).includes("other") && (
          <div className="mt-3">
            <input
              type="text"
              value={data.techStackOther || ""}
              onChange={(e) => updateData({ techStackOther: e.target.value })}
              placeholder="請說明其他技術需求，例如：Rust, Go, Kubernetes..."
              className="w-full px-3 py-2 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none text-sm"
            />
          </div>
        )}
      </div>

      {/* 小提示 */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <LightBulbIcon className="w-5 h-5 text-blue-800 shrink-0" />
        <p className="text-xs text-blue-800 pt-1">
          <strong>技術建議：</strong> {hints.integrations.hint}
        </p>
      </div>
    </div>
  );
};
