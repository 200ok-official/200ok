"use client";

import React from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";

interface Props {
  data: any;
  updateData: (data: any) => void;
}

export const Step6MaintenanceExpectations: React.FC<Props> = ({ data, updateData }) => {
  const handleReferenceLinksChange = (index: number, value: string) => {
    const links = [...(data.referenceLinks || [""])];
    links[index] = value;
    updateData({ referenceLinks: links.filter(link => link.trim() !== "") });
  };

  const addReferenceLink = () => {
    updateData({ referenceLinks: [...(data.referenceLinks || []), ""] });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#20263e] mb-3">
          完成後的期望
        </h2>
        <p className="text-[#c5ae8c]">
          最後，讓我們了解您對完成的期待
        </p>
      </div>

      {/* 預期成果 */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-[#20263e]">
          完成後，您希望達到什麼效果？ <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-[#c5ae8c]">
          描述完成後系統應該要能做到什麼
        </p>
        <textarea
          value={data.maint_expected_outcomes || ""}
          onChange={(e) => updateData({ maint_expected_outcomes: e.target.value })}
          placeholder="例如：&#10;- 系統速度變快，不再當機&#10;- 手機也能順暢使用&#10;- 可以自己修改內容，不用每次都找廠商&#10;- 報表能匯出 Excel，方便做分析"
          className="w-full px-4 py-3 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20 min-h-[130px]"
          rows={5}
        />
      </div>

      {/* 成功標準 */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-[#20263e]">
          怎樣算是成功完成了？（選填）
        </label>
        <p className="text-sm text-[#c5ae8c]">
          可以測試的具體標準，例如：「100 人同時用不會當」「3 秒內載入完成」
        </p>
        <textarea
          value={data.maint_success_criteria || ""}
          onChange={(e) => updateData({ maint_success_criteria: e.target.value })}
          placeholder="例如：&#10;- 能承受 200 人同時使用&#10;- 頁面載入時間在 3 秒內&#10;- 手機 Safari 和 Chrome 都能正常使用&#10;- 所有功能都通過測試"
          className="w-full px-4 py-3 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20 min-h-[120px]"
          rows={5}
        />
      </div>

      {/* 參考資料 */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-[#20263e]">
          有相關資料可以提供嗎？（選填）
        </label>
        <p className="text-sm text-[#c5ae8c]">
          系統截圖、錯誤畫面、規格文件等，可貼上 Google Drive 或 Dropbox 連結
        </p>
        {(data.referenceLinks || [""]).map((link: string, index: number) => (
          <input
            key={index}
            type="url"
            value={link}
            onChange={(e) => handleReferenceLinksChange(index, e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-3 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20"
          />
        ))}
        <button
          onClick={addReferenceLink}
          className="text-sm text-[#20263e] hover:underline"
        >
          + 新增連結
        </button>
      </div>

      {/* 其他補充 */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-[#20263e]">
          還有什麼要補充的嗎？（選填）
        </label>
        <p className="text-sm text-[#c5ae8c]">
          例如：特殊需求、時間限制、配合事項等
        </p>
        <textarea
          value={data.maint_additional_notes || ""}
          onChange={(e) => updateData({ maint_additional_notes: e.target.value })}
          placeholder="例如：&#10;- 需要在營業時間外進行更新&#10;- 需要保留舊資料&#10;- 希望有操作教學&#10;- 需要簽保密協議"
          className="w-full px-4 py-3 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none focus:ring-2 focus:ring-[#20263e] focus:ring-opacity-20 min-h-[120px]"
          rows={5}
        />
      </div>

      {/* 完成提示 */}
      <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg">
        <div className="flex items-start gap-3">
          <SparklesIcon className="w-8 h-8 text-green-600 shrink-0" />
          <div>
            <h3 className="font-semibold text-[#20263e] mb-2">即將完成！</h3>
            <p className="text-sm text-[#20263e]">
              填完這一步後，確認資訊無誤就可以發布案件了。接案者會根據您提供的資訊來評估和報價。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

