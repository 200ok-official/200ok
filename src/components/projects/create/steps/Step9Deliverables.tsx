"use client";

import React from "react";
import { getProjectTypeHints } from "../config/projectTypeHints";
import {
  CommandLineIcon,
  KeyIcon,
  VideoCameraIcon,
  BookOpenIcon,
  WrenchScrewdriverIcon,
  RocketLaunchIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  CheckIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";

interface Props {
  data: any;
  updateData: (data: any) => void;
}

const DELIVERABLE_OPTIONS = [
  { value: "source_code", label: "原始碼" },
  { value: "admin_credentials", label: "後台帳密" },
  { value: "tutorial_video", label: "教學影片" },
  { value: "documentation", label: "使用文件" },
  { value: "maintenance", label: "維護服務" },
  { value: "deployment", label: "上線代辦" },
  { value: "training", label: "操作培訓" },
];

const COMMUNICATION_OPTIONS = [
  { value: "line", label: "Line" },
  { value: "email", label: "Email" },
  { value: "phone", label: "語音通話" },
  { value: "video", label: "視訊會議" },
  { value: "report", label: "定期進度報告" },
];

const ICON_MAP: Record<string, any> = {
  source_code: CommandLineIcon,
  admin_credentials: KeyIcon,
  tutorial_video: VideoCameraIcon,
  documentation: BookOpenIcon,
  maintenance: WrenchScrewdriverIcon,
  deployment: RocketLaunchIcon,
  training: AcademicCapIcon,
  line: ChatBubbleLeftRightIcon,
  email: EnvelopeIcon,
  phone: PhoneIcon,
  video: VideoCameraIcon,
  report: ChartBarIcon,
};

export const Step9Deliverables: React.FC<Props> = ({ data, updateData }) => {
  const hints = getProjectTypeHints(data.projectType);
  // 如果有類型特定的優先選項，將它們放在前面
  const priorityOptions = hints.deliverables.priorityOptions || [];
  const otherOptions = DELIVERABLE_OPTIONS.filter(
    opt => !priorityOptions.some(po => po.value === opt.value)
  );
  const displayOptions = [...priorityOptions, ...otherOptions];
  
  const handleDeliverableToggle = (value: string) => {
    const deliverables = data.deliverables || [];
    if (deliverables.includes(value)) {
      updateData({ deliverables: deliverables.filter((d: string) => d !== value) });
    } else {
      updateData({ deliverables: [...deliverables, value] });
    }
  };

  const handleCommunicationToggle = (value: string) => {
    const communication = data.communicationPreference || [];
    if (communication.includes(value)) {
      updateData({ communicationPreference: communication.filter((c: string) => c !== value) });
    } else {
      updateData({ communicationPreference: [...communication, value] });
    }
  };

  const isDeliverableSelected = (value: string) => {
    return (data.deliverables || []).includes(value);
  };

  const isCommunicationSelected = (value: string) => {
    return (data.communicationPreference || []).includes(value);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#20263e] mb-3">
          交付時你想拿到什麼？
        </h2>
        <p className="text-[#c5ae8c]">
          選擇專案完成後希望獲得的成果
        </p>
      </div>

      {/* 交付物選擇 */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-[#20263e] mb-3">
          希望獲得的交付物（可複選）
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayOptions.map((option) => {
            const Icon = ICON_MAP[option.value] || QuestionMarkCircleIcon;
            return (
            <button
              key={option.value}
              onClick={() => handleDeliverableToggle(option.value)}
              className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                isDeliverableSelected(option.value)
                  ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                  : "border-[#c5ae8c] hover:border-[#20263e]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon className="w-8 h-8 text-[#20263e]" />
                  <span className="text-base font-semibold text-[#20263e]">
                    {option.label}
                  </span>
                </div>
                {isDeliverableSelected(option.value) && (
                    <CheckIcon className="w-6 h-6 text-[#20263e]" />
                )}
              </div>
            </button>
            );
          })}
        </div>
      </div>

      {/* 溝通方式偏好 */}
      <div className="space-y-4 mt-8">
        <label className="block text-sm font-semibold text-[#20263e] mb-3">
          溝通方式偏好（可複選）
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COMMUNICATION_OPTIONS.map((option) => {
            const Icon = ICON_MAP[option.value] || QuestionMarkCircleIcon;
            return (
            <button
              key={option.value}
              onClick={() => handleCommunicationToggle(option.value)}
              className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                isCommunicationSelected(option.value)
                  ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                  : "border-[#c5ae8c] hover:border-[#20263e]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon className="w-8 h-8 text-[#20263e]" />
                  <span className="text-base font-semibold text-[#20263e]">
                    {option.label}
                  </span>
                </div>
                {isCommunicationSelected(option.value) && (
                    <CheckIcon className="w-6 h-6 text-[#20263e]" />
                )}
              </div>
            </button>
            );
          })}
        </div>
      </div>

      {/* 小提示 */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 flex items-start gap-1">
          <LightBulbIcon className="w-5 h-5 shrink-0" />
          <span>
            <strong>小提示：</strong> {hints.deliverables.hint}
          </span>
        </p>
      </div>
    </div>
  );
};

