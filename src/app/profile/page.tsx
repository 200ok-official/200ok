"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { apiGet, apiPut, apiPost, apiDelete } from "@/lib/api";

type UserRole = "freelancer" | "client" | "admin";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  phone?: string;
  phone_verified: boolean;
  roles: UserRole[];
  bio?: string;
  skills?: string[];
  avatar_url?: string;
  rating?: number;
  portfolio_links?: string[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"freelancer" | "client">("client");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 表單資料
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    bio: "",
    skills: [] as string[],
    portfolio_links: [] as string[],
  });

  const [newSkill, setNewSkill] = useState("");
  const [newPortfolioLink, setNewPortfolioLink] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiGet("/api/v1/users/me/profile");
      setProfile(data.data);
      
      // 初始化表單
      setFormData({
        name: data.data.name || "",
        phone: data.data.phone || "",
        bio: data.data.bio || "",
        skills: data.data.skills || [],
        portfolio_links: data.data.portfolio_links || [],
      });

      // 根據使用者角色設定預設分頁
      if (data.data.roles?.includes("freelancer")) {
        setActiveTab("freelancer");
      } else {
        setActiveTab("client");
      }
    } catch (error: any) {
      console.error("Fetch profile error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await apiPut("/api/v1/users/me/profile", formData);
      setSuccess("個人資料已更新！");
      await fetchProfile();
      
      // 儲存成功後滾動到頁面頂端
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      setError(error.message || "更新失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const handleAddPortfolioLink = () => {
    if (newPortfolioLink.trim()) {
      setFormData({
        ...formData,
        portfolio_links: [...formData.portfolio_links, newPortfolioLink.trim()],
      });
      setNewPortfolioLink("");
    }
  };

  const handleRemovePortfolioLink = (link: string) => {
    setFormData({
      ...formData,
      portfolio_links: formData.portfolio_links.filter((l) => l !== link),
    });
  };

  const toggleRole = async (role: UserRole) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const currentRoles = profile?.roles || [];
      let newRoles: UserRole[];

      if (currentRoles.includes(role)) {
        // 如果已有此角色，移除（但至少保留一個角色）
        if (currentRoles.length === 1) {
          setError("您至少需要保留一個身份");
          setTimeout(() => setError(""), 3000);
          return;
        }
        newRoles = currentRoles.filter((r) => r !== role);
      } else {
        // 新增角色
        newRoles = [...currentRoles, role];
      }

      // 立即更新本地狀態以提供即時反饋
      setProfile((prev) => prev ? { ...prev, roles: newRoles } : null);
      setError("");
      setSuccess("");

      try {
        await apiPut("/api/v1/users/me/profile", { roles: newRoles });
      } catch (error) {
        // 如果失敗，恢復原狀態
        setProfile((prev) => prev ? { ...prev, roles: currentRoles } : null);
        throw new Error("更新身份失敗");
      }

      setSuccess(`✓ 身份已更新！目前選擇：${newRoles.map(r => r === 'freelancer' ? '接案工程師' : '發案者').join('、')}`);
      
      // 身份更新成功後滾動到頁面頂端
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.message || "更新身份失敗");
      setTimeout(() => setError(""), 3000);
    }
  };

  // 頭像上傳相關函數
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 驗證檔案類型
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("不支援的圖片格式，請使用 JPEG、PNG、GIF 或 WebP");
      return;
    }

    // 驗證檔案大小（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("圖片大小不能超過 5MB");
      return;
    }

    setUploadingAvatar(true);
    setError("");
    setSuccess("");

    try {
      // 轉換為 Base64
      const base64 = await fileToBase64(file);
      
      // 上傳到後端
      const response = await apiPost("/api/v1/avatar/upload", {
        avatar_data: base64,
      });

      // 更新本地狀態
      setProfile((prev) => prev ? { ...prev, avatar_url: response.data.avatar_url } : null);
      setSuccess("頭像上傳成功！");
      
      // 清空 input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // 上傳成功後滾動到頁面頂端
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      setError(error.message || "頭像上傳失敗");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm("確定要刪除頭像嗎？")) return;

    setUploadingAvatar(true);
    setError("");
    setSuccess("");

    try {
      await apiDelete("/api/v1/avatar/delete");
      setProfile((prev) => prev ? { ...prev, avatar_url: undefined } : null);
      setSuccess("頭像已刪除");
      
      // 刪除成功後滾動到頁面頂端
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      setError(error.message || "刪除頭像失敗");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 將檔案轉換為 Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#20263e]"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 max-w-md">
            <h2 className="text-xl font-bold text-[#20263e] mb-4">無法載入個人資料</h2>
            <Button onClick={() => router.push("/login")}>返回登入</Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
      <Navbar />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          {/* 頁面標題 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#20263e] mb-2">個人資料</h1>
            <p className="text-[#c5ae8c]">管理您的帳號資訊與偏好設定</p>
          </div>

          {/* 通知訊息 */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
              <p className="font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded">
              <p className="font-medium">{success}</p>
            </div>
          )}

          {/* Email 驗證提示 */}
          {!profile.email_verified && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-yellow-800">
                    電子郵件尚未驗證
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    請前往您的信箱 <strong>{profile.email}</strong> 點擊驗證連結
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={async () => {
                      try {
                        await apiGet(`/api/v1/auth/verify-email`, { email: profile.email });
                        setSuccess("驗證郵件已重新發送！請檢查您的信箱。");
                        setError("");
                      } catch (error: any) {
                        setError(error.message || "重新發送失敗");
                        setSuccess("");
                      }
                    }}
                  >
                    重新發送驗證郵件
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 基本資訊卡片 */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold text-[#20263e] mb-6">基本資訊</h2>
            
            <div className="space-y-5">
              {/* 頭像上傳區 */}
              <div>
                <label className="block text-sm font-semibold text-[#20263e] mb-3">
                  個人頭像
                </label>
                <div className="flex items-center gap-6">
                  {/* 頭像預覽 */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-[#c5ae8c] flex items-center justify-center text-white text-3xl font-bold shadow-md">
                      {profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // 如果圖片載入失敗，顯示首字母
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span>{profile.name?.charAt(0)?.toUpperCase() || "?"}</span>
                      )}
                    </div>
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>

                  {/* 上傳按鈕 */}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar}
                        variant="outline"
                        size="sm"
                      >
                        {uploadingAvatar ? "上傳中..." : profile.avatar_url ? "更換頭像" : "上傳頭像"}
                      </Button>
                      {profile.avatar_url && (
                        <Button
                          onClick={handleDeleteAvatar}
                          disabled={uploadingAvatar}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:border-red-600"
                        >
                          刪除
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-[#c5ae8c] mt-2">
                      支援 JPEG、PNG、GIF、WebP，檔案大小不超過 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* 分隔線 */}
              <div className="border-t border-[#c5ae8c] opacity-30 my-6"></div>

              {/* 姓名 */}
              <div>
                <label className="block text-sm font-semibold text-[#20263e] mb-2">
                  姓名
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e]"
                  placeholder="您的姓名"
                />
              </div>

              {/* Email（唯讀） */}
              <div>
                <label className="block text-sm font-semibold text-[#20263e] mb-2">
                  電子郵件
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                  {profile.email_verified && (
                    <Badge variant="success">已驗證</Badge>
                  )}
                </div>
              </div>

              {/* 手機 */}
              <div>
                <label className="block text-sm font-semibold text-[#20263e] mb-2">
                  手機號碼（選填）
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e]"
                  placeholder="0912-345-678"
                />
              </div>
            </div>
          </Card>

          {/* 身份選擇 */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#20263e] mb-1">您的身份</h2>
                <p className="text-sm text-[#c5ae8c]">
                  選擇您在平台上的身份（可多選）
                  {profile.roles && profile.roles.length > 0 && (
                    <span className="ml-2 text-[#20263e] font-semibold">
                      （已選擇 {profile.roles.length} 個）
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* 接案工程師 */}
              <button
                type="button"
                onClick={() => toggleRole("freelancer")}
                className={`relative p-5 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                  profile.roles?.includes("freelancer")
                    ? "border-[#20263e] bg-[#20263e] bg-opacity-10 shadow-sm"
                    : "border-[#c5ae8c] hover:border-[#20263e] bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Checkbox 樣式 */}
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                          profile.roles?.includes("freelancer")
                            ? "border-[#20263e] bg-[#20263e]"
                            : "border-[#c5ae8c] bg-white"
                        }`}
                      >
                        {profile.roles?.includes("freelancer") && (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <h3 className="font-semibold text-[#20263e] text-lg">
                        💼 接案工程師
                      </h3>
                    </div>
                    <p className="text-sm text-[#c5ae8c] ml-9">
                      接取案件、展示作品、累積評價
                    </p>
                  </div>
                </div>
              </button>

              {/* 發案者 */}
              <button
                type="button"
                onClick={() => toggleRole("client")}
                className={`relative p-5 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                  profile.roles?.includes("client")
                    ? "border-[#20263e] bg-[#20263e] bg-opacity-10 shadow-sm"
                    : "border-[#c5ae8c] hover:border-[#20263e] bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Checkbox 樣式 */}
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                          profile.roles?.includes("client")
                            ? "border-[#20263e] bg-[#20263e]"
                            : "border-[#c5ae8c] bg-white"
                        }`}
                      >
                        {profile.roles?.includes("client") && (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <h3 className="font-semibold text-[#20263e] text-lg">
                        📋 發案者
                      </h3>
                    </div>
                    <p className="text-sm text-[#c5ae8c] ml-9">
                      發布案件、尋找人才、管理專案
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* 提示訊息 */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>💡 提示：</strong> 您可以同時選擇多個身份，例如既是接案工程師也是發案者。至少需要保留一個身份。
              </p>
            </div>
          </Card>

          {/* 分區編輯：工程師 vs 發案者 */}
          <Card className="p-6 mb-6">
            {/* 分頁切換 */}
            <div className="flex border-b-2 border-[#c5ae8c] mb-6">
              <button
                onClick={() => setActiveTab("freelancer")}
                className={`px-6 py-3 font-semibold transition-colors ${
                  activeTab === "freelancer"
                    ? "border-b-4 border-[#20263e] text-[#20263e] -mb-0.5"
                    : "text-[#c5ae8c] hover:text-[#20263e]"
                }`}
              >
                💼 工程師資料
              </button>
              <button
                onClick={() => setActiveTab("client")}
                className={`px-6 py-3 font-semibold transition-colors ${
                  activeTab === "client"
                    ? "border-b-4 border-[#20263e] text-[#20263e] -mb-0.5"
                    : "text-[#c5ae8c] hover:text-[#20263e]"
                }`}
              >
                📋 發案者資料
              </button>
            </div>

            {/* 工程師資料區 */}
            {activeTab === "freelancer" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>提示：</strong> 完整的個人檔案能幫助您獲得更多案件機會
                  </p>
                </div>

                {/* 簡介 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-[#20263e]">
                      個人簡介
                    </label>
                    <div className="flex gap-1 text-xs text-gray-500">
                      <button 
                        type="button"
                        className="px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                        onClick={() => {
                          const textarea = document.getElementById('bio-freelancer') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const selected = textarea.value.substring(start, end);
                            const before = textarea.value.substring(0, start);
                            const after = textarea.value.substring(end);
                            const newText = `${before}**${selected || '粗體文字'}**${after}`;
                            setFormData({ ...formData, bio: newText });
                            // 延遲設定游標位置，等待 React 更新
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + 2, end + 2);
                            }, 0);
                          }
                        }}
                      >
                        <strong>B</strong>
                      </button>
                      <button 
                        type="button"
                        className="px-2 py-1 hover:bg-gray-100 rounded transition-colors italic"
                        onClick={() => {
                          const textarea = document.getElementById('bio-freelancer') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const selected = textarea.value.substring(start, end);
                            const before = textarea.value.substring(0, start);
                            const after = textarea.value.substring(end);
                            const newText = `${before}_${selected || '斜體文字'}_${after}`;
                            setFormData({ ...formData, bio: newText });
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + 1, end + 1);
                            }, 0);
                          }
                        }}
                      >
                        I
                      </button>
                      <button 
                        type="button"
                        className="px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                        onClick={() => {
                          const textarea = document.getElementById('bio-freelancer') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const selected = textarea.value.substring(start, end);
                            const before = textarea.value.substring(0, start);
                            const after = textarea.value.substring(end);
                            const newText = `${before}# ${selected || '大標題'}${after}`;
                            setFormData({ ...formData, bio: newText });
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + 2, end + 2);
                            }, 0);
                          }
                        }}
                      >
                        H1
                      </button>
                      <button 
                        type="button"
                        className="px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                        onClick={() => {
                          const textarea = document.getElementById('bio-freelancer') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const selected = textarea.value.substring(start, end);
                            const before = textarea.value.substring(0, start);
                            const after = textarea.value.substring(end);
                            const newText = `${before}## ${selected || '中標題'}${after}`;
                            setFormData({ ...formData, bio: newText });
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + 3, end + 3);
                            }, 0);
                          }
                        }}
                      >
                        H2
                      </button>
                      <button 
                        type="button"
                        className="px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                        onClick={() => {
                          const textarea = document.getElementById('bio-freelancer') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const selected = textarea.value.substring(start, end);
                            const before = textarea.value.substring(0, start);
                            const after = textarea.value.substring(end);
                            const newText = `${before}### ${selected || '小標題'}${after}`;
                            setFormData({ ...formData, bio: newText });
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + 4, end + 4);
                            }, 0);
                          }
                        }}
                      >
                        H3
                      </button>
                    </div>
                  </div>
                  <textarea
                    id="bio-freelancer"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={8}
                    className="w-full px-4 py-2 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] font-mono text-sm"
                    placeholder="簡單介紹您的專業背景與經驗... (支援 Markdown)"
                  />
                  <p className="text-xs text-gray-500 mt-1">支援 Markdown 語法：**粗體**、_斜體_、# 標題</p>
                </div>

                {/* 技能 */}
                <div>
                  <label className="block text-sm font-semibold text-[#20263e] mb-2">
                    技能專長
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      className="flex-1 px-4 py-2 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e]"
                      placeholder="例如：React, Python, UI/UX Design..."
                    />
                    <Button onClick={handleAddSkill}>新增</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <div
                        key={skill}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#20263e] text-white rounded-full text-sm"
                      >
                        <span>{skill}</span>
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-red-300 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {formData.skills.length === 0 && (
                      <p className="text-sm text-[#c5ae8c]">尚未新增技能</p>
                    )}
                  </div>
                </div>

                {/* 作品集連結 */}
                <div>
                  <label className="block text-sm font-semibold text-[#20263e] mb-2">
                    作品集連結
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="url"
                      value={newPortfolioLink}
                      onChange={(e) => setNewPortfolioLink(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddPortfolioLink();
                        }
                      }}
                      className="flex-1 px-4 py-2 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e]"
                      placeholder="https://..."
                    />
                    <Button onClick={handleAddPortfolioLink}>新增</Button>
                  </div>
                  <div className="space-y-2">
                    {formData.portfolio_links.map((link, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white border border-[#c5ae8c] rounded-lg"
                      >
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#20263e] hover:text-[#c5ae8c] transition truncate flex-1"
                        >
                          {link}
                        </a>
                        <button
                          onClick={() => handleRemovePortfolioLink(link)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {formData.portfolio_links.length === 0 && (
                      <p className="text-sm text-[#c5ae8c]">尚未新增作品集連結</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 發案者資料區 */}
            {activeTab === "client" && (
              <div className="space-y-6">
                <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                  <p className="text-sm text-green-800">
                    <strong>提示：</strong> 完整的聯絡資訊能讓接案者更容易與您溝通
                  </p>
                </div>

                {/* 簡介 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-[#20263e]">
                      公司/個人簡介
                    </label>
                    <div className="flex gap-1 text-xs text-gray-500">
                      <button 
                        type="button"
                        className="px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                        onClick={() => {
                          const textarea = document.getElementById('bio-client') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const selected = textarea.value.substring(start, end);
                            const before = textarea.value.substring(0, start);
                            const after = textarea.value.substring(end);
                            const newText = `${before}**${selected || '粗體文字'}**${after}`;
                            setFormData({ ...formData, bio: newText });
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + 2, end + 2);
                            }, 0);
                          }
                        }}
                      >
                        <strong>B</strong>
                      </button>
                      <button 
                        type="button"
                        className="px-2 py-1 hover:bg-gray-100 rounded transition-colors italic"
                        onClick={() => {
                          const textarea = document.getElementById('bio-client') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const selected = textarea.value.substring(start, end);
                            const before = textarea.value.substring(0, start);
                            const after = textarea.value.substring(end);
                            const newText = `${before}_${selected || '斜體文字'}_${after}`;
                            setFormData({ ...formData, bio: newText });
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + 1, end + 1);
                            }, 0);
                          }
                        }}
                      >
                        I
                      </button>
                      <button 
                        type="button"
                        className="px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                        onClick={() => {
                          const textarea = document.getElementById('bio-client') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const selected = textarea.value.substring(start, end);
                            const before = textarea.value.substring(0, start);
                            const after = textarea.value.substring(end);
                            const newText = `${before}# ${selected || '大標題'}${after}`;
                            setFormData({ ...formData, bio: newText });
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + 2, end + 2);
                            }, 0);
                          }
                        }}
                      >
                        H1
                      </button>
                      <button 
                        type="button"
                        className="px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                        onClick={() => {
                          const textarea = document.getElementById('bio-client') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const selected = textarea.value.substring(start, end);
                            const before = textarea.value.substring(0, start);
                            const after = textarea.value.substring(end);
                            const newText = `${before}## ${selected || '中標題'}${after}`;
                            setFormData({ ...formData, bio: newText });
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + 3, end + 3);
                            }, 0);
                          }
                        }}
                      >
                        H2
                      </button>
                      <button 
                        type="button"
                        className="px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                        onClick={() => {
                          const textarea = document.getElementById('bio-client') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const selected = textarea.value.substring(start, end);
                            const before = textarea.value.substring(0, start);
                            const after = textarea.value.substring(end);
                            const newText = `${before}### ${selected || '小標題'}${after}`;
                            setFormData({ ...formData, bio: newText });
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + 4, end + 4);
                            }, 0);
                          }
                        }}
                      >
                        H3
                      </button>
                    </div>
                  </div>
                  <textarea
                    id="bio-client"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={8}
                    className="w-full px-4 py-2 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] font-mono text-sm"
                    placeholder="簡單介紹您的公司或個人背景... (支援 Markdown)"
                  />
                  <p className="text-xs text-gray-500 mt-1">支援 Markdown 語法：**粗體**、_斜體_、# 標題</p>
                </div>

                {/* 偏好的合作方式（未來擴展） */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-[#20263e] mb-2">
                    合作偏好設定
                  </h3>
                  <p className="text-sm text-[#c5ae8c]">
                    此功能即將推出，您將可以設定：
                  </p>
                  <ul className="text-sm text-[#c5ae8c] list-disc list-inside mt-2 space-y-1">
                    <li>常用的溝通方式</li>
                    <li>預算範圍偏好</li>
                    <li>專案類型偏好</li>
                    <li>付款方式偏好</li>
                  </ul>
                </div>
              </div>
            )}
          </Card>

          {/* 儲存按鈕 */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="px-8"
            >
              {saving ? "儲存中..." : "儲存變更"}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

