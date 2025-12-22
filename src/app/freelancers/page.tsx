"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FreelancerCard } from "@/components/freelancers/FreelancerCard";
import { Button } from "@/components/ui/Button";
import { apiGet } from "@/lib/api";

interface Freelancer {
  id: string;
  name: string;
  email?: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  rating: number | null;
  portfolio_links?: string[];
  hourly_rate?: number | null;
  created_at: string;
  _count?: {
    bids: number;
    projects_created: number;
    completed_projects: number;
  };
  bids_count?: number;
  completed_projects_count?: number;
}

export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [popularSkills, setPopularSkills] = useState<string[]>([]);
  const [columns, setColumns] = useState<Freelancer[][]>([[], [], []]);

  useEffect(() => {
    fetchFreelancers();
  }, [selectedSkill]);

  useEffect(() => {
    fetchPopularSkills();
  }, []);

  // Filter Logic (Client-side for now, as per original implementation)
  const filteredFreelancers = freelancers.filter((freelancer) =>
    freelancer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    freelancer.skills?.some((skill) =>
      skill.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Masonry Layout Logic
  useEffect(() => {
    const distributeMasonry = () => {
        if (filteredFreelancers.length === 0) {
            setColumns([[], [], []]);
            return;
        }
        
        // Determine number of columns based on window width
        const numColumns = typeof window !== 'undefined' 
            ? window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1
            : 3;
            
        const newColumns: Freelancer[][] = Array.from({ length: numColumns }, () => []);
        
        // Distribute items to the shortest column
        filteredFreelancers.forEach((freelancer) => {
            const shortestColumnIndex = newColumns.reduce((minIndex, column, index) => 
                column.length < newColumns[minIndex].length ? index : minIndex, 0
            );
            newColumns[shortestColumnIndex].push(freelancer);
        });
        
        setColumns(newColumns);
    };

    distributeMasonry();
    window.addEventListener('resize', distributeMasonry);
    return () => window.removeEventListener('resize', distributeMasonry);
  }, [freelancers, searchTerm, selectedSkill]); // Re-run when data or filter changes

  const fetchPopularSkills = async () => {
    try {
      const data = await apiGet("/api/v1/tags", { category: "tech", limit: "12" });
      const skills = data.data?.map((tag: any) => tag.name) || [];
      setPopularSkills(skills);
    } catch (error) {
      console.error("Failed to fetch popular skills:", error);
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
      const params: Record<string, string> = { limit: "50" }; // Increased limit for better masonry demo
      if (selectedSkill) {
        params["skills[]"] = selectedSkill;
      }

      const data = await apiGet("/api/v1/users/search", params);
      setFreelancers(data.data || []);
    } catch (error) {
      console.error("Failed to fetch freelancers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e6dfcf]">
      <Navbar />

      <main className="flex-1 w-full pt-32 pb-16 px-8 md:px-16 lg:px-40 xl:px-40 2xl:px-40">
        
        {/* Header & Filter Section */}
        <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#20263e] mb-6 tracking-tight">
              尋找專業接案工程師
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              在這裡找到最適合您專案的專業人才
            </p>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto mb-8 relative">
                <input
                    type="text"
                    placeholder="搜尋接案者姓名、技能..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-8 py-5 text-lg rounded-full shadow-lg border-none focus:outline-none focus:ring-4 focus:ring-[#c5ae8c]/50 transition bg-white text-[#20263e] placeholder:text-gray-400"
                />
                <div className="absolute top-1/2 -translate-y-1/2 right-3">
                    <button 
                        onClick={fetchFreelancers}
                        className="bg-[#20263e] text-white rounded-full p-3 hover:bg-[#2d3550] transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Popular Skills Filter */}
            <div className="flex flex-wrap justify-center gap-3">
                <button
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                        selectedSkill === null 
                        ? "bg-[#20263e] text-white shadow-lg transform scale-105" 
                        : "bg-white text-[#20263e] hover:bg-[#20263e]/10 border border-transparent"
                        }`}
                        onClick={() => setSelectedSkill(null)}
                >
                    全部
                </button>
                {popularSkills.map((skill) => (
                    <button
                    key={skill}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                        selectedSkill === skill
                        ? "bg-[#20263e] text-white shadow-lg transform scale-105"
                        : "bg-white text-[#20263e] hover:bg-[#20263e]/10 border border-transparent"
                    }`}
                    onClick={() => setSelectedSkill(skill)}
                    >
                    {skill}
                    </button>
                ))}
            </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#20263e]"></div>
            <p className="mt-4 text-[#20263e] font-semibold">載入中...</p>
          </div>
        )}

        {/* Grid Layout (Replaced Masonry) */}
        {!loading && filteredFreelancers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[200px]">
            {filteredFreelancers.map((freelancer) => (
              <div key={freelancer.id} className="h-full">
                <FreelancerCard freelancer={freelancer} />
              </div>
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
          <div className="mt-20 bg-[#20263e] rounded-[2.5rem] p-12 text-center text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-[100px]"></div>
                <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-[#c5ae8c] rounded-full blur-[120px]"></div>
            </div>
            
            <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-4 text-white">
                找到您需要的專業人才了嗎？
                </h2>
                <p className="text-xl text-white/90 mb-8">
                立即發布案件，讓更多接案者為您服務
                </p>
                <Link href="/projects/new">
                <Button className="bg-[#c5ae8c] hover:bg-[#b89d7a] text-[#20263e] px-8 py-3 text-lg font-semibold rounded-full">
                    免費發布案件
                </Button>
                </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
