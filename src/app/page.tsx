"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Project {
  id: string;
  title: string;
  budget_min: number;
  budget_max: number;
  status: string;
  created_at: string;
  client: {
    id: string;
    name: string;
  };
}

interface Freelancer {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  rating: number;
  hourly_rate?: number | null;
  created_at: string;
}

export default function HomePage() {
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recommendedFreelancers, setRecommendedFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      // 獲取最新案件
      const projectsResponse = await fetch("/api/v1/projects?limit=5&status=open");
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        // API 回應格式: { success: true, data: { projects: [...], pagination: {...} } }
        setRecentProjects(projectsData.data?.projects || []);
      } else {
        console.error("Failed to fetch projects:", projectsResponse.status);
      }

      // 獲取推薦接案工程師
      const freelancersResponse = await fetch("/api/v1/users/search?limit=5");
      if (freelancersResponse.ok) {
        const freelancersData = await freelancersResponse.json();
        // API 回應格式: { success: true, data: [...], pagination: {...} }
        setRecommendedFreelancers(freelancersData.data || []);
      } else {
        console.error("Failed to fetch freelancers:", freelancersResponse.status);
      }
    } catch (error) {
      console.error("Failed to fetch home data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e6dfcf]">
      <Navbar />

      {/* Dashboard / Login Quick Access */}
      <section className="py-6 px-4 bg-white border-b border-[#c5ae8c]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-[#20263e]">歡迎來到 200 OK</h2>
              <span className="text-sm text-[#c5ae8c]">•</span>
              <span className="text-sm text-[#c5ae8c]">軟體接案平台</span>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/projects">
                <Button variant="outline" size="sm" className="text-[#20263e] border-[#c5ae8c] hover:bg-[#e6dfcf]">
                  瀏覽案件
                </Button>
              </Link>
              <Link href="/freelancers">
                <Button variant="outline" size="sm" className="text-[#20263e] border-[#c5ae8c] hover:bg-[#e6dfcf]">
                  尋找接案工程師
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-[#20263e] hover:bg-[#2d3550] text-white">
                  加入平台
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Projects Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-[#20263e] mb-2">最新案件</h2>
              <p className="text-[#c5ae8c]">查看最新的專案需求</p>
            </div>
            <Link href="/projects">
              <Button variant="outline" className="text-[#20263e] border-[#c5ae8c] hover:bg-[#e6dfcf]">
                查看全部
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2 scroll-smooth">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex-shrink-0 w-80">
                    <Card className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    </Card>
                  </div>
                ))}
              </div>
              {/* 左右滑動提示 */}
              <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-[#e6dfcf] to-transparent pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-[#e6dfcf] to-transparent pointer-events-none flex items-center justify-center">
                <div className="bg-[#c5ae8c] rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ) : recentProjects.length > 0 ? (
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2 scroll-smooth">
              {recentProjects.slice(0, 5).map((project) => (
                <Card key={project.id} className="p-6 hover:shadow-lg transition-all border-2 border-[#c5ae8c] hover:border-[#20263e] flex-shrink-0 w-80">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-[#20263e] line-clamp-2">
                      {project.title}
                    </h3>
                    <Badge variant="default" className="bg-green-500 text-white text-xs">
                      開放中
                    </Badge>
                  </div>
                  <div className="text-sm text-[#c5ae8c] mb-3">
                    由 {project.client?.name || '未知'} 發起
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-[#20263e]">
                      ${project.budget_min} - ${project.budget_max}
                    </span>
                    <Link href={`/projects/${project.id}`}>
                      <Button size="sm" className="bg-[#20263e] hover:bg-[#2d3550] text-white">
                        查看詳情
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
              </div>
              {/* 左右滑動提示 */}
              <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-[#e6dfcf] to-transparent pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-[#e6dfcf] to-transparent pointer-events-none flex items-center justify-center">
                <div className="bg-[#c5ae8c] rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#c5ae8c] text-lg">目前沒有開放的案件</p>
              <Link href="/projects/new" className="inline-block mt-4">
                <Button className="bg-[#20263e] hover:bg-[#2d3550] text-white">
                  成為第一個發布案件的人
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Recommended Freelancers Section */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-[#20263e] mb-2">推薦接案工程師</h2>
              <p className="text-[#c5ae8c]">優秀的專業人才等您合作</p>
            </div>
            <Link href="/freelancers">
              <Button variant="outline" className="text-[#20263e] border-[#c5ae8c] hover:bg-[#e6dfcf]">
                查看全部
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2 scroll-smooth">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex-shrink-0 w-80">
                    <Card className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
              {/* 左右滑動提示 */}
              <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none flex items-center justify-center">
                <div className="bg-[#c5ae8c] rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ) : recommendedFreelancers.length > 0 ? (
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2 scroll-smooth">
              {recommendedFreelancers.slice(0, 5).map((freelancer) => (
                <Card key={freelancer.id} className="p-6 hover:shadow-lg transition-all border-2 border-[#c5ae8c] hover:border-[#20263e] flex-shrink-0 w-80">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {freelancer.avatar_url ? (
                        <img
                          src={freelancer.avatar_url}
                          alt={freelancer.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#c5ae8c]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#20263e] flex items-center justify-center text-white font-bold">
                          {freelancer.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-[#20263e] truncate">
                        {freelancer.name}
                      </h3>
                      <div className="flex items-center mt-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(freelancer.rating)
                                ? "text-yellow-400"
                                : "text-[#c5ae8c]"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-2 text-sm text-[#20263e] font-semibold">
                          {freelancer.rating.toFixed(1)}
                        </span>
                      </div>
                      {freelancer.skills && freelancer.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {freelancer.skills.slice(0, 2).map((skill, index) => (
                            <Badge
                              key={index}
                              variant="default"
                              className="text-xs bg-[#e6dfcf] text-[#20263e] border border-[#c5ae8c]"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {freelancer.skills.length > 2 && (
                            <Badge
                              variant="default"
                              className="text-xs bg-[#e6dfcf] text-[#20263e] border border-[#c5ae8c]"
                            >
                              +{freelancer.skills.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                      <Link href={`/freelancers/${freelancer.id}`}>
                        <Button size="sm" className="w-full bg-[#20263e] hover:bg-[#2d3550] text-white">
                          查看檔案
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
              </div>
              {/* 左右滑動提示 */}
              <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none flex items-center justify-center">
                <div className="bg-[#c5ae8c] rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#c5ae8c] text-lg">目前沒有推薦的接案工程師</p>
              <Link href="/register" className="inline-block mt-4">
                <Button className="bg-[#20263e] hover:bg-[#2d3550] text-white">
                  加入成為接案工程師
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Original Content - Compressed */}
      <section className="py-8 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#20263e] mb-6">
            為什麼選擇 200 OK？
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#20263e] text-white rounded-full flex items-center justify-center text-lg mx-auto mb-3">
                🎯
              </div>
              <h3 className="text-lg font-semibold text-[#20263e] mb-2">智能匹配</h3>
              <p className="text-sm text-[#c5ae8c]">
                AI 智能分析案件需求，自動推薦最適合的接案工程師，提高專案成功率。
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#20263e] text-white rounded-full flex items-center justify-center text-lg mx-auto mb-3">
                🔒
              </div>
              <h3 className="text-lg font-semibold text-[#20263e] mb-2">安全保障</h3>
              <p className="text-sm text-[#c5ae8c]">
                託管付款、分期付款機制，保障雙方權益，讓交易更安心。
              </p>
            </div>

      <div className="text-center">
              <div className="w-12 h-12 bg-[#20263e] text-white rounded-full flex items-center justify-center text-lg mx-auto mb-3">
                ⚡
              </div>
              <h3 className="text-lg font-semibold text-[#20263e] mb-2">快速簡便</h3>
              <p className="text-sm text-[#c5ae8c]">
                引導式發案流程，即使不懂技術也能清楚描述需求，快速找到合適的開發者。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Compressed */}
      <section className="py-8 px-4 bg-[#e6dfcf]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#20263e] mb-6">運作流程</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "發布案件", description: "透過引導式問答描述您的需求" },
              { step: "2", title: "收到投標", description: "專業接案工程師提交提案與報價" },
              { step: "3", title: "選擇合作", description: "比較提案，選擇最適合的開發者" },
              { step: "4", title: "完成專案", description: "追蹤進度，驗收成果，互相評價" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-10 h-10 bg-[#c5ae8c] text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2">
                  {item.step}
                </div>
                <h3 className="text-sm font-semibold text-[#20263e] mb-1">{item.title}</h3>
                <p className="text-xs text-[#20263e] leading-tight">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Compressed */}
      <section className="py-8 px-4 bg-[#20263e] text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-4">準備開始您的專案了嗎？</h2>
          <p className="text-sm mb-6 opacity-90">
            立即加入 200 OK，與優秀的接案工程師合作，實現您的軟體夢想。
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/register">
              <Button variant="secondary" size="sm">
                免費註冊
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="outline" size="sm">
                查看案件
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      </div>
  );
}
