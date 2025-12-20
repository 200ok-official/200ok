"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { getProjectTypeHints } from "../config/projectTypeHints";
import { CheckIcon, XMarkIcon, LightBulbIcon } from "@heroicons/react/24/outline";

interface Props {
  data: any;
  updateData: (data: any) => void;
}

export const Step4Features: React.FC<Props> = ({ data, updateData }) => {
  const hints = getProjectTypeHints(data.projectType);
  const featureExamples = hints.features.examples;
  const [newFeature, setNewFeature] = useState("");

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      const features = data.features || [];
      // 檢查是否已存在
      if (!features.includes(newFeature.trim())) {
        updateData({ features: [...features, newFeature.trim()] });
      }
      setNewFeature("");
    }
  };

  const handleQuickAdd = (example: string) => {
    const features = data.features || [];
    // 檢查是否已存在
    if (!features.includes(example)) {
      updateData({ features: [...features, example] });
    }
  };

  const handleRemoveFeature = (index: number) => {
    const features = [...(data.features || [])];
    features.splice(index, 1);
    updateData({ features });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddFeature();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#20263e] mb-3">
          你希望使用者可以做哪些事？
        </h2>
        <p className="text-[#c5ae8c]">
          列出軟體需要具備的功能
        </p>
      </div>

      {/* 新增功能輸入 */}
      <div className="flex gap-3">
        <input
          type="text"
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={hints.features.placeholder}
          className="flex-1 px-4 py-3 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20"
        />
        <Button onClick={handleAddFeature} disabled={!newFeature.trim()}>
          新增
        </Button>
      </div>

      {/* 功能列表 */}
      {data.features && data.features.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#20263e]">
            已新增的功能：
          </p>
          <div className="flex flex-wrap gap-2">
            {data.features.map((feature: string, index: number) => (
              <div
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#c5ae8c] bg-white text-xs md:text-sm text-[#20263e]"
              >
                <span>{feature}</span>
                <button
                  onClick={() => handleRemoveFeature(index)}
                  className="text-red-500 hover:text-red-700"
                  aria-label="移除功能"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 快速新增按鈕 */}
      <div className="mt-4 p-4 bg-[#f5f3ed] rounded-lg">
        <p className="text-sm font-semibold text-[#20263e] mb-3">
          快速新增功能範例：
        </p>
        <div className="flex flex-wrap gap-2">
          {featureExamples.map((item, idx) => {
            const isAdded = data.features?.includes(item);
            return (
              <button
                key={idx}
                onClick={() => handleQuickAdd(item)}
                disabled={isAdded}
                className={`px-3 py-1.5 rounded-full text-xs md:text-sm transition-all flex items-center gap-1 ${
                  isAdded
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed line-through'
                    : 'bg-white border border-[#c5ae8c] text-[#20263e] hover:border-[#20263e] hover:bg-[#e6dfcf]'
                }`}
              >
                {isAdded && <CheckIcon className="w-3 h-3" />}
                {item}
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
            <strong>小提示：</strong> {hints.features.hint}
          </span>
        </p>
      </div>
    </div>
  );
};

