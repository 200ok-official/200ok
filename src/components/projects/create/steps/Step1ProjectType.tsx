"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  SparklesIcon,
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  PlayCircleIcon,
  PuzzlePieceIcon,
  CheckIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";

interface Props {
  data: any;
  updateData: (data: any) => void;
}

const PROJECT_MODES = [
  { 
    value: "new_development", 
    label: "全新開發", 
    icon: SparklesIcon, 
    desc: "從零開始打造新的軟體或系統",
    color: "blue"
  },
  { 
    value: "maintenance_modification", 
    label: "修改/維護現有系統", 
    icon: WrenchScrewdriverIcon, 
    desc: "調整、優化或擴充既有的軟體",
    color: "green"
  },
];

const PROJECT_TYPES = [
  { value: "website", label: "官方形象網站", icon: BuildingOfficeIcon, desc: "公司介紹、聯絡表單" },
  { value: "ecommerce", label: "電商平台", icon: ShoppingCartIcon, desc: "商品展示、購物車、金流" },
  { value: "erp_crm", label: "ERP / CRM 系統", icon: ClipboardDocumentListIcon, desc: "內部管理用" },
  { value: "chatbot", label: "Line LIFF / Line 工具", icon: ChatBubbleLeftRightIcon, desc: "Line 官方帳號、LIFF 應用、Line 整合工具" },
  { value: "mobile_app", label: "手機 App", icon: DevicePhoneMobileIcon, desc: "會員系統、預約系統" },
  { value: "game", label: "手機遊戲 / 網頁遊戲", icon: PlayCircleIcon, desc: "休閒或競技遊戲" },
  { value: "other", label: "其他", icon: PuzzlePieceIcon, desc: "需進一步說明" },
];

export const Step1ProjectType: React.FC<Props> = ({ data, updateData }) => {
  const [showOtherInput, setShowOtherInput] = useState(data.projectType === "other");

  const handleModeSelect = (mode: string) => {
    updateData({ projectMode: mode, projectType: undefined });
    setShowOtherInput(false);
  };

  const handleTypeSelect = (type: string) => {
    updateData({ projectType: type });
    setShowOtherInput(type === "other");
  };

  return (
    <div className="space-y-8">
      {/* 第一階段：選擇專案模式 */}
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#20263e] mb-3">
            這是什麼類型的專案？
          </h2>
          <p className="text-[#c5ae8c]">
            請先告訴我們您是要全新開發，還是修改現有系統
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {PROJECT_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => handleModeSelect(mode.value)}
              className={`p-8 rounded-xl border-2 transition-all text-center hover:shadow-lg ${
                data.projectMode === mode.value
                  ? "border-[#20263e] bg-[#20263e] bg-opacity-5 shadow-md"
                  : "border-[#c5ae8c] hover:border-[#20263e]"
              }`}
            >
              <div className="space-y-3 flex flex-col items-center">
                <mode.icon className="w-12 h-12 text-[#20263e]" />
                <h3 className="text-xl font-semibold text-[#20263e]">
                  {mode.label}
                </h3>
                <p className="text-sm text-[#c5ae8c]">{mode.desc}</p>
                {data.projectMode === mode.value && (
                  <CheckIcon className="w-8 h-8 text-[#20263e] block mt-2" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 第二階段：如果選擇「全新開發」，顯示專案類型 */}
      {data.projectMode === "new_development" && (
        <div className="space-y-6 pt-8 border-t-2 border-[#c5ae8c]">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#20263e] mb-3">
              你想做的東西屬於哪一類？
            </h2>
            <p className="text-[#c5ae8c]">
              選擇最接近的類型，幫助我們更了解您的需求
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROJECT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeSelect(type.value)}
                className={`p-6 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                  data.projectType === type.value
                    ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                    : "border-[#c5ae8c] hover:border-[#20263e]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <type.icon className="w-10 h-10 text-[#20263e] shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#20263e] mb-1">
                      {type.label}
                    </h3>
                    <p className="text-sm text-[#c5ae8c]">{type.desc}</p>
                  </div>
                  {data.projectType === type.value && (
                    <CheckIcon className="w-6 h-6 text-[#20263e] shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {showOtherInput && (
            <div className="mt-6 p-6 bg-[#f5f3ed] rounded-lg">
              <label className="block text-sm font-semibold text-[#20263e] mb-2">
                能用一句話說說你想做什麼嗎？
              </label>
              <textarea
                value={data.projectTypeOther || ""}
                onChange={(e) => updateData({ projectTypeOther: e.target.value })}
                placeholder="例如：想做一個幫學生記錄學習進度的小工具"
                className="w-full px-4 py-3 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20"
                rows={3}
              />
            </div>
          )}
        </div>
      )}

      {/* 小提示 */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 flex items-start gap-1">
          <LightBulbIcon className="w-5 h-5 shrink-0" />
          <span>
            <strong>小提示：</strong> 不確定選哪個？沒關係！選擇最接近的類型，我們後續會進一步了解您的需求。
          </span>
        </p>
      </div>
    </div>
  );
};

