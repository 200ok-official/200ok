"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
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
  const [togglingRole, setTogglingRole] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
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
      setIsEditMode(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      setError(error.message || "更新失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        skills: profile.skills || [],
        portfolio_links: profile.portfolio_links || [],
      });
    }
    setIsEditMode(false);
    setError("");
    setSuccess("");
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
    if (togglingRole) return;

    try {
      const currentRoles = profile?.roles || [];
      let newRoles: UserRole[];

      if (currentRoles.includes(role)) {
        if (currentRoles.length === 1) {
          setError("您至少需要保留一個身份");
          setTimeout(() => setError(""), 3000);
          return;
        }
        newRoles = currentRoles.filter((r) => r !== role);
      } else {
        newRoles = [...currentRoles, role];
      }

      setTogglingRole(true);
      setError("");
      
      const response = await apiPut("/api/v1/users/me/profile", { roles: newRoles });
      
      if (response.data && response.data.roles) {
        setProfile((prev) => prev ? { ...prev, roles: response.data.roles } : null);
      } else {
        setProfile((prev) => prev ? { ...prev, roles: newRoles } : null);
      }
      
      setSuccess(`身份已更新`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Toggle role error:", error);
      setError(error.message || "更新身份失敗");
    } finally {
      setTogglingRole(false);
    }
  };

  const handleAvatarClick = () => {
    if (isEditMode) {
        fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("不支援的圖片格式，請使用 JPEG、PNG、GIF 或 WebP");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("圖片大小不能超過 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const base64 = await fileToBase64(file);
      const response = await apiPost("/api/v1/avatar/upload", {
        avatar_data: base64,
      });

      setProfile((prev) => prev ? { ...prev, avatar_url: response.data.avatar_url } : null);
      setSuccess("頭像上傳成功！");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      setError(error.message || "頭像上傳失敗");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Helper for Markdown Toolbar
  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById('bio-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    
    // 如果沒有選中文字，且是標題類型，提供預設文字
    const defaultText = selected || (prefix.includes('#') ? '標題' : '文字');
    
    const newText = `${before}${prefix}${defaultText}${suffix}${after}`;
    setFormData({ ...formData, bio: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length, 
        start + prefix.length + defaultText.length
      );
    }, 0);
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

  if (!profile) return null;

  const isFreelancer = profile.roles.includes("freelancer");
  const isClient = profile.roles.includes("client");

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
      <Navbar />
      
      <main className="flex-1 py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* 頂部標題與操作區 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#20263e]">個人資料設定</h1>
              <p className="text-gray-500 mt-1">管理您的公開資訊與平台身份</p>
            </div>
            
            <div className="flex items-center gap-3">
              {!isEditMode ? (
                <>
                  <Button
                    onClick={() => router.push(`/users/${profile.id}`)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    檢視公開頁面
                  </Button>
                  <Button
                    onClick={() => setIsEditMode(true)}
                    className="bg-[#20263e] hover:bg-[#2c3454] text-white flex items-center gap-2"
                  >
                    編輯資料
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    disabled={saving}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]"
                  >
                    {saving ? "儲存中..." : "儲存變更"}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* 通知訊息區 */}
          <div className="space-y-4 mb-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded shadow-sm flex items-center justify-between">
                <p>{error}</p>
                <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">✕</button>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded shadow-sm flex items-center justify-between">
                <p>{success}</p>
                <button onClick={() => setSuccess("")} className="text-green-500 hover:text-green-700">✕</button>
              </div>
            )}
            {!profile.email_verified && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <h3 className="font-bold text-amber-800">電子郵件尚未驗證</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        請前往 <strong>{profile.email}</strong> 收取驗證信。驗證後才能使用完整功能。
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-400 text-amber-800 hover:bg-amber-100"
                    onClick={async () => {
                      try {
                        await apiGet(`/api/v1/auth/verify-email`, { email: profile.email });
                        setSuccess("驗證信已發送！");
                      } catch (e: any) {
                        setError(e.message);
                      }
                    }}
                  >
                    重發驗證信
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* 左側邊欄：身份與基本資料 (佔 4 欄) */}
            <div className="lg:col-span-4 space-y-6 sticky top-24">
              {/* 1. 基本資料卡片 */}
              <Card className="p-6 text-center border-t-4 border-t-[#20263e]">
                <div className="relative inline-block group mx-auto mb-4">
                  <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-200 ${isEditMode ? 'cursor-pointer' : ''}`} onClick={handleAvatarClick}>
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.name} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                        {profile.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    
                    {/* 編輯模式下的遮罩 */}
                    {isEditMode && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="text-xs font-medium">更換頭像</span>
                      </div>
                    )}
                    
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>

                <div className="space-y-3">
                  {isEditMode ? (
                    <div className="space-y-3 px-2">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block text-left">姓名</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full text-center px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#20263e]"
                                placeholder="輸入您的姓名"
                            />
                        </div>
                    </div>
                  ) : (
                    <h2 className="text-2xl font-bold text-[#20263e]">{profile.name}</h2>
                  )}

                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {profile.roles.map(role => (
                      <Badge key={role} className="bg-[#20263e]">
                        {role === 'freelancer' ? '接案工程師' : role === 'client' ? '發案者' : role}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 text-left space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-gray-700 truncate">{profile.email}</span>
                      {profile.email_verified && <span className="text-green-500" title="已驗證">✓</span>}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">手機號碼</label>
                    {isEditMode ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#20263e]"
                        placeholder="09xx-xxx-xxx"
                      />
                    ) : (
                      <p className="text-gray-700 mt-1">{profile.phone || <span className="text-gray-400 italic">未填寫</span>}</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* 2. 身份切換卡片 */}
              <Card className="p-5">
                <h3 className="font-bold text-[#20263e] mb-4 flex items-center gap-2">
                  平台身份設定
                </h3>
                <div className="space-y-3">
                  {/* 接案者開關 */}
                  <div 
                    onClick={() => !togglingRole && toggleRole('freelancer')}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${togglingRole ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                        isFreelancer 
                        ? 'border-[#20263e] bg-[#20263e]/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${isFreelancer ? 'bg-[#20263e] border-[#20263e]' : 'border-gray-300'}`}>
                            {isFreelancer && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div>
                            <div className="font-medium text-[#20263e]">接案工程師</div>
                            <div className="text-xs text-gray-500">接案、展示作品</div>
                        </div>
                    </div>
                    {togglingRole && <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-[#20263e] rounded-full"></div>}
                  </div>

                  {/* 發案者開關 */}
                  <div 
                    onClick={() => !togglingRole && toggleRole('client')}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${togglingRole ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                        isClient 
                        ? 'border-[#20263e] bg-[#20263e]/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${isClient ? 'bg-[#20263e] border-[#20263e]' : 'border-gray-300'}`}>
                            {isClient && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div>
                            <div className="font-medium text-[#20263e]">發案者</div>
                            <div className="text-xs text-gray-500">發案、尋找人才</div>
                        </div>
                    </div>
                    {togglingRole && <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-[#20263e] rounded-full"></div>}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">可同時選擇兩種身份</p>
              </Card>
            </div>

            {/* 右側主內容：詳細資料 (佔 8 欄) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* 1. 個人簡介 (共用) */}
              <Card className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#20263e]">關於我</h2>
                  {isEditMode && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Markdown 支援</span>}
                </div>
                
                {isEditMode ? (
                  <div className="space-y-2">
                    {/* Markdown Toolbar */}
                    <div className="flex items-center gap-1 p-1 bg-gray-50 border rounded-t-md border-b-0">
                      <button onClick={() => insertMarkdown('**', '**')} className="p-2 hover:bg-gray-200 rounded text-sm font-bold" title="粗體">B</button>
                      <button onClick={() => insertMarkdown('_', '_')} className="p-2 hover:bg-gray-200 rounded text-sm italic" title="斜體">I</button>
                      <div className="w-px h-4 bg-gray-300 mx-1"></div>
                      <button onClick={() => insertMarkdown('# ')} className="p-2 hover:bg-gray-200 rounded text-sm font-bold" title="大標題">H1</button>
                      <button onClick={() => insertMarkdown('## ')} className="p-2 hover:bg-gray-200 rounded text-sm font-bold" title="中標題">H2</button>
                      <button onClick={() => insertMarkdown('- ')} className="p-2 hover:bg-gray-200 rounded text-sm" title="清單">• List</button>
                    </div>
                    <textarea
                      id="bio-textarea"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full h-64 p-4 border rounded-b-md focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] font-mono text-sm leading-relaxed"
                      placeholder="介紹一下您的背景、專業經歷或公司簡介..."
                    />
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none text-gray-700 text-base
                    prose-headings:text-[#20263e] prose-headings:font-semibold prose-headings:font-serif prose-headings:leading-[2] prose-headings:mb-4 prose-headings:mt-6
                    prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h4:text-sm
                    prose-p:leading-loose prose-p:mb-4
                    prose-li:leading-loose
                    prose-a:text-[#c5ae8c] prose-a:no-underline hover:prose-a:underline hover:prose-a:text-[#b09675]
                    prose-strong:text-[#20263e] prose-strong:font-semibold
                    prose-ul:list-disc prose-ul:pl-5 prose-ul:my-4 prose-ul:leading-loose
                    prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-4 prose-ol:leading-loose
                    prose-li:my-2
                    prose-blockquote:border-l-4 prose-blockquote:border-[#c5ae8c] prose-blockquote:bg-gray-50 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-gray-600
                    prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[#c7254e] prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-[#20263e] prose-pre:text-white prose-pre:rounded-lg prose-pre:p-4 prose-pre:shadow-inner
                    prose-img:rounded-xl prose-img:shadow-md
                    prose-hr:border-gray-200
                  ">
                    {formData.bio ? (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]} 
                        rehypePlugins={[rehypeSanitize]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-xl font-semibold font-serif leading-[2] mb-4 mt-6 text-[#20263e]" style={{fontFamily: "'Noto Serif TC', serif"}} {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-lg font-semibold font-serif leading-[2] mb-4 mt-6 text-[#20263e]" style={{fontFamily: "'Noto Serif TC', serif"}} {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-base font-semibold font-serif leading-[2] mb-4 mt-6 text-[#20263e]" style={{fontFamily: "'Noto Serif TC', serif"}} {...props} />,
                          h4: ({node, ...props}) => <h4 className="text-sm font-semibold font-serif leading-[2] mb-4 mt-6 text-[#20263e]" style={{fontFamily: "'Noto Serif TC', serif"}} {...props} />,
                        }}
                      >
                        {formData.bio}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-gray-400 italic py-8 text-center bg-gray-50 rounded-lg">
                        尚未填寫簡介。點擊右上角「編輯資料」來新增介紹。
                      </p>
                    )}
                  </div>
                )}
              </Card>

              {/* 2. 專業技能 (僅接案者顯示) */}
              {isFreelancer && (
                <Card className="p-6 md:p-8 border-t-4 border-t-[#20263e]">
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-xl font-bold text-[#20263e]">專業技能</h2>
                        <Badge className="bg-gray-100 text-gray-600 font-normal">接案者專屬</Badge>
                    </div>

                    {isEditMode ? (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                                    className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#20263e]"
                                    placeholder="輸入技能後按 Enter (如: React, Figma)"
                                />
                                <Button onClick={handleAddSkill} variant="outline">新增</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 min-h-[50px] p-4 bg-gray-50 rounded-lg">
                                {formData.skills.map(skill => (
                                    <span key={skill} className="bg-white border border-gray-200 px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
                                        {skill}
                                        <button onClick={() => handleRemoveSkill(skill)} className="text-gray-400 hover:text-red-500">×</button>
                                    </span>
                                ))}
                                {formData.skills.length === 0 && <span className="text-gray-400 text-sm">暫無技能</span>}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {formData.skills.length > 0 ? formData.skills.map(skill => (
                                <span key={skill} className="bg-[#20263e]/5 text-[#20263e] font-medium px-4 py-1.5 rounded-full">
                                    {skill}
                                </span>
                            )) : (
                                <p className="text-gray-400">尚未新增技能</p>
                            )}
                        </div>
                    )}
                </Card>
              )}

              {/* 3. 作品集 (僅接案者顯示) */}
              {isFreelancer && (
                <Card className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-xl font-bold text-[#20263e]">作品集連結</h2>
                        <Badge className="bg-gray-100 text-gray-600 font-normal">接案者專屬</Badge>
                    </div>

                    {isEditMode ? (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={newPortfolioLink}
                                    onChange={(e) => setNewPortfolioLink(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddPortfolioLink()}
                                    className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#20263e]"
                                    placeholder="https://github.com/username"
                                />
                                <Button onClick={handleAddPortfolioLink} variant="outline">新增</Button>
                            </div>
                            <div className="space-y-2">
                                {formData.portfolio_links.map((link, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                                        <span className="truncate text-sm text-gray-600 font-mono">{link}</span>
                                        <button onClick={() => handleRemovePortfolioLink(link)} className="text-red-500 hover:text-red-700 p-1">刪除</button>
                                    </div>
                                ))}
                                {formData.portfolio_links.length === 0 && <p className="text-gray-400 text-sm text-center py-4">暫無連結</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {formData.portfolio_links.length > 0 ? formData.portfolio_links.map((link, idx) => (
                                <a 
                                    key={idx} 
                                    href={link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#20263e] hover:shadow-md transition-all group bg-white"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#20263e] transition-colors">
                                        <svg className="w-5 h-5 text-gray-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[#20263e] font-medium truncate">{link.replace(/^https?:\/\//, '')}</div>
                                        <div className="text-xs text-gray-400 truncate">{link}</div>
                                    </div>
                                    <div className="text-gray-300 group-hover:text-[#20263e] transition-colors">→</div>
                                </a>
                            )) : (
                                <p className="text-gray-400">尚未新增作品集</p>
                            )}
                        </div>
                    )}
                </Card>
              )}

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
