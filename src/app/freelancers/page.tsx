"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Freelancer {
  id: string;
  name: string;
  email?: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  rating: number;
  portfolio_links?: string[];
  hourly_rate?: number | null;
  created_at: string;
}

export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [popularSkills, setPopularSkills] = useState<string[]>([]);

  useEffect(() => {
    fetchFreelancers();
  }, [selectedSkill]);

  useEffect(() => {
    fetchPopularSkills();
  }, []);

  const fetchPopularSkills = async () => {
    try {
      const response = await fetch("/api/v1/tags?category=tech&limit=12");
      if (response.ok) {
        const data = await response.json();
        const skills = data.data?.map((tag: any) => tag.name) || [];
        setPopularSkills(skills);
      } else {
        // 如果 API 還沒準備好，使用預設技能
        setPopularSkills([
          "React",
          "Vue",
          "Next.js",
          "TypeScript",
          "Node.js",
          "Python",
          "UI/UX",
          "Figma",
          "PostgreSQL",
          "AWS",
          "Docker",
          "Git",
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch popular skills:", error);
      // 使用預設技能作為後備
      setPopularSkills([
        "React",
        "Vue",
        "Next.js",
        "TypeScript",
        "Node.js",
        "Python",
        "UI/UX",
        "Figma",
        "PostgreSQL",
        "AWS",
        "Docker",
        "Git",
      ]);
    }
  };

  const fetchFreelancers = async () => {
    setLoading(true);
    try {
      let url = "/api/v1/users/search?limit=12";
      if (selectedSkill) {
        url += `&skills[]=${encodeURIComponent(selectedSkill)}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // API 回應格式: { success: true, data: [...], pagination: {...} }
        setFreelancers(data.data || []);
      } else {
        console.error("Failed to fetch freelancers:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch freelancers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFreelancers = freelancers.filter((freelancer) =>
    freelancer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    freelancer.skills?.some((skill) =>
      skill.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#e6dfcf]">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-[#20263e] text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            尋找專業接案者
          </h1>
          <p className="text-xl text-[#c5ae8c] mb-8 max-w-2xl">
            在這裡找到最適合您專案的專業人才
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="搜尋接案者姓名、技能..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-6 py-4 rounded-lg text-[#20263e] text-lg focus:outline-none focus:ring-2 focus:ring-[#c5ae8c] bg-white"
              />
              <Button
                onClick={fetchFreelancers}
                className="px-8 py-4 bg-[#c5ae8c] hover:bg-[#b89d7a] text-[#20263e] font-semibold"
              >
                搜尋
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 flex-1">
        {/* Skill Filter */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[#20263e] mb-4">
            熱門技能標籤篩選
          </h3>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="default"
              className={`cursor-pointer px-4 py-2 font-semibold ${
                selectedSkill === null
                  ? "bg-[#20263e] text-white"
                  : "bg-white text-[#20263e] border-2 border-[#c5ae8c] hover:border-[#20263e]"
              }`}
              onClick={() => setSelectedSkill(null)}
            >
              全部
            </Badge>
            {popularSkills.map((skill) => (
              <Badge
                key={skill}
                variant="default"
                className={`cursor-pointer px-4 py-2 font-semibold transition ${
                  selectedSkill === skill
                    ? "bg-[#20263e] text-white"
                    : "bg-white text-[#20263e] border-2 border-[#c5ae8c] hover:border-[#20263e]"
                }`}
                onClick={() => setSelectedSkill(skill)}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <p className="text-[#20263e] font-semibold">
            找到 <span className="text-[#c5ae8c] text-xl">{filteredFreelancers.length}</span> 位接案者
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#20263e]"></div>
            <p className="mt-4 text-[#20263e] font-semibold">載入中...</p>
          </div>
        )}

        {/* Freelancers Grid */}
        {!loading && filteredFreelancers.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFreelancers.map((freelancer) => (
              <Card
                key={freelancer.id}
                className="p-6 hover:shadow-xl transition-all bg-white border-2 border-[#c5ae8c] hover:border-[#20263e]"
              >
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {freelancer.avatar_url ? (
                      <img
                        src={freelancer.avatar_url}
                        alt={freelancer.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#c5ae8c]"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#20263e] flex items-center justify-center text-white text-xl font-bold border-2 border-[#c5ae8c]">
                        {freelancer.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-[#20263e] truncate">
                      {freelancer.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center mt-1 mb-2">
                      <div className="flex items-center">
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
                    </div>

                    {/* Bio */}
                    {freelancer.bio && (
                      <p className="text-sm text-[#20263e] line-clamp-2 mb-3">
                        {freelancer.bio}
                      </p>
                    )}

                    {/* Skills */}
                    {freelancer.skills && freelancer.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {freelancer.skills.slice(0, 3).map((skill, index) => (
                          <Badge
                            key={index}
                            variant="default"
                            className="text-xs bg-[#e6dfcf] text-[#20263e] border border-[#c5ae8c]"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {freelancer.skills.length > 3 && (
                          <Badge
                            variant="default"
                            className="text-xs bg-[#e6dfcf] text-[#20263e] border border-[#c5ae8c]"
                          >
                            +{freelancer.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Hourly Rate */}
                    {freelancer.hourly_rate && (
                      <p className="text-sm font-semibold text-[#20263e] mb-3">
                        時薪：<span className="text-[#c5ae8c]">${freelancer.hourly_rate}</span> / 小時
                      </p>
                    )}

                    {/* Action Button */}
                    <Link href={`/freelancers/${freelancer.id}`}>
                      <Button className="w-full py-2 text-sm bg-[#20263e] hover:bg-[#2d3550] text-white font-semibold">
                        查看個人檔案
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredFreelancers.length === 0 && (
          <div className="text-center py-20">
            <svg
              className="mx-auto h-16 w-16 text-[#c5ae8c] mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-[#20263e] mb-2">
              找不到符合的接案者
            </h3>
            <p className="text-[#c5ae8c]">
              請嘗試調整搜尋條件或瀏覽其他技能類別
            </p>
          </div>
        )}

        {/* CTA Section */}
        {!loading && filteredFreelancers.length > 0 && (
          <div className="mt-16 bg-[#20263e] rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              找到您需要的專業人才了嗎？
            </h2>
            <p className="text-xl text-[#c5ae8c] mb-8">
              立即發布案件，讓更多接案者為您服務
            </p>
            <Link href="/projects/new">
              <Button className="bg-[#c5ae8c] hover:bg-[#b89d7a] text-[#20263e] px-8 py-3 text-lg font-semibold">
                免費發布案件
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
