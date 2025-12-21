"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import ProjectDetailClient from "@/components/projects/ProjectDetailClient";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

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
  const [sidebarPadding, setSidebarPadding] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedProject, setEditedProject] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const budgetDividerRef = useRef<HTMLHRElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const clientDividerRef = useRef<HTMLHRElement>(null);

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

  // 計算並對齊分隔線
  useEffect(() => {
    if (!project || !budgetDividerRef.current || !clientDividerRef.current || !leftColumnRef.current || !rightColumnRef.current) {
      return;
    }

    const calculateAlignment = () => {
      const budgetDivider = budgetDividerRef.current;
      const clientDivider = clientDividerRef.current;
      const leftColumn = leftColumnRef.current;
      const rightColumn = rightColumnRef.current;

      if (!budgetDivider || !clientDivider || !leftColumn || !rightColumn) return;

      // 獲取分隔線相對於各自容器的位置
      const leftRect = leftColumn.getBoundingClientRect();
      const rightRect = rightColumn.getBoundingClientRect();
      const budgetRect = budgetDivider.getBoundingClientRect();
      const clientRect = clientDivider.getBoundingClientRect();

      // 計算分隔線相對於容器頂部的距離
      const budgetOffsetFromTop = budgetRect.top - leftRect.top;
      const clientOffsetFromTop = clientRect.top - rightRect.top;

      // 計算需要的底部填充
      // 如果左側的分隔線位置更低，右側需要更多填充
      const difference = budgetOffsetFromTop - clientOffsetFromTop;
      
      // 設定最小底部空間為 8rem (128px)
      const minPadding = 128;
      const calculatedPadding = Math.max(minPadding, difference > 0 ? difference : minPadding);
      
      setSidebarPadding(calculatedPadding);
    };

    // 延遲計算確保 DOM 完全渲染
    const timer = setTimeout(calculateAlignment, 300);

    // 監聽視窗大小變化
    window.addEventListener('resize', calculateAlignment);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateAlignment);
    };
  }, [project]);

  const fetchProject = async (token: string | null) => {
    try {
      setLoading(true);
      const data = await apiGet(`/api/v1/projects/${params.id}`);
      if (data.success) {
        setProject(data.data);
        setEditedProject(data.data);
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

  const handleDelete = async () => {
    if (!confirm('確定要刪除此案件嗎？此操作無法復原。')) {
      return;
    }
    
    try {
      const data = await apiDelete(`/api/v1/projects/${params.id}`);
      if (data.success) {
        alert('案件已刪除');
        router.push('/projects/me');
      } else {
        alert(data.error || '刪除失敗');
      }
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert(err.message || '刪除失敗');
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setEditedProject({ ...project });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedProject({ ...project });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = await apiPut(`/api/v1/projects/${params.id}`, editedProject);
      if (data.success) {
        setProject(editedProject);
        setIsEditMode(false);
        alert('儲存成功');
      } else {
        alert(data.error || '儲存失敗');
      }
    } catch (err: any) {
      console.error('Save failed:', err);
      alert(err.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditedProject((prev: any) => ({
      ...prev,
      [field]: value
    }));
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
  
  // 顯示用的專案資料（編輯模式使用 editedProject，否則使用 project）
  const displayProject = isEditMode ? editedProject : project;

  // 可編輯欄位組件
  const EditableField = ({ label, value, field, multiline = false, type = "text" }: any) => {
    if (!isEditMode) {
      return (
        <p className="text-[#20263e] leading-relaxed whitespace-pre-line text-lg">
          {value || '未填寫'}
        </p>
      );
    }

    if (multiline) {
      return (
        <textarea
          value={value || ''}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          className="w-full p-3 border-2 border-[#c5ae8c] rounded-lg text-[#20263e] focus:outline-none focus:border-[#20263e] min-h-[120px]"
          placeholder={label}
        />
      );
    }

    if (type === "number") {
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => handleFieldChange(field, parseFloat(e.target.value) || 0)}
          className="w-full p-3 border-2 border-[#c5ae8c] rounded-lg text-[#20263e] focus:outline-none focus:border-[#20263e]"
          placeholder={label}
        />
      );
    }

    return (
      <input
        type={type}
        value={value || ''}
        onChange={(e) => handleFieldChange(field, e.target.value)}
        className="w-full p-3 border-2 border-[#c5ae8c] rounded-lg text-[#20263e] focus:outline-none focus:border-[#20263e]"
        placeholder={label}
      />
    );
  };

  // 映射英文值到中文标签（用于需交付文件和擔憂與顧慮）
  const DELIVERABLE_MAP: Record<string, string> = {
    "source_code": "原始碼",
    "admin_credentials": "後台帳密",
    "tutorial_video": "教學影片",
    "documentation": "使用文件",
    "maintenance": "維護服務",
    "deployment": "上線代辦",
    "training": "操作培訓",
  };

  const CONCERN_MAP: Record<string, string> = {
    "security": "擔心資料安全",
    "complexity": "怕操作太難",
    "scalability": "想之後能持續擴充功能",
    "nda": "需要簽署保密協議（NDA）",
    "copyright": "版權歸屬需求",
    "modification_limit": "修改次數限制",
    "warranty": "保固服務",
  };

  // 將英文值轉換為中文（如果數據庫中是英文值）
  const translateDeliverable = (value: string): string => {
    // 如果已經是中文（不在映射表中），直接返回
    if (!DELIVERABLE_MAP[value]) {
      return value;
    }
    return DELIVERABLE_MAP[value];
  };

  const translateConcern = (value: string): string => {
    // 如果已經是中文（不在映射表中），直接返回
    if (!CONCERN_MAP[value]) {
      return value;
    }
    return CONCERN_MAP[value];
  };

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
                      ? "khaki"
                      : "danger"
                  }
                >
                  {project.status === "open"
                    ? "開放中"
                    : project.status === "in_progress"
                    ? "進行中"
                    : "已結案"}
                </Badge>
                <Badge variant={isNewDevelopment ? "khaki" : "khaki"}>
                  {isNewDevelopment ? "全新開發" : "修改維護"}
                </Badge>
              </div>
              <p className="text-[#c5ae8c]">
                發布於 {new Date(project.created_at).toLocaleDateString("zh-TW")}
              </p>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                {isEditMode ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      取消
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {saving ? '儲存中...' : '儲存'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleEdit}
                    >
                      編輯
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDelete}
                      className="text-red-600 hover:bg-red-50 border-red-300"
                    >
                      刪除
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側主要內容 */}
          <div ref={leftColumnRef} className="lg:col-span-2 space-y-8">
            {/* 合併所有內容到一個 Card */}
            <section>
              <Card className="p-8 bg-transparent shadow-none border-0">
                <div className="space-y-8">
                  {/* 專案概況區塊 */}
                  <div>
                    <div className="space-y-6">
                      {/* 專案描述 */}
                      <div>
                        <h3 className="text-xl font-bold text-[#20263e] mb-4">專案描述</h3>
                        <EditableField 
                          label="專案描述"
                          value={displayProject.description}
                          field="description"
                          multiline
                        />
                  </div>

                  {/* 根據專案模式顯示核心資訊 */}
                  {isNewDevelopment ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {(displayProject.new_usage_scenario || isEditMode) && (
                        <div>
                          <h4 className="font-semibold text-[#c5ae8c] mb-2 text-sm uppercase tracking-wide">使用場景</h4>
                          <EditableField 
                            label="使用場景"
                            value={displayProject.new_usage_scenario}
                            field="new_usage_scenario"
                            multiline
                          />
                        </div>
                      )}
                      {(displayProject.new_goals || isEditMode) && (
                        <div>
                          <h4 className="font-semibold text-[#c5ae8c] mb-2 text-sm uppercase tracking-wide">專案目標</h4>
                          <EditableField 
                            label="專案目標"
                            value={displayProject.new_goals}
                            field="new_goals"
                            multiline
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {(displayProject.maint_system_name || isEditMode) && (
                        <div>
                          <h4 className="font-semibold text-[#c5ae8c] mb-2 text-sm uppercase tracking-wide">系統名稱</h4>
                          <EditableField 
                            label="系統名稱"
                            value={displayProject.maint_system_name}
                            field="maint_system_name"
                          />
                        </div>
                      )}
                      {(displayProject.maint_system_purpose || isEditMode) && (
                        <div>
                          <h4 className="font-semibold text-[#c5ae8c] mb-2 text-sm uppercase tracking-wide">系統用途</h4>
                          <EditableField 
                            label="系統用途"
                            value={displayProject.maint_system_purpose}
                            field="maint_system_purpose"
                            multiline
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                  </div>

                  {/* 灰色分隔線 */}
                  <hr className="border-[#e5e7eb]" />

            {/* 詳細需求區塊 */}
                  <div>
                {isNewDevelopment ? (
                  <NewDevelopmentDetails project={project} />
                ) : (
                  <MaintenanceDetails project={project} />
                    )}
                  </div>


            {/* 補充與參考資料 */}
            {(project.reference_links?.length > 0 || project.new_special_requirements || project.new_concerns?.length > 0) && (
                    <>
                      {/* 灰色分隔線 */}
                      <hr className="border-[#e5e7eb]" />
                      
                      <div>
                        <h3 className="text-xl font-bold text-[#20263e] mb-4">其他資訊</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 參考資料 */}
                    {project.reference_links && project.reference_links.length > 0 && (
                            <div className="md:col-span-2">
                              <h4 className="text-lg font-semibold text-[#20263e] mb-3 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#20263e]">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.08 0 0 1 1.24 6.157M14.85 8.11a6 5.447 0 0 1 1.654 8.21M13.19 8.688a4.5 4.08 0 0 0-5.926-1.811M14.85 8.11a6 5.447 0 0 0-7.899-2.415M4.742 16.11a1.5 1.5 0 0 1 2.122 0l1.06 1.061a1.5 1.5 0 0 1 0 2.122 1.501 1.501 0 0 1-2.122 0l-1.06-1.06a1.5 1.5 0 0 1 0-2.122ZM17.654 4.742a1.5 1.5 0 0 1 0 2.122l-1.061 1.06a1.5 1.5 0 0 1-2.122 0 1.5 1.5 0 0 1 0-2.122l1.06-1.061a1.5 1.5 0 0 1 2.122 0Z" />
                                </svg>
                                參考資料
                              </h4>
                        <ul className="space-y-2">
                                {project.reference_links.map((link: string, index: number) => {
                                  // 从 URL 提取域名作为显示文字
                                  const getLinkText = (url: string): string => {
                                    try {
                                      const urlObj = new URL(url);
                                      return urlObj.hostname.replace('www.', '');
                                    } catch {
                                      // 如果不是有效 URL，返回原字符串
                                      return url;
                                    }
                                  };

                                  const linkText = getLinkText(link);
                                  
                                  return (
                            <li key={index}>
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                        className="text-[#20263e] hover:text-[#c5ae8c] hover:underline"
                              >
                                        {linkText}
                              </a>
                            </li>
                                  );
                                })}
                        </ul>
                      </div>
                    )}

                    {/* 特殊需求 */}
                    {project.new_special_requirements && (
                      <div>
                              <h4 className="text-lg font-semibold text-[#20263e] mb-3 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#20263e]">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                                特殊需求
                              </h4>
                        <p className="text-[#20263e] leading-relaxed whitespace-pre-line">
                          {project.new_special_requirements}
                        </p>
                      </div>
                    )}

                    {/* 擔憂事項 */}
                    {project.new_concerns && project.new_concerns.length > 0 && (
                      <div className="md:col-span-2">
                              <h4 className="text-lg font-semibold text-[#20263e] mb-3 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#20263e]">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 10.5h.01m5.99 0h.01" />
                                </svg>
                                擔憂與顧慮
                              </h4>
                        <ul className="list-disc list-inside space-y-1 text-[#20263e]">
                          {project.new_concerns.map((concern: string, index: number) => (
                            <li key={index}>{translateConcern(concern)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* 專案預算與付款資訊 */}
                  <hr ref={budgetDividerRef} className="border-[#20263e] border" />
                  
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <p className="text-3xl text-[#20263e] font-bold uppercase tracking-wide" style={{ fontFamily: "'Noto Serif TC', serif" }}>專案預算</p>
                        {isEditMode ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xl">NT$</span>
                            <input
                              type="number"
                              value={displayProject.budget_min}
                              onChange={(e) => handleFieldChange('budget_min', parseFloat(e.target.value))}
                              className="w-32 p-2 border-2 border-[#c5ae8c] rounded text-center"
                            />
                            <span>-</span>
                            <input
                              type="number"
                              value={displayProject.budget_max}
                              onChange={(e) => handleFieldChange('budget_max', parseFloat(e.target.value))}
                              className="w-32 p-2 border-2 border-[#c5ae8c] rounded text-center"
                            />
                          </div>
                        ) : (
                          <p className="text-3xl font-bold text-[#20263e]" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                            NT$ {displayProject.budget_min.toLocaleString()} - {displayProject.budget_max.toLocaleString()}
                          </p>
                        )}
                      </div>
                      {displayProject.budget_estimate_only && (
                        <p className="text-sm text-[#c5ae8c] mt-1 flex items-center justify-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#20263e]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                          </svg>
                          預算僅供參考
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 mb-6 pt-6 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[#c5ae8c]">付款方式</span>
                        {isEditMode ? (
                          <select
                            value={displayProject.payment_method || 'negotiable'}
                            onChange={(e) => handleFieldChange('payment_method', e.target.value)}
                            className="p-2 border-2 border-[#c5ae8c] rounded text-[#20263e]"
                          >
                            <option value="installment">分期付款</option>
                            <option value="milestone">里程碑付款</option>
                            <option value="full_after">完成後付款</option>
                            <option value="negotiable">待協商</option>
                          </select>
                        ) : (
                          <span className="font-medium text-[#20263e]">
                            {displayProject.payment_method === "installment"
                              ? "分期付款"
                              : displayProject.payment_method === "milestone"
                              ? "里程碑付款"
                              : displayProject.payment_method === "full_after"
                              ? "完成後付款"
                              : "待協商"}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#c5ae8c]">期望開始</span>
                        {isEditMode ? (
                          <input
                            type="date"
                            value={displayProject.start_date ? displayProject.start_date.split('T')[0] : ''}
                            onChange={(e) => handleFieldChange('start_date', e.target.value)}
                            className="p-2 border-2 border-[#c5ae8c] rounded text-[#20263e]"
                          />
                        ) : (
                          <span className="font-medium text-[#20263e]">
                            {displayProject.start_date ? new Date(displayProject.start_date).toLocaleDateString("zh-TW") : "可議"}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#c5ae8c]">期望完成</span>
                        {isEditMode ? (
                          <input
                            type="date"
                            value={displayProject.deadline ? displayProject.deadline.split('T')[0] : ''}
                            onChange={(e) => handleFieldChange('deadline', e.target.value)}
                            className="p-2 border-2 border-[#c5ae8c] rounded text-[#20263e]"
                          />
                        ) : (
                          <span className="font-medium text-[#20263e]">
                            {displayProject.deadline ? new Date(displayProject.deadline).toLocaleDateString("zh-TW") : "可議"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 提交提案按鈕 */}
                    {!isOwner && (
                      <ProjectDetailClient 
                        projectId={displayProject.id} 
                        projectTitle={displayProject.title}
                        isOwner={false} 
                        userId={userId || undefined} 
                      />
                    )}
                  </div>
                  </div>
                </Card>
              </section>

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
                            <div className="flex items-center gap-1 text-sm text-[#c5ae8c]">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#fbbf24]">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                              </svg>
                              <span>{bid.freelancer.rating || "尚無評分"}</span>
                              {bid.freelancer.skills && (
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full ml-1">
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
                                ? "khaki"
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
          <div ref={rightColumnRef} className="space-y-6 flex flex-col h-full">
            <div className="sticky top-24 space-y-6">

            {/* 技術規格 */}
            {(project.required_skills?.length > 0 || project.new_design_style?.length > 0 || project.new_integrations?.length > 0 || project.maint_known_tech_stack?.length > 0 || project.new_outputs?.length > 0) && (
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#20263e] mb-4" style={{ fontFamily: "'Noto Serif TC', serif" }}>技術規格</h3>
                <div className="space-y-6">
                  {/* 技能需求 */}
                  {project.required_skills && project.required_skills.length > 0 && (
                    <div>
                      <h4 className="text-base font-semibold text-[#20263e] mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#20263e]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.423 19.007a6.631 6.631 0 0 1-1.25-1.25m.082-9.765a4.5 4.5 0 0 1 6.364 6.364l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l4.5-4.5Zm0 0-1.359-1.359m0 0A1.5 1.5 0 0 1 9.5 5.5a4.5 4.5 0 0 0-1.414 1.414m1.414-1.414L5.5 9.5a1.5 1.5 0 0 1-2.122 0 4.5 4.5 0 0 0 1.414 1.414m-1.414-1.414 1.359 1.359" />
                        </svg>
                        技能需求
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {project.required_skills.map((skill: string) => (
                          <Badge key={skill} variant="khaki" className="text-sm py-1 px-3">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 設計風格 (全新開發) */}
                  {project.new_design_style && project.new_design_style.length > 0 && (
                    <div>
                      <h4 className="text-base font-semibold text-[#20263e] mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#20263e]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.998 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 3.405-1.622m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 3.405-1.622m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m0 0a15.998 15.998 0 0 0-3.388-1.62m5.043.025a15.994 15.998 0 0 1-1.622 3.395m-3.42-3.42a15.995 15.995 0 0 0-3.405 1.622m5.043.025a15.994 15.994 0 0 1-1.622 3.395m0 0a15.998 15.998 0 0 0 3.388 1.62m-5.043.025a15.994 15.994 0 0 1-1.622 3.395" />
                        </svg>
                        設計風格
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {project.new_design_style.map((style: string) => (
                          <Badge key={style} variant="khaki" className="text-sm py-1 px-3">
                            {style}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 整合需求 (全新開發) */}
                  {project.new_integrations && project.new_integrations.length > 0 && (
                    <div>
                      <h4 className="text-base font-semibold text-[#20263e] mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#20263e]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                        </svg>
                        外部整合
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {project.new_integrations.map((integration: string) => (
                          <Badge key={integration} variant="khaki" className="text-sm py-1 px-3">
                            {integration}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 已知技術棧 (修改維護) */}
                  {project.maint_known_tech_stack && project.maint_known_tech_stack.length > 0 && (
                    <div>
                      <h4 className="text-base font-semibold text-[#20263e] mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#20263e]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v14.25A2.25 2.25 0 0 0 5.25 19.5h13.5A2.25 2.25 0 0 0 21 17.25V6.75A2.25 2.25 0 0 0 18.75 4.5H5.25A2.25 2.25 0 0 0 3 6.75V19.5M6.75 7.5h.75m.75 0h.75m.75 0h.75m-4.5 3h.75m.75 0h.75m.75 0h.75m-4.5 3h.75m.75 0h.75m.75 0h.75" />
                        </svg>
                        現有技術棧
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {project.maint_known_tech_stack.map((tech: string) => (
                          <Badge key={tech} variant="khaki" className="text-sm py-1 px-3">
                            {tech}
                          </Badge>
                        ))}
                      </div>
              </div>
                  )}

                  {/* 預期交付項目 (全新開發) */}
                  {project.new_outputs && project.new_outputs.length > 0 && (
                    <div>
                      <h4 className="text-base font-semibold text-[#20263e] mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#20263e]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                        </svg>
                        預期交付項目
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {project.new_outputs.map((output: string, index: number) => (
                          <Badge key={index} variant="khaki" className="text-sm py-1 px-3">
                            {output}
                          </Badge>
                        ))}
                </div>
                </div>
                  )}
                </div>
              </div>
            )}

            {/* 關於發案者 */}
            <hr ref={clientDividerRef} className="border-[#20263e] border my-6" />
            <section>
              <h3 className="text-lg font-bold text-[#20263e] mb-4">關於發案者</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#20263e] rounded-full flex items-center justify-center text-white text-lg font-bold">
                  {project.client.name[0]}
                </div>
                <div className="flex items-center gap-6">
                <div>
                  <p className="font-bold text-lg text-[#20263e]">
                    {project.client.name}
                  </p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className={`w-4 h-4 ${
                            i < Math.round(project.client.rating || 0)
                              ? "text-[#fbbf24]"
                              : "text-gray-300"
                          }`}
                        >
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                        </svg>
                      ))}
                    <span className="text-[#c5ae8c] text-sm ml-1">
                      ({project.client.rating || "尚無評分"})
                    </span>
                </div>
              </div>
              
                  <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-[#20263e]">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#20263e]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                  <span>Email 已驗證</span>
                </div>
                <div className="flex items-center gap-2 text-[#20263e]">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#20263e]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                      </svg>
                  <span>電話已驗證</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            </div>
            
            {/* 底部填充，用於對齊 */}
            <div className="flex-1" style={{ minHeight: `${sidebarPadding}px` }}></div>
          </div>
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// 映射英文值到中文标签（用于需交付文件和擔憂與顧慮）
const DELIVERABLE_MAP: Record<string, string> = {
  "source_code": "原始碼",
  "admin_credentials": "後台帳密",
  "tutorial_video": "教學影片",
  "documentation": "使用文件",
  "maintenance": "維護服務",
  "deployment": "上線代辦",
  "training": "操作培訓",
};

const CONCERN_MAP: Record<string, string> = {
  "security": "擔心資料安全",
  "complexity": "怕操作太難",
  "scalability": "想之後能持續擴充功能",
  "nda": "需要簽署保密協議（NDA）",
  "copyright": "版權歸屬需求",
  "modification_limit": "修改次數限制",
  "warranty": "保固服務",
};

// 將英文值轉換為中文（如果數據庫中是英文值）
const translateDeliverable = (value: string): string => {
  // 如果已經是中文（不在映射表中），直接返回
  if (!DELIVERABLE_MAP[value]) {
    return value;
  }
  return DELIVERABLE_MAP[value];
};

const translateConcern = (value: string): string => {
  // 如果已經是中文（不在映射表中），直接返回
  if (!CONCERN_MAP[value]) {
    return value;
  }
  return CONCERN_MAP[value];
};

// 全新開發專案詳細內容
function NewDevelopmentDetails({ project }: { project: any }) {
  return (
    <div className="space-y-8">
      {/* 功能需求列表 */}
      {project.new_features && project.new_features.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[#20263e] mb-3 border-l-4 border-[#20263e] pl-3">
            功能需求
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {project.new_features.map((feature: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-[#20263e]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span className="text-[#20263e]">{feature}</span>
              </div>
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
              <li key={index}>{translateDeliverable(item)}</li>
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
          <h3 className="text-lg font-semibold text-[#20263e] mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#20263e]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
            預期成果與驗收標準
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
