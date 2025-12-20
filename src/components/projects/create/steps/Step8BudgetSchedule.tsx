"use client";

import React from "react";
import { getProjectTypeHints } from "../config/projectTypeHints";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  CheckIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

interface Props {
  data: any;
  updateData: (data: any) => void;
}

const BUDGET_PRESETS = [
  { label: "$20k 以下", min: 5000, max: 20000 },
  { label: "$20k - $50k", min: 20000, max: 50000 },
  { label: "$50k - $100k", min: 50000, max: 100000 },
  { label: "$100k - $200k", min: 100000, max: 200000 },
  { label: "$200k 以上", min: 200000, max: 500000 },
];

const MIN_BUDGET = 5000;
const MAX_BUDGET = 500000;

const PAYMENT_METHODS = [
  { value: "one_time", label: "一次付清", desc: "專案完成後一次付款" },
  { value: "installment", label: "分期付款（3331 模式）", desc: "簽約 30% / 中期 30% / 交付 30% / 驗收 10%" },
  { value: "installment_442", label: "分期付款（442 模式）", desc: "簽約 40% / 交付 40% / 驗收 20%" },
  { value: "other", label: "其他方式", desc: "與接案者協商" },
];

export const Step8BudgetSchedule: React.FC<Props> = ({ data, updateData }) => {
  const hints = getProjectTypeHints(data.projectType);
  
  const formatCurrency = (value: number, isMin: boolean = false, isMax: boolean = false) => {
    let formatted = "";
    if (value >= 1000) {
      formatted = `$${(value / 1000).toFixed(0)}k`;
    } else {
      formatted = `$${value.toLocaleString()}`;
    }
    
    // 顯示「以下」或「以上」
    if (isMin && value <= MIN_BUDGET) {
      return `${formatted} 以下`;
    }
    if (isMax && value >= MAX_BUDGET) {
      return `${formatted} 以上`;
    }
    
    return formatted;
  };

  const handleBudgetMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    updateData({ budgetMin: value });
  };

  const handleBudgetMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    updateData({ budgetMax: value });
  };

  const handlePresetClick = (preset: typeof BUDGET_PRESETS[0]) => {
    updateData({ budgetMin: preset.min, budgetMax: preset.max, budgetEstimateOnly: false });
  };

  const getBudgetScale = () => {
    const avg = ((data.budgetMin || 0) + (data.budgetMax || 0)) / 2;
    if (avg < 30000) return "微型專案";
    if (avg < 80000) return "小型專案";
    if (avg < 150000) return "中型專案";
    if (avg < 300000) return "大型專案";
    return "企業級專案";
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#20263e] mb-3">
          預算與時程安排
        </h2>
        <p className="text-[#c5ae8c]">
          告訴我們您的預算範圍和期望時程
        </p>
      </div>

      {/* 預算範圍 */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#20263e]">
              預算範圍
            </label>
            <button
              onClick={() => updateData({ budgetEstimateOnly: !data.budgetEstimateOnly })}
              className={`text-sm px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                data.budgetEstimateOnly
                  ? "bg-[#c5ae8c] text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              {data.budgetEstimateOnly && <CheckIcon className="w-4 h-4" />}
              先估型（讓接案者報價）
            </button>
          </div>
          {!data.budgetEstimateOnly && (
            <p className="text-xs text-[#c5ae8c] flex items-start gap-1">
              <LightBulbIcon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                建議：如果您已經在前面的步驟填寫詳細需求，可以選擇「先估型」讓接案者報價。如果需求細節還不夠清楚，建議先選擇一個預算區間。
              </span>
            </p>
          )}
        </div>

        {!data.budgetEstimateOnly && (
          <div>
            {/* 快速預算選項 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {BUDGET_PRESETS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetClick(preset)}
                  className="px-4 py-2 text-sm rounded-lg border border-[#c5ae8c] hover:border-[#20263e] hover:bg-[#f5f3ed] transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* 雙拉桿 */}
            <div className="bg-white p-4 rounded-lg border border-[#c5ae8c]">
              <div className="flex justify-between items-center mb-3">
                <div className="text-center flex-1">
                  <p className="text-xs text-[#c5ae8c] mb-0.5">最低預算</p>
                  <p className="text-xl font-bold text-[#20263e]">
                    {formatCurrency(data.budgetMin || 40000, true, false)}
                  </p>
                </div>
                <div className="text-[#c5ae8c] px-2">~</div>
                <div className="text-center flex-1">
                  <p className="text-xs text-[#c5ae8c] mb-0.5">最高預算</p>
                  <p className="text-xl font-bold text-[#20263e]">
                    {formatCurrency(data.budgetMax || 80000, false, true)}
                  </p>
                </div>
              </div>

              {/* 雙頭拉桿 - 使用 CSS 疊層實作 */}
              <div className="relative h-10 flex items-center mb-3">
                {/* 背景軌道 */}
                <div className="absolute w-full h-2 bg-gray-200 rounded-lg" style={{ top: '50%', transform: 'translateY(-50%)' }}></div>
                
                {/* 已選中的範圍 */}
                <div
                  className="absolute h-2 bg-[#20263e] rounded-lg"
                  style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: `${((data.budgetMin || 40000) - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET) * 100}%`,
                    right: `${100 - (((data.budgetMax || 80000) - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET) * 100)}%`,
                  }}
                ></div>

                {/* 最低預算拉桿 */}
                <input
                  type="range"
                  min={MIN_BUDGET}
                  max={MAX_BUDGET}
                  step="5000"
                  value={data.budgetMin || 40000}
                  onChange={(e) => {
                    const newMin = parseInt(e.target.value);
                    const currentMax = data.budgetMax || 80000;
                    if (newMin <= currentMax) {
                      handleBudgetMinChange(e);
                    }
                  }}
                  className="absolute w-full appearance-none bg-transparent rounded-lg cursor-pointer pointer-events-none"
                  style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: data.budgetMin > (data.budgetMax || 80000) - 50000 ? 5 : 3,
                  }}
                />

                {/* 最高預算拉桿 */}
                <input
                  type="range"
                  min={MIN_BUDGET}
                  max={MAX_BUDGET}
                  step="5000"
                  value={data.budgetMax || 80000}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value);
                    const currentMin = data.budgetMin || 40000;
                    if (newMax >= currentMin) {
                      handleBudgetMaxChange(e);
                    }
                  }}
                  className="absolute w-full appearance-none bg-transparent rounded-lg cursor-pointer pointer-events-none"
                  style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: data.budgetMax <= (data.budgetMin || 40000) + 50000 ? 5 : 4,
                  }}
                />

                <style>{`
                  input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #c5ae8c;
                    cursor: grab;
                    border: 3px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    pointer-events: auto;
                  }

                  input[type="range"]:active::-webkit-slider-thumb {
                    cursor: grabbing;
                  }

                  input[type="range"]::-moz-range-thumb {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #c5ae8c;
                    cursor: grab;
                    border: 3px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    pointer-events: auto;
                  }

                  input[type="range"]:active::-moz-range-thumb {
                    cursor: grabbing;
                  }

                  input[type="range"]::-webkit-slider-thumb:hover {
                    background: #b59b75;
                  }

                  input[type="range"]::-moz-range-thumb:hover {
                    background: #b59b75;
                  }
                `}</style>
              </div>

              {/* 提示文字和預算標籤 */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#c5ae8c] flex items-center gap-1">
                  <span>↔️</span>
                  <span>拖動調整最低與最高預算</span>
                </p>
                <span className="inline-block px-3 py-1 bg-[#20263e] text-white rounded-full text-xs font-semibold">
                  {getBudgetScale()}
                </span>
              </div>
            </div>
          </div>
        )}

        {data.budgetEstimateOnly && (
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
            <div className="space-y-3">
              <p className="text-sm text-yellow-900 font-semibold">
                ⚠️ 重要提示：選擇「先估型」模式
              </p>
              <div className="text-sm text-yellow-800 space-y-2">
                <p>
                  <strong>為了讓接案工程師更容易估價並增加接單意願，請務必：</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>在前面的步驟中<strong>盡量填寫詳細</strong>的需求描述</li>
                  <li>清楚說明功能規格、使用情境、設計偏好等細節</li>
                  <li>提供參考案例或類似產品的連結</li>
                  <li>詳細描述技術需求和整合需求</li>
                </ul>
                <p className="mt-3 pt-3 border-t border-yellow-300">
                  <strong>💡 如果您的需求細節還不夠清楚：</strong><br />
                  建議您先<strong>選擇一個預算區間</strong>，這樣可以幫助接案者更快理解專案規模，也能吸引更多工程師查看您的案件。待需求更明確後，可以在後續溝通中調整預算。
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => updateData({ budgetEstimateOnly: false })}
                    className="px-4 py-2 text-sm bg-white border-2 border-yellow-400 text-yellow-800 rounded-lg hover:bg-yellow-100 transition-colors font-semibold"
                  >
                    ← 改為選擇預算區間
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 時程安排 */}
      <div className="space-y-4 mt-8">
        <label className="block text-sm font-semibold text-[#20263e] mb-2">
          時程安排
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#c5ae8c] mb-2">
              希望開始日期
            </label>
            <DatePicker
              value={data.startDate ? new Date(data.startDate) : undefined}
              onChange={(date) => {
                const updates: any = { startDate: date };
                // 如果開始日期改變，且完成日期早於新的開始日期，清除完成日期
                if (date && data.deadline && new Date(data.deadline) < date) {
                  updates.deadline = undefined;
                }
                updateData(updates);
              }}
              minDate={new Date()}
              placeholder="選擇開始日期"
            />
          </div>

          <div>
            <label className="block text-xs text-[#c5ae8c] mb-2">
              期望完成日期
            </label>
            <DatePicker
              value={data.deadline ? new Date(data.deadline) : undefined}
              onChange={(date) => updateData({ deadline: date })}
              minDate={data.startDate ? new Date(data.startDate) : new Date()}
              placeholder="選擇完成日期"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.deadlineFlexible || false}
            onChange={(e) => updateData({ deadlineFlexible: e.target.checked })}
            className="w-4 h-4 accent-[#20263e]"
          />
          <span className="text-sm text-[#20263e]">時程有彈性，可與接案者協商</span>
        </label>
      </div>

      {/* 付款方式 */}
      <div className="space-y-4 mt-8">
        <label className="block text-sm font-semibold text-[#20263e] mb-3">
          付款條件
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.value}
              onClick={() => updateData({ paymentMethod: method.value })}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                data.paymentMethod === method.value
                  ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                  : "border-[#c5ae8c] hover:border-[#20263e]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-[#20263e] mb-1">
                    {method.label}
                  </h4>
                  <p className="text-sm text-[#c5ae8c]">{method.desc}</p>
                </div>
                {data.paymentMethod === method.value && (
                  <span className="text-[#20263e] text-xl ml-2">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 小提示 */}
      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">
          <strong>💰 建議：</strong> {hints.budgetSchedule.hint}
        </p>
      </div>
    </div>
  );
};

