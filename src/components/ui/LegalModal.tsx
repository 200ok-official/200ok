import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/solid";

type LegalType = "terms" | "privacy";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: LegalType;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const content = type === "terms" ? (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-[#20263e]">1. 服務條款接受</h3>
      <p>歡迎使用 200 OK（以下簡稱「本平台」）。當您註冊或使用本平台服務時，即表示您已閱讀、瞭解並同意遵守本服務條款。</p>
      
      <h3 className="text-xl font-bold text-[#20263e]">2. 服務內容</h3>
      <p>本平台提供軟體外包媒合服務，連接發案者（客戶）與接案者（開發者）。本平台僅提供資訊媒合及專案管理工具，不直接參與實際專案開發工作。</p>
      
      <h3 className="text-xl font-bold text-[#20263e]">3. 帳號註冊與安全</h3>
      <p>您需提供正確、最新的個人資料進行註冊。您有責任維護帳號密碼的安全，並對該帳號下的所有活動負責。</p>
      
      <h3 className="text-xl font-bold text-[#20263e]">4. 使用者行為規範</h3>
      <p>使用者不得利用本平台從事任何非法、侵權或違反公序良俗之行為。禁止發布虛假需求、惡意競標或騷擾其他使用者。</p>
      
      <h3 className="text-xl font-bold text-[#20263e]">5. 付款與退款</h3>
      <p>專案款項透過本平台代收代付機制處理。雙方確認驗收後，平台將扣除服務費後撥款給接案者。如遇爭議，將依據爭議處理機制進行調解。</p>
      
      <h3 className="text-xl font-bold text-[#20263e]">6. 智慧財產權</h3>
      <p>除非雙方另有約定，完成並全額付款之專案成果，其智慧財產權歸發案者所有。接案者保留展示作品於個人履歷之權利。</p>
      
      <h3 className="text-xl font-bold text-[#20263e]">7. 免責聲明</h3>
      <p>本平台不保證服務不中斷或無錯誤。對於因不可抗力或第三方因素導致的服務中斷或資料遺失，本平台不負賠償責任。</p>
    </div>
  ) : (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-[#20263e]">1. 隱私權政策適用範圍</h3>
      <p>本隱私權政策說明 200 OK 如何蒐集、處理及利用您的個人資料。本政策適用於您使用本平台服務時所涉及的個人資料。</p>
      
      <h3 className="text-xl font-bold text-[#20263e]">2. 資料蒐集</h3>
      <p>我們會蒐集您註冊時提供的姓名、電子郵件、電話等資訊，以及您在使用平台時產生的交易紀錄、溝通內容等。</p>
      
      <h3 className="text-xl font-bold text-[#20263e]">3. 資料使用</h3>
      <p>蒐集的資料將用於身分驗證、媒合服務、客戶服務、系統通知及平台優化。我們不會將您的個人資料販售給第三方。</p>
      
      <h3 className="text-xl font-bold text-[#20263e]">4. 資料保護</h3>
      <p>我們採用業界標準的資安措施保護您的個人資料，防止未經授權的存取、洩漏或竄改。</p>
      
      <h3 className="text-xl font-bold text-[#20263e]">5. Cookie 使用</h3>
      <p>本平台使用 Cookie 技術以提供更好的使用者體驗及分析流量。您可透過瀏覽器設定拒絕 Cookie，但可能影響部分功能使用。</p>
      
      <h3 className="text-xl font-bold text-[#20263e]">6. 您的權利</h3>
      <p>您可隨時查詢、閱覽、複製、補充或更正您的個人資料，或要求停止蒐集、處理、利用或刪除您的帳號。</p>
      
      <h3 className="text-xl font-bold text-[#20263e]">7. 政策修訂</h3>
      <p>本平台有權隨時修訂隱私權政策，修訂後的版本將公告於網站上。繼續使用本平台即代表您同意修訂後的內容。</p>
    </div>
  );

  const title = type === "terms" ? "服務條款" : "隱私權政策";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-[#20263e]">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-[#20263e] hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar text-gray-600 leading-relaxed text-base">
          {content}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-[#20263e] text-white font-medium rounded-lg hover:bg-[#2d3550] transition-colors shadow-lg shadow-[#20263e]/20"
          >
            我瞭解了
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

