'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiGet, apiPost, isAuthenticated } from '@/lib/api';

interface Project {
  id: string;
  title: string;
  budget_min: number;
  budget_max: number;
  deadline?: string;
  project_type?: string;
  project_mode: string;
  status: string;
}

export default function SubmitProposalPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [proposalContent, setProposalContent] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [estimatedMonths, setEstimatedMonths] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    fetchProjectInfo();
  }, [projectId]);

  const fetchProjectInfo = async () => {
    try {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      const data = await apiGet(`/api/v1/projects/${projectId}`);

      if (!data.success) {
        throw new Error(data.error || '無法載入案件資訊');
      }

      if (data.data) {
        setProject(data.data);
      } else {
        throw new Error('無法取得案件資訊');
      }
    } catch (error: any) {
      console.error('Fetch project error:', error);
      setError(error.message || '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const detectContactInfo = (text: string): boolean => {
    const patterns = [
      /\b\d{10}\b/, // 電話號碼
      /\b\d{4}[-.\s]?\d{3}[-.\s]?\d{3}\b/, // 手機格式
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /line\s*[:：]\s*[@]?[a-zA-Z0-9_-]+/i, // LINE ID (line: @id 或 line: id)
      /@line\s*[:：]?\s*[a-zA-Z0-9_-]+/i, // LINE ID (@line: id)
      /line\s+id\s*[:：]\s*[@]?[a-zA-Z0-9_-]+/i, // LINE ID (line id: @id)
      /wechat\s*[:：]\s*[@]?[a-zA-Z0-9_-]+/i, // WeChat ID
      /微信\s*[:：]\s*[@]?[a-zA-Z0-9_-]+/i, // 微信 ID
      /telegram\s*[:：]\s*[@]?[a-zA-Z0-9_-]+/i, // Telegram ID
      /whatsapp\s*[:：]\s*[+]?\d{8,}/i, // WhatsApp (通常包含電話號碼)
      /facebook\s*[:：]\s*[a-zA-Z0-9._-]+/i, // Facebook
      /fb\s*[:：]\s*[a-zA-Z0-9._-]+/i, // FB
      /instagram\s*[:：]\s*[@]?[a-zA-Z0-9._-]+/i, // Instagram
      /ig\s*[:：]\s*[@]?[a-zA-Z0-9._-]+/i, // IG
      /skype\s*[:：]\s*[a-zA-Z0-9._-]+/i, // Skype
    ];

    return patterns.some(pattern => pattern.test(text));
  };

  const handleSubmit = async () => {
    // 驗證
    if (!proposalContent.trim()) {
      setError('請輸入提案內容');
      return;
    }

    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      setError('請輸入有效的報價金額');
      return;
    }

    const months = estimatedMonths ? parseInt(estimatedMonths) : 0;
    const days = estimatedDays ? parseInt(estimatedDays) : 0;
    
    if (months < 0 || days < 0) {
      setError('月份和天數不能為負數');
      return;
    }
    
    if (months === 0 && days === 0) {
      setError('請輸入預估工時（月份或天數）');
      return;
    }

    // 檢查聯絡資訊
    if (detectContactInfo(proposalContent)) {
      setError('⚠️ 提案內容不得包含任何聯絡資訊（電話、Email、LINE、社群帳號等）');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      // 格式化工時
      const months = estimatedMonths ? parseInt(estimatedMonths) : 0;
      const days = estimatedDays ? parseInt(estimatedDays) : 0;
      
      let estimatedTimeParts: string[] = [];
      if (months > 0) {
        estimatedTimeParts.push(`**${months} 個月**`);
      }
      if (days > 0) {
        estimatedTimeParts.push(`**${days} 天**`);
      }
      const estimatedTimeText = estimatedTimeParts.join(' + ');

      // 將報價和工時資訊加入到訊息內容的最開頭（並排顯示）
      const fullMessage = `## 💰 報價資訊

| 項目 | 內容 |
|------|------|
| **報價金額** | **NT$ ${parseFloat(budgetAmount).toLocaleString()}** |
| **預估工時** | ${estimatedTimeText} |

---

${proposalContent}`;

      // 提交提案並支付代幣
      const data = await apiPost('/api/v1/conversations', {
        type: 'project_proposal',
        project_id: projectId,
        initial_message: fullMessage,
        bid_data: {
          amount: parseFloat(budgetAmount),
          estimated_days: months * 30 + days, // 轉換為總天數供後端使用
          proposal: proposalContent, // 保留原始提案內容
        },
      });

      if (data.success && data.data?.conversation_id) {
        const conversationId = data.data.conversation_id;
        // 導向對話頁面
        router.push(`/conversations/${conversationId}`);
      } else {
        throw new Error('提交成功但無法取得對話 ID');
      }
    } catch (error: any) {
      console.error('Submit proposal error:', error);
      setError(error.message || '提交失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#e6dfcf]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#20263e]"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col bg-[#e6dfcf]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-24">
          <Card className="p-8 max-w-md border-2 border-[#c5ae8c] shadow-md">
            <h2 className="text-xl font-bold text-[#20263e] mb-4">無法載入案件資訊</h2>
            <Button onClick={() => router.back()}>返回</Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#e6dfcf]">
      <Navbar />

      <main className="flex-1 pt-24 pb-10 px-4">
        <div className="max-w-7xl mx-auto">
          {/* 案件資訊卡片 - 緊湊顯示 */}
          <Card className="p-4 mb-6 bg-white border-2 border-[#c5ae8c] border-l-8 shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-[#20263e]">{project.title}</h2>
                  <Badge variant={project.status === 'open' ? 'success' : 'default'}>
                    {project.status === 'open' ? '開放中' : project.status}
                  </Badge>
                  <Badge variant={project.project_mode === 'new_development' ? 'default' : 'info'}>
                    {project.project_mode === 'new_development' ? '全新開發' : '修改維護'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-[#20263e]/70">
                  <span>💰 預算：NT$ {project.budget_min?.toLocaleString()} - {project.budget_max?.toLocaleString()}</span>
                  {project.deadline && (
                    <span>📅 截止：{new Date(project.deadline).toLocaleDateString('zh-TW')}</span>
                  )}
                  {project.project_type && (
                    <span>🏷️ 類型：{project.project_type}</span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[#c5ae8c] text-[#20263e] hover:bg-[#e6dfcf]"
                onClick={() => router.push(`/projects/${projectId}`)}
              >
                查看完整資訊
              </Button>
            </div>
          </Card>

          {/* 提案編輯區域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左側：編輯器 */}
            <div>
              <Card className="p-6 border-2 border-[#c5ae8c] shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-[#20263e] mb-2">提交提案</h3>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ 重要提醒：</strong>
                    </p>
                    <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                      <li>• 提案內容支援 Markdown 格式</li>
                      <li>• <strong>請勿在提案中包含任何聯絡資訊</strong>（電話、Email、LINE、社群帳號等）</li>
                      <li>• 提交提案需支付 <strong>100 代幣</strong>，若 7 日內對方未回應將全額退款</li>
                      <li>• 提案送出後，需等待對方查看並支付 100 代幣後才能開始對話</li>
                    </ul>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                    {error}
                  </div>
                )}

                {/* 報價資訊 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* 報價金額 */}
                  <div>
                    <label className="block text-sm font-semibold text-[#20263e] mb-2">
                      報價金額 (NT$) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      placeholder="請輸入您的報價"
                      className="w-full px-4 py-3 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] transition bg-[#e6dfcf]/30 text-[#20263e] text-base font-semibold"
                      min="0"
                      step="1000"
                    />
                  </div>

                  {/* 預估工時 */}
                  <div>
                    <label className="block text-sm font-semibold text-[#20263e] mb-2">
                      預估工時 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={estimatedMonths}
                          onChange={(e) => setEstimatedMonths(e.target.value)}
                          placeholder="0"
                          className="w-20 px-3 py-3 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] transition bg-[#e6dfcf]/30 text-[#20263e] text-base text-center font-semibold"
                          min="0"
                        />
                        <span className="text-base font-medium text-[#20263e] whitespace-nowrap">
                          個月
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={estimatedDays}
                          onChange={(e) => setEstimatedDays(e.target.value)}
                          placeholder="0"
                          className="w-20 px-3 py-3 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] transition bg-[#e6dfcf]/30 text-[#20263e] text-base text-center font-semibold"
                          min="0"
                        />
                        <span className="text-base font-medium text-[#20263e] whitespace-nowrap">
                          天
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[#c5ae8c] mt-2">至少填寫其中一項</p>
                  </div>
                </div>

                {/* 提案內容 */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#20263e] mb-2">
                    提案內容 <span className="text-red-500">*</span>
                    <span className="text-[#c5ae8c] font-normal ml-2">(支援 Markdown)</span>
                  </label>
                  <textarea
                    value={proposalContent}
                    onChange={(e) => setProposalContent(e.target.value)}
                    placeholder="請詳細說明您的提案內容，包括：&#10;• 您對案件的理解&#10;• 技術方案與實作計畫&#10;• 相關經驗與作品集&#10;• 為何您是最佳人選&#10;&#10;支援 Markdown 語法：**粗體**、*斜體*、[連結](url)、清單等"
                    className="w-full px-4 py-3 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] transition bg-[#e6dfcf]/30 text-[#20263e] font-mono text-sm"
                    rows={20}
                  />
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => router.back()}
                    variant="outline"
                    disabled={submitting}
                    className="flex-1 border-[#c5ae8c] text-[#20263e] hover:bg-[#e6dfcf]"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !proposalContent.trim() || !budgetAmount || (!estimatedMonths && !estimatedDays)}
                    className="flex-1 bg-[#20263e] hover:bg-[#2d3550] text-white font-semibold"
                  >
                    {submitting ? '提交中...' : '支付 100 代幣並提交提案'}
                  </Button>
                </div>
              </Card>
            </div>

            {/* 右側：預覽 */}
            <div>
              <Card className="p-6 sticky top-24 border-2 border-[#c5ae8c] shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#20263e]">聊天室預覽</h3>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm text-[#c5ae8c] hover:text-[#20263e]"
                  >
                    {showPreview ? '隱藏' : '顯示'}
                  </button>
                </div>

                {showPreview && (
                  <div className="bg-[#e6dfcf]/30 rounded-xl p-4 max-h-[calc(100vh-300px)] overflow-y-auto border-2 border-[#c5ae8c]/30">
                    {proposalContent.trim() ? (
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-[#c5ae8c] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">我</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="bg-[#f5f3ed] rounded-2xl rounded-tl-none px-4 py-3 max-w-full border border-gray-200 break-words overflow-wrap-anywhere">
                              <div className="prose prose-sm max-w-none text-[#20263e] break-words
                                [&>*]:text-[#20263e] [&>*]:break-words
                                [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-3 [&_h1]:text-[#20263e] [&_h1]:break-words
                                [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-[#20263e] [&_h2]:break-words
                                [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-2 [&_h3]:text-[#20263e] [&_h3]:break-words
                                [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-2 [&_h4]:mb-2 [&_h4]:text-[#20263e] [&_h4]:break-words
                                [&_p]:text-sm [&_p]:leading-loose [&_p]:mb-3 [&_p]:text-[#20263e] [&_p]:break-words
                                [&_ul]:text-sm [&_ul]:my-3 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:break-words
                                [&_ol]:text-sm [&_ol]:my-3 [&_ol]:pl-5 [&_ol]:list-decimal [&_ol]:break-words
                                [&_li]:text-sm [&_li]:mb-2 [&_li]:text-[#20263e] [&_li]:break-words
                                [&_strong]:font-semibold [&_strong]:text-[#20263e] [&_strong]:break-words
                                [&_em]:italic [&_em]:text-[#20263e] [&_em]:break-words
                                [&_a]:text-[#c5ae8c] [&_a]:underline [&_a]:hover:text-[#a08a6f] [&_a]:break-all
                                [&_code]:text-xs [&_code]:bg-gray-200 [&_code]:text-[#20263e] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:break-all
                                [&_pre]:bg-gray-200 [&_pre]:text-[#20263e] [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-3 [&_pre]:border [&_pre]:border-gray-300 [&_pre]:break-words
                                [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-xs [&_pre_code]:break-all [&_pre_code]:whitespace-pre-wrap
                                [&_blockquote]:border-l-4 [&_blockquote]:border-[#c5ae8c] [&_blockquote]:pl-3 [&_blockquote]:my-3 [&_blockquote]:text-[#20263e] [&_blockquote]:italic [&_blockquote]:break-words
                                [&_table]:w-full [&_table]:my-3 [&_table]:border-collapse [&_table]:border [&_table]:border-gray-300 [&_table]:table-auto
                                [&_th]:bg-gray-200 [&_th]:text-[#20263e] [&_th]:font-semibold [&_th]:text-sm [&_th]:px-3 [&_th]:py-2 [&_th]:border [&_th]:border-gray-300 [&_th]:text-left [&_th]:break-words
                                [&_td]:text-sm [&_td]:text-[#20263e] [&_td]:px-3 [&_td]:py-2 [&_td]:border [&_td]:border-gray-300 [&_td]:break-words
                                [&_hr]:my-4 [&_hr]:border-gray-300">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {(() => {
                                    // 構建完整的預覽內容，包含報價和工時
                                    const months = estimatedMonths ? parseInt(estimatedMonths) : 0;
                                    const days = estimatedDays ? parseInt(estimatedDays) : 0;
                                    
                                    let estimatedTimeParts: string[] = [];
                                    if (months > 0) {
                                      estimatedTimeParts.push(`**${months} 個月**`);
                                    }
                                    if (days > 0) {
                                      estimatedTimeParts.push(`**${days} 天**`);
                                    }
                                    const estimatedTimeText = estimatedTimeParts.join(' + ');

                                    if (budgetAmount && estimatedTimeText) {
                                      return `## 💰 報價資訊

| 項目 | 內容 |
|------|------|
| **報價金額** | **NT$ ${parseFloat(budgetAmount).toLocaleString()}** |
| **預估工時** | ${estimatedTimeText} |

---

${proposalContent}`;
                                    }
                                    return proposalContent;
                                  })()}
                                </ReactMarkdown>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">剛剛</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-12">
                        <p className="mb-2">📝</p>
                        <p>在左側輸入提案內容</p>
                        <p className="text-sm">這裡會即時預覽訊息樣式</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Markdown 提示 */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                  <p className="font-medium text-blue-900 mb-2">💡 Markdown 語法提示</p>
                  <div className="text-blue-800 space-y-1">
                    <p><code className="bg-blue-100 px-1 rounded">**粗體**</code> → <strong>粗體</strong></p>
                    <p><code className="bg-blue-100 px-1 rounded">*斜體*</code> → <em>斜體</em></p>
                    <p><code className="bg-blue-100 px-1 rounded">- 項目</code> → 項目清單</p>
                    <p><code className="bg-blue-100 px-1 rounded">[文字](網址)</code> → 連結</p>
                    <p><code className="bg-blue-100 px-1 rounded">```程式碼```</code> → 程式碼區塊</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

