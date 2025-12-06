"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { getProjectTypeHints } from "../config/projectTypeHints";

interface Props {
  data: any;
  updateData: (data: any) => void;
}

const DESIGN_STYLES = [
  "簡潔",
  "溫暖",
  "科技感",
  "專業",
  "活潑",
  "高級感",
  "親切",
  "現代",
];

export const Step6Reference: React.FC<Props> = ({ data, updateData }) => {
  const hints = getProjectTypeHints(data.projectType);
  const [newLink, setNewLink] = useState("");
  const [customStyle, setCustomStyle] = useState("");

  const handleAddLink = () => {
    if (newLink.trim()) {
      const links = data.referenceLinks || [];
      updateData({ referenceLinks: [...links, newLink.trim()] });
      setNewLink("");
    }
  };

  const handleRemoveLink = (index: number) => {
    const links = [...(data.referenceLinks || [])];
    links.splice(index, 1);
    updateData({ referenceLinks: links });
  };

  const handleStyleToggle = (style: string) => {
    const styles = data.designStyle || [];
    if (styles.includes(style)) {
      updateData({ designStyle: styles.filter((s: string) => s !== style) });
    } else {
      updateData({ designStyle: [...styles, style] });
    }
  };

  const isStyleSelected = (style: string) => {
    return (data.designStyle || []).includes(style);
  };

  const handleAddCustomStyle = () => {
    if (customStyle.trim()) {
      const styles = data.designStyle || [];
      // 檢查是否已存在
      if (!styles.includes(customStyle.trim())) {
        updateData({ designStyle: [...styles, customStyle.trim()] });
      }
      setCustomStyle("");
    }
  };

  const handleRemoveStyle = (style: string) => {
    const styles = (data.designStyle || []).filter((s: string) => s !== style);
    updateData({ designStyle: styles });
  };

  const handleCustomStyleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddCustomStyle();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#20263e] mb-3">
          有沒有想參考的網站或 App？
        </h2>
        <p className="text-[#c5ae8c]">
          提供參考案例或描述設計風格
        </p>
      </div>

      {/* 參考連結 */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-[#20263e] mb-2">
          參考網站 / App 連結
        </label>
        
        <div className="flex gap-3">
          <input
            type="url"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            placeholder="貼上網址，例如：https://example.com"
            className="flex-1 px-4 py-3 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20"
          />
          <Button onClick={handleAddLink} disabled={!newLink.trim()}>
            新增
          </Button>
        </div>

        {/* 已新增的連結 */}
        {data.referenceLinks && data.referenceLinks.length > 0 && (
          <div className="space-y-2 mt-4">
            {data.referenceLinks.map((link: string, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#c5ae8c]"
              >
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate flex-1"
                >
                  {link}
                </a>
                <button
                  onClick={() => handleRemoveLink(index)}
                  className="text-red-500 hover:text-red-700 px-2 ml-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 設計風格 */}
      <div className="mt-8">
        <label className="block text-sm font-semibold text-[#20263e] mb-3">
          設計風格偏好（可複選）
        </label>
        
        {/* 預設風格選項 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {DESIGN_STYLES.map((style) => (
            <button
              key={style}
              onClick={() => handleStyleToggle(style)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                isStyleSelected(style)
                  ? "bg-[#20263e] text-white"
                  : "bg-white border border-[#c5ae8c] text-[#20263e] hover:border-[#20263e]"
              }`}
            >
              {style}
            </button>
          ))}
        </div>

        {/* 自由填答 */}
        <div className="mt-4">
          <label className="block text-xs text-[#c5ae8c] mb-2">
            或自訂設計風格：
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
              onKeyPress={handleCustomStyleKeyPress}
              placeholder="例如：復古、極簡、文青風..."
              className="flex-1 px-4 py-2 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20 text-sm"
            />
            <Button 
              onClick={handleAddCustomStyle} 
              disabled={!customStyle.trim()}
              size="sm"
            >
              新增
            </Button>
          </div>
        </div>

        {/* 自訂風格標籤（只顯示非預設選項） */}
        {(() => {
          const customStyles = (data.designStyle || []).filter((style: string) => !DESIGN_STYLES.includes(style));
          if (customStyles.length > 0) {
            return (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-[#20263e] font-semibold">
                  已新增的自訂風格：
                </p>
                <div className="flex flex-wrap gap-2">
                  {customStyles.map((style: string, index: number) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e6dfcf] border border-[#c5ae8c] text-[#20263e] text-xs md:text-sm"
                    >
                      <span>{style}</span>
                      <button
                        onClick={() => handleRemoveStyle(style)}
                        className="text-red-500 hover:text-red-700 text-xs ml-1"
                        aria-label="移除風格"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* 小提示 */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 小提示：</strong> {hints.reference.hint}
        </p>
      </div>
    </div>
  );
};

