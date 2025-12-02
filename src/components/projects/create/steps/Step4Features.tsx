"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  data: any;
  updateData: (data: any) => void;
}

export const Step4Features: React.FC<Props> = ({ data, updateData }) => {
  const [newFeature, setNewFeature] = useState("");

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      const features = data.features || [];
      updateData({ features: [...features, newFeature.trim()] });
      setNewFeature("");
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
          placeholder="例如：瀏覽商品、上傳作品、線上報名..."
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
                  className="text-red-500 hover:text-red-700 text-xs"
                  aria-label="移除功能"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 範例提示 */}
      <div className="mt-4 p-4 bg-[#f5f3ed] rounded-lg">
        <p className="text-sm font-semibold text-[#20263e] mb-2">
          功能範例參考：
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs md:text-sm text-[#c5ae8c]">
          {[
            "會員註冊登入",
            "瀏覽商品 / 服務",
            "加入購物車",
            "線上付款",
            "預約時間",
            "上傳檔案 / 圖片",
            "留言 / 評論",
            "查看歷史紀錄",
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="mt-0.5 text-[10px]">•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 小提示 */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 小提示：</strong> 每項功能用一句話簡單描述即可，不需要太技術性的說明。
        </p>
      </div>
    </div>
  );
};

