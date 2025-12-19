"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import ProjectDetailClient from "@/components/projects/ProjectDetailClient";
import { apiGet } from "@/lib/api";

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    // 獲取當前登入用戶
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user");
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserId(user.id);
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }

    // 獲取案件數據
    fetchProject(token);
  }, [params.id]);

  const fetchProject = async (token: string | null) => {
    try {
      setLoading(true);
      const data = await apiGet(`/api/v1/projects/${params.id}`);
      if (data.success) {
        setProject(data.data);
      } else {
        setError(data.error || "載入失敗");
      }
    } catch (err: any) {
      console.error("Failed to fetch project:", err);
      if (err.message?.includes('404') || err.message?.includes('Not Found')) {
        setError("案件不存在");
      } else {
        setError("載入案件時發生錯誤");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm("確定要發布此專案嗎？發布後將公開顯示。")) {
      return;
    }

    setIsPublishing(true);
    try {
      const { apiPost } = await import("@/lib/api");
      await apiPost(`/api/v1/projects/${params.id}/publish`, {});
      
      // 重新載入專案資料
      const token = localStorage.getItem("access_token");
      await fetchProject(token);
      
      alert("專案已成功發布！");
    } catch (err: any) {
      console.error("Failed to publish project:", err);
      alert(`發布失敗: ${err.message || "未知錯誤"}`);
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#20263e] mx-auto mb-4"></div>
            <p className="text-[#20263e]">載入中...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#20263e] mb-4">
              {error || "案件不存在"}
            </h1>
            <Button onClick={() => router.push("/projects")}>
              返回案件列表
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwner = userId && userId === project.client_id;
  const isNewDevelopment = project.project_mode === "new_development";

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
      <Navbar />

      <main className="flex-1 py-10 px-4">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* 頁首 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-[#c5ae8c] mb-2">
            <a href="/projects" className="hover:text-[#20263e]">
              案件列表
            </a>
            <span>/</span>
            <span>{project.title}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-[#20263e]">
                  {project.title}
                </h1>
                <Badge
                  variant={
                    project.status === "open"
                      ? "success"
                      : project.status === "draft"
                      ? "default"
                      : project.status === "in_progress"
                      ? "info"
                      : "danger"
                  }
                >
                  {project.status === "open"
                    ? "開放中"
                    : project.status === "draft"
                    ? "草稿"
                    : project.status === "in_progress"
                    ? "進行中"
                    : "已結案"}
                </Badge>
                <Badge variant={isNewDevelopment ? "default" : "info"}>
                  {isNewDevelopment ? "全新開發" : "修改維護"}
                </Badge>
              </div>
              <p className="text-[#c5ae8c]">
                發布於 {new Date(project.created_at).toLocaleDateString("zh-TW")}
              </p>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                {project.status === "draft" && (
                  <Button 
                    size="sm" 
                    onClick={handlePublish}
                    disabled={isPublishing}
                  >
                    {isPublishing ? "發布中..." : "發布專案"}
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  編輯
                </Button>
                <Button variant="outline" size="sm">
                  刪除
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側主要內容 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 專案概況區塊 */}
            <section>
              <h2 className="text-2xl font-bold text-[#20263e] mb-4">專案概況</h2>
              <Card className="p-8">
                <div className="space-y-8">
                  {/* 專案描述 */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#20263e] mb-3 flex items-center gap-2">
                      <span className="text-xl">📝</span> 專案描述
                    </h3>
                    <p className="text-[#20263e] leading-relaxed whitespace-pre-line text-lg">
                      {project.description}
                    </p>
                  </div>

                  <hr className="border-[#e5e7eb]" />

                  {/* 根據專案模式顯示核心資訊 */}
                  {isNewDevelopment ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {project.new_usage_scenario && (
                        <div>
                          <h4 className="font-semibold text-[#c5ae8c] mb-2 text-sm uppercase tracking-wide">使用場景</h4>
                          <p className="text-[#20263e] leading-relaxed">{project.new_usage_scenario}</p>
                        </div>
                      )}
                      {project.new_goals && (
                        <div>
                          <h4 className="font-semibold text-[#c5ae8c] mb-2 text-sm uppercase tracking-wide">專案目標</h4>
                          <p className="text-[#20263e] leading-relaxed">{project.new_goals}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {project.maint_system_name && (
                        <div>
                          <h4 className="font-semibold text-[#c5ae8c] mb-2 text-sm uppercase tracking-wide">系統名稱</h4>
                          <p className="text-[#20263e] font-medium text-lg">{project.maint_system_name}</p>
                        </div>
                      )}
                      {project.maint_system_purpose && (
                        <div>
                          <h4 className="font-semibold text-[#c5ae8c] mb-2 text-sm uppercase tracking-wide">系統用途</h4>
                          <p className="text-[#20263e] leading-relaxed">{project.maint_system_purpose}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </section>

            {/* 詳細需求區塊 */}
            <section>
              <h2 className="text-2xl font-bold text-[#20263e] mb-4">詳細需求</h2>
              <Card className="p-8">
                {isNewDevelopment ? (
                  <NewDevelopmentDetails project={project} />
                ) : (
                  <MaintenanceDetails project={project} />
                )}
              </Card>
            </section>

            {/* 技術與規格區塊 */}
            {(project.required_skills?.length > 0 || project.new_design_style?.length > 0 || project.new_integrations?.length > 0 || project.maint_known_tech_stack?.length > 0) && (
              <section>
                <h2 className="text-2xl font-bold text-[#20263e] mb-4">技術規格</h2>
                <Card className="p-8">
                  <div className="space-y-6">
                    {/* 技能需求 */}
                    {project.required_skills && project.required_skills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-[#20263e] mb-3">🛠️ 技能需求</h3>
                        <div className="flex flex-wrap gap-2">
                          {project.required_skills.map((skill: string) => (
                            <Badge key={skill} variant="info" className="text-sm py-1 px-3">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 設計風格 (全新開發) */}
                    {project.new_design_style && project.new_design_style.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-[#20263e] mb-3">🎨 設計風格</h3>
                        <div className="flex flex-wrap gap-2">
                          {project.new_design_style.map((style: string) => (
                            <Badge key={style} variant="info" className="text-sm py-1 px-3">
                              {style}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 整合需求 (全新開發) */}
                    {project.new_integrations && project.new_integrations.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-[#20263e] mb-3">🔌 外部整合</h3>
                        <div className="flex flex-wrap gap-2">
                          {project.new_integrations.map((integration: string) => (
                            <Badge key={integration} variant="info" className="text-sm py-1 px-3">
                              {integration}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 已知技術棧 (修改維護) */}
                    {project.maint_known_tech_stack && project.maint_known_tech_stack.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-[#20263e] mb-3">🏗️ 現有技術棧</h3>
                        <div className="flex flex-wrap gap-2">
                          {project.maint_known_tech_stack.map((tech: string) => (
                            <Badge key={tech} variant="info" className="text-sm py-1 px-3">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </section>
            )}

            {/* 補充與參考資料 */}
            {(project.reference_links?.length > 0 || project.new_special_requirements || project.new_concerns?.length > 0) && (
              <section>
                <h2 className="text-2xl font-bold text-[#20263e] mb-4">補充資訊</h2>
                <Card className="p-8 bg-[#fafafa]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 參考資料 */}
                    {project.reference_links && project.reference_links.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-[#20263e] mb-3">🔗 參考資料</h3>
                        <ul className="space-y-2">
                          {project.reference_links.map((link: string, index: number) => (
                            <li key={index}>
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                              >
                                {link}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 特殊需求 */}
                    {project.new_special_requirements && (
                      <div>
                        <h3 className="text-lg font-semibold text-[#20263e] mb-3">⚠️ 特殊需求</h3>
                        <p className="text-[#20263e] leading-relaxed whitespace-pre-line">
                          {project.new_special_requirements}
                        </p>
                      </div>
                    )}

                    {/* 擔憂事項 */}
                    {project.new_concerns && project.new_concerns.length > 0 && (
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-[#20263e] mb-3">😟 擔憂與顧慮</h3>
                        <ul className="list-disc list-inside space-y-1 text-[#20263e]">
                          {project.new_concerns.map((concern: string, index: number) => (
                            <li key={index}>{concern}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              </section>
            )}

            {/* 投標列表（僅發案者可見） */}
            {isOwner && project.bids && project.bids.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-[#20263e] mb-4">
                  投標列表 <span className="text-lg font-normal text-[#c5ae8c]">({project.bids.length})</span>
                </h2>
                <div className="space-y-4">
                  {project.bids.map((bid: any) => (
                    <Card key={bid.id} className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-[#c5ae8c] rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {bid.freelancer.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-lg text-[#20263e]">
                              {bid.freelancer.name}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-[#c5ae8c]">
                              <span>⭐ {bid.freelancer.rating || "尚無評分"}</span>
                              {bid.freelancer.skills && (
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                  {bid.freelancer.skills.slice(0, 3).join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#20263e]">
                              NT$ {bid.bid_amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-[#c5ae8c]">報價金額</p>
                          </div>
                          <Badge
                            variant={
                              bid.status === "pending"
                                ? "info"
                                : bid.status === "accepted"
                                ? "success"
                                : "danger"
                            }
                          >
                            {bid.status === "pending"
                              ? "待審核"
                              : bid.status === "accepted"
                              ? "已接受"
                              : "已拒絕"}
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-[#f9f9f9] p-4 rounded-lg">
                        <p className="text-[#20263e] leading-relaxed whitespace-pre-line">{bid.proposal}</p>
                      </div>
                      {bid.status === "pending" && (
                        <div className="flex justify-end gap-3 mt-4">
                          <Button size="sm" variant="outline">
                            拒絕
                          </Button>
                          <Button size="sm">接受提案</Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* 右側邊欄 */}
          <div className="space-y-6">
            {/* 主要行動卡片 */}
            <Card className="p-6 border-t-4 border-t-[#20263e] shadow-lg">
              <div className="mb-6">
                <p className="text-sm text-[#c5ae8c] mb-1 font-medium uppercase tracking-wide">專案預算</p>
                <p className="text-3xl font-bold text-[#20263e]">
                  NT$ {project.budget_min.toLocaleString()} - {project.budget_max.toLocaleString()}
                </p>
                {project.budget_estimate_only && (
                  <p className="text-sm text-[#c5ae8c] mt-1 flex items-center gap-1">
                    ℹ️ 預算僅供參考
                  </p>
                )}
              </div>

              <div className="space-y-4 mb-6 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-[#c5ae8c]">付款方式</span>
                  <span className="font-medium text-[#20263e]">
                    {project.payment_method === "installment"
                      ? "分期付款"
                      : project.payment_method === "milestone"
                      ? "里程碑付款"
                      : project.payment_method === "full_after"
                      ? "完成後付款"
                      : "待協商"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#c5ae8c]">期望開始</span>
                  <span className="font-medium text-[#20263e]">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString("zh-TW") : "可議"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#c5ae8c]">期望完成</span>
                  <span className="font-medium text-[#20263e]">
                    {project.deadline ? new Date(project.deadline).toLocaleDateString("zh-TW") : "可議"}
                  </span>
                </div>
              </div>

              {isOwner ? (
                <div className="bg-[#f0f9ff] p-4 rounded-lg text-center">
                  <p className="text-blue-800 font-medium">這是您發布的案件</p>
                  <p className="text-sm text-blue-600 mt-1">目前有 {project._count?.bids || 0} 個投標</p>
                </div>
              ) : (
                <ProjectDetailClient 
                  projectId={project.id} 
                  projectTitle={project.title}
                  isOwner={false} 
                  userId={userId || undefined} 
                />
              )}
            </Card>

            {/* 發案者資訊 */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-[#20263e] mb-4">關於發案者</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-[#20263e] rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {project.client.name[0]}
                </div>
                <div>
                  <p className="font-bold text-lg text-[#20263e]">
                    {project.client.name}
                  </p>
                  <div className="flex items-center gap-1 text-[#fbbf24]">
                    {"★".repeat(Math.round(project.client.rating || 0))}
                    <span className="text-[#c5ae8c] text-sm ml-1">
                      ({project.client.rating || "尚無評分"})
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-[#20263e]">
                  <span className="w-6 text-center">📧</span>
                  <span>Email 已驗證</span>
                </div>
                <div className="flex items-center gap-2 text-[#20263e]">
                  <span className="w-6 text-center">📱</span>
                  <span>電話已驗證</span>
                </div>
              </div>

              {!isOwner && (
                <Button variant="outline" className="w-full mt-6">
                  發送訊息
                </Button>
              )}
            </Card>
          </div>
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// 全新開發專案詳細內容
function NewDevelopmentDetails({ project }: { project: any }) {
  return (
    <div className="space-y-8">
      {/* 功能需求列表 */}
      {project.new_features && project.new_features.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[#20263e] mb-4 border-l-4 border-[#20263e] pl-3">
            功能需求
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.new_features.map((feature: string, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-[#f9f9f9] rounded-lg">
                <span className="text-[#20263e] mt-1">✅</span>
                <span className="text-[#20263e]">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 交付項目 */}
      {project.new_outputs && project.new_outputs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[#20263e] mb-4 border-l-4 border-[#20263e] pl-3">
            預期交付項目
          </h3>
          <div className="flex flex-wrap gap-3">
            {project.new_outputs.map((output: string, index: number) => (
              <span key={index} className="px-4 py-2 bg-[#fff] border border-[#e5e7eb] rounded-full text-[#20263e] shadow-sm">
                📦 {output}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 交付物清單 (檔案/文件) */}
      {project.new_deliverables && project.new_deliverables.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[#20263e] mb-4 border-l-4 border-[#20263e] pl-3">
            需交付文件/檔案
          </h3>
          <ul className="list-disc list-inside space-y-1 text-[#20263e] ml-2">
            {project.new_deliverables.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// 修改維護專案詳細內容
function MaintenanceDetails({ project }: { project: any }) {
  return (
    <div className="space-y-8">
      {/* 系統現況與問題 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {project.maint_current_problems && (
          <div>
            <h3 className="text-lg font-semibold text-[#20263e] mb-4 border-l-4 border-red-400 pl-3">
              目前遇到的問題
            </h3>
            <p className="text-[#20263e] leading-relaxed whitespace-pre-line bg-red-50 p-4 rounded-lg">
              {project.maint_current_problems}
            </p>
          </div>
        )}

        {project.maint_desired_improvements && (
          <div>
            <h3 className="text-lg font-semibold text-[#20263e] mb-4 border-l-4 border-green-400 pl-3">
              期望改善目標
            </h3>
            <p className="text-[#20263e] leading-relaxed whitespace-pre-line bg-green-50 p-4 rounded-lg">
              {project.maint_desired_improvements}
            </p>
          </div>
        )}
      </div>

      {/* 新增功能 */}
      {project.maint_new_features && (
        <div>
          <h3 className="text-lg font-semibold text-[#20263e] mb-4 border-l-4 border-[#20263e] pl-3">
            希望新增的功能
          </h3>
          <p className="text-[#20263e] leading-relaxed whitespace-pre-line">
            {project.maint_new_features}
          </p>
        </div>
      )}

      {/* 系統環境資訊 */}
      <div>
        <h3 className="text-lg font-semibold text-[#20263e] mb-4 border-l-4 border-[#20263e] pl-3">
          系統環境與資源
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[#f9f9f9] rounded-lg text-center">
            <p className="text-sm text-[#c5ae8c] mb-1">使用人數</p>
            <p className="font-semibold text-[#20263e]">{project.maint_current_users_count || "未知"} 人</p>
          </div>
          <div className="p-4 bg-[#f9f9f9] rounded-lg text-center">
            <p className="text-sm text-[#c5ae8c] mb-1">原始碼</p>
            <p className="font-semibold text-[#20263e]">{project.maint_has_source_code ? "有保留" : "無保留"}</p>
          </div>
          <div className="p-4 bg-[#f9f9f9] rounded-lg text-center">
            <p className="text-sm text-[#c5ae8c] mb-1">文件說明</p>
            <p className="font-semibold text-[#20263e]">{project.maint_has_documentation ? "有文件" : "無文件"}</p>
          </div>
          <div className="p-4 bg-[#f9f9f9] rounded-lg text-center">
            <p className="text-sm text-[#c5ae8c] mb-1">系統存取</p>
            <p className="font-semibold text-[#20263e]">{project.maint_can_provide_access ? "可提供" : "不可提供"}</p>
          </div>
        </div>
      </div>

      {/* 預期成果與驗收 */}
      {(project.maint_expected_outcomes || project.maint_success_criteria) && (
        <div className="bg-[#f0f9ff] p-6 rounded-lg border border-blue-100">
          <h3 className="text-lg font-semibold text-[#20263e] mb-4">
            🎯 預期成果與驗收標準
          </h3>
          <div className="space-y-4">
            {project.maint_expected_outcomes && (
              <div>
                <h4 className="font-medium text-blue-900 mb-1">預期成果</h4>
                <p className="text-blue-800">{project.maint_expected_outcomes}</p>
              </div>
            )}
            {project.maint_success_criteria && (
              <div>
                <h4 className="font-medium text-blue-900 mb-1">成功標準</h4>
                <p className="text-blue-800">{project.maint_success_criteria}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
