'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Button } from '@/components/ui/Button';
import { detectContactInfo, containsContactInfo } from '@/utils/contactDetection';
import { confirmPayment, paymentPresets } from '@/utils/paymentConfirm';
import { apiPost } from '@/lib/api';
import { triggerTokenBalanceUpdate } from '@/hooks/useSession';

interface ProposalFormProps {
  projectId: string;
  projectTitle: string;
  onSuccess?: (conversationId: string) => void;
  onCancel?: () => void;
}

export default function ProposalForm({
  projectId,
  projectTitle,
  onSuccess,
  onCancel,
}: ProposalFormProps) {
  const [proposal, setProposal] = useState('');
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [contactWarnings, setContactWarnings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 即時檢查聯絡方式
  useEffect(() => {
    if (proposal) {
      const detected = detectContactInfo(proposal);
      if (detected.length > 0) {
        const warnings = detected.map(
          ({ description, matches }) =>
            `${description}：${matches.join(', ')}`
        );
        setContactWarnings(warnings);
      } else {
        setContactWarnings([]);
      }
    } else {
      setContactWarnings([]);
    }
  }, [proposal]);

  // Markdown 快捷按鈕插入函數
  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = proposal.substring(start, end);
    const before = proposal.substring(0, start);
    const after = proposal.substring(end);
    
    // 如果沒有選中文字，且是標題類型，提供預設文字
    const defaultText = selected || (prefix.includes('#') ? '標題' : '文字');
    
    const newText = `${before}${prefix}${defaultText}${suffix}${after}`;
    setProposal(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length, 
        start + prefix.length + defaultText.length
      );
    }, 0);
  };

  const handleSubmit = async () => {
    // 驗證必填欄位
    if (!proposal.trim()) {
      alert('請輸入提案內容');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      alert('請輸入有效的預算金額');
      return;
    }
    if (!days || parseInt(days) <= 0) {
      alert('請輸入有效的預估天數');
      return;
    }

    // 檢查聯絡方式
    if (containsContactInfo(proposal)) {
      alert(
        '❌ 提案內容不得包含任何聯絡方式\n\n' +
        '偵測到：\n' +
        contactWarnings.map(w => `• ${w}`).join('\n') +
        '\n\n請移除後再提交。'
      );
      return;
    }

    // 確認付費
    const confirmed = await confirmPayment(
      paymentPresets.submitProposal(projectTitle)
    );

    if (!confirmed) return;

    setIsSubmitting(true);

    try {
      // 1. 創建 bid
      const response = await apiPost(`/api/v1/projects/${projectId}/bids`, {
        proposal: proposal,
        bid_amount: parseFloat(amount),
        estimated_days: parseInt(days),
      });

      // 2. 通知成功
      alert('✅ 提案已提交！\n\n已扣除 100 代幣\n等待發案者回應...');

      // 3. 通知 Navbar 更新代幣餘額
      triggerTokenBalanceUpdate();

      // 4. 回調（檢查是否有 conversation_id）
      if (onSuccess && response.data?.conversation_id) {
        onSuccess(response.data.conversation_id);
      } else if (onSuccess && response.data?.id) {
        // 如果只有 bid id，導向到案件頁面
        window.location.href = `/projects/${projectId}`;
      }
    } catch (error: any) {
      alert(`❌ 提交失敗：${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-[#20263e] mb-6">
          提交提案
        </h2>

        {/* 專案資訊 */}
        <div className="mb-6 p-4 bg-[#f5f3ed] rounded-lg">
          <p className="text-sm text-gray-600">案件</p>
          <p className="font-medium text-[#20263e]">{projectTitle}</p>
        </div>

        {/* 預算與時程 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#20263e] mb-2">
              預算金額 (TWD) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50000"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#20263e] mb-2">
              預估天數 *
            </label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="30"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* 編輯/預覽切換 */}
        <div className="flex items-center gap-4 mb-4">
          <label className="block text-sm font-medium text-[#20263e]">
            提案內容 * <span className="text-gray-500">(支援 Markdown)</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setIsPreview(false)}
              className={`px-3 py-1 text-sm rounded ${
                !isPreview
                  ? 'bg-[#20263e] text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
              disabled={isSubmitting}
            >
              編輯
            </button>
            <button
              onClick={() => setIsPreview(true)}
              className={`px-3 py-1 text-sm rounded ${
                isPreview
                  ? 'bg-[#20263e] text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
              disabled={isSubmitting}
            >
              預覽
            </button>
          </div>
        </div>

        {/* 提案內容 */}
        <div className="mb-4">
          {!isPreview ? (
            <div className="space-y-0">
              {/* Markdown Toolbar */}
              <div className="flex items-center gap-1 p-1 bg-gray-50 border rounded-t-md border-b-0">
                <button 
                  type="button"
                  onClick={() => insertMarkdown('**', '**')} 
                  className="p-2 hover:bg-gray-200 rounded text-sm font-bold" 
                  title="粗體"
                  disabled={isSubmitting}
                >
                  B
                </button>
                <button 
                  type="button"
                  onClick={() => insertMarkdown('_', '_')} 
                  className="p-2 hover:bg-gray-200 rounded text-sm italic" 
                  title="斜體"
                  disabled={isSubmitting}
                >
                  I
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button 
                  type="button"
                  onClick={() => insertMarkdown('# ')} 
                  className="p-2 hover:bg-gray-200 rounded text-sm font-bold" 
                  title="大標題"
                  disabled={isSubmitting}
                >
                  H1
                </button>
                <button 
                  type="button"
                  onClick={() => insertMarkdown('## ')} 
                  className="p-2 hover:bg-gray-200 rounded text-sm font-bold" 
                  title="中標題"
                  disabled={isSubmitting}
                >
                  H2
                </button>
                <button 
                  type="button"
                  onClick={() => insertMarkdown('- ')} 
                  className="p-2 hover:bg-gray-200 rounded text-sm" 
                  title="清單"
                  disabled={isSubmitting}
                >
                  • List
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button 
                  type="button"
                  onClick={() => insertMarkdown('[', '](url)')} 
                  className="p-2 hover:bg-gray-200 rounded text-sm" 
                  title="連結"
                  disabled={isSubmitting}
                >
                  🔗 Link
                </button>
                <button 
                  type="button"
                  onClick={() => insertMarkdown('`', '`')} 
                  className="p-2 hover:bg-gray-200 rounded text-sm font-mono" 
                  title="行內代碼"
                  disabled={isSubmitting}
                >
                  Code
                </button>
              </div>
              <textarea
                ref={textareaRef}
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                placeholder={`請詳細說明您的提案...\n\n例如：\n- 您的相關經驗\n- 技術方案與架構\n- 開發流程與時程\n- 交付內容與品質保證\n\n⚠️ 請勿包含任何聯絡方式（Email、電話、Line、社群帳號等）`}
                rows={15}
                className="w-full px-4 py-3 border border-t-0 rounded-b-lg focus:ring-2 focus:ring-[#20263e] focus:border-transparent font-mono text-sm"
                disabled={isSubmitting}
              />
            </div>
          ) : (
            <div className="border rounded-lg p-4 min-h-[400px] prose prose-sm max-w-none
              [&_pre]:bg-slate-50 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre]:border">
              {proposal ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                >
                  {proposal}
                </ReactMarkdown>
              ) : (
                <p className="text-gray-400">尚無內容</p>
              )}
            </div>
          )}
        </div>

        {/* 聯絡方式警告 */}
        {contactWarnings.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-red-600 text-xl">⚠️</span>
              <div className="flex-1">
                <p className="font-medium text-red-800 mb-2">
                  偵測到聯絡方式
                </p>
                <ul className="text-sm text-red-700 space-y-1">
                  {contactWarnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
                <p className="text-sm text-red-600 mt-2">
                  提案內容不得包含任何聯絡方式，請先移除再提交。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 提示訊息 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 提示：</strong>
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1">
            <li>• 提交提案需支付 <strong>100 代幣</strong></li>
            <li>• 若 7 日內發案者未回應，將<strong>自動退回代幣</strong></li>
            <li>• 提案提交後<strong>無法修改</strong>，請仔細檢查</li>
            <li>• 請勿在提案中包含任何聯絡方式</li>
          </ul>
        </div>

        {/* 按鈕 */}
        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || contactWarnings.length > 0}
            className="flex-1"
          >
            {isSubmitting ? '提交中...' : '確認提交 (100 代幣)'}
          </Button>
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="secondary"
              disabled={isSubmitting}
            >
              取消
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

