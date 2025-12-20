"use client";

import React from "react";
import { LightBulbIcon } from "@heroicons/react/24/outline";

interface Props {
  data: any;
  updateData: (data: any) => void;
}

export const Step2MaintenanceSystem: React.FC<Props> = ({ data, updateData }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#20263e] mb-2">
          告訴我們您的系統基本資訊
        </h2>
        <p className="text-sm text-[#c5ae8c]">
          不需要太技術性的描述，用您自己的話說就可以了
        </p>
      </div>

      {/* 系統名稱 */}
      <div className="space-y-2">
        <label className="block text-base font-semibold text-[#20263e]">
          這個系統叫什麼名字？ <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.maint_system_name || ""}
          onChange={(e) => updateData({ maint_system_name: e.target.value })}
          placeholder="例如：公司官網、庫存管理系統、會員APP"
          className="w-full px-3 py-2 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none text-sm"
        />
      </div>

      {/* 系統用途 */}
      <div className="space-y-2">
        <label className="block text-base font-semibold text-[#20263e]">
          這個系統是做什麼用的？ <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.maint_system_purpose || ""}
          onChange={(e) => updateData({ maint_system_purpose: e.target.value })}
          placeholder="例如：&#10;- 讓客戶可以在線上瀏覽產品和下單&#10;- 員工用來管理庫存和出貨"
          className="w-full px-3 py-2 rounded-lg border border-[#c5ae8c] focus:border-[#20263e] focus:outline-none text-sm min-h-[80px]"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 使用人數 */}
        <div className="space-y-2">
          <label className="block text-base font-semibold text-[#20263e]">
            大約有多少人在使用？ <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "1-10", label: "1-10 人" },
              { value: "11-50", label: "11-50 人" },
              { value: "51-100", label: "51-100 人" },
              { value: "101-500", label: "101-500 人" },
              { value: "501-1000", label: "501-1000" },
              { value: "1000+", label: "1000+" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateData({ maint_current_users_count: option.value })}
                className={`py-2 px-1 rounded-lg border transition-all ${
                  data.maint_current_users_count === option.value
                    ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                    : "border-[#e5e7eb] hover:border-[#c5ae8c]"
                }`}
              >
                <span className="text-xs font-medium text-[#20263e]">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 使用時間 */}
        <div className="space-y-2">
          <label className="block text-base font-semibold text-[#20263e]">
            這個系統用了多久？ <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "less_than_1_year", label: "不到 1 年" },
              { value: "1-3_years", label: "1-3 年" },
              { value: "3-5_years", label: "3-5 年" },
              { value: "5+_years", label: "5 年以上" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateData({ maint_system_age: option.value })}
                className={`py-2 px-1 rounded-lg border transition-all ${
                  data.maint_system_age === option.value
                    ? "border-[#20263e] bg-[#20263e] bg-opacity-5"
                    : "border-[#e5e7eb] hover:border-[#c5ae8c]"
                }`}
              >
                <span className="text-xs font-medium text-[#20263e]">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 小提示 */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <LightBulbIcon className="w-5 h-5 text-blue-800 shrink-0" />
        <p className="text-xs text-blue-800 pt-1">
          <strong>小提示：</strong> 不用擔心描述得不夠專業，接案者會根據您提供的資訊進一步了解細節。
        </p>
      </div>
    </div>
  );
};

