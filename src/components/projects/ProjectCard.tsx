"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    budget_min: number;
    budget_max: number;
    status: string;
    created_at: string;
    client: {
      name: string;
      avatar_url?: string;
      rating: number | null;
    };
    tags?: Array<{
      tag: {
        name: string;
        color?: string;
      };
    }>;
    bids_count?: number;
  };
  showActions?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  showActions = true,
}) => {
  const statusVariant = {
    open: "success" as const,
    in_progress: "info" as const,
    completed: "default" as const,
    cancelled: "danger" as const,
    draft: "warning" as const,
  };

  const statusText = {
    open: "開放投標",
    in_progress: "進行中",
    completed: "已完成",
    cancelled: "已取消",
    draft: "草稿",
  };

  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card className="hover:shadow-lg transition-all cursor-pointer bg-white/40 border-2 border-[#c5ae8c] rounded-[2rem] hover:border-[#20263e] shadow-none backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="flex flex-col">
            {/* Header: Title */}
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-[#20263e] hover:text-[#2d3550] tracking-tight leading-tight" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                {project.title}
              </h3>
            </div>

            {/* Price - Moved under title */}
            <div className="mb-6">
              <span className="text-xl font-bold text-[#20263e]" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                ${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}
              </span>
            </div>

            {/* Body: Description & Tags */}
            <div className="flex-1 mb-8">
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                {project.description}
              </p>

              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.tags.slice(0, 5).map((pt, index) => (
                    <Badge key={index} variant="default" className="bg-[#e6dfcf] text-[#20263e] hover:bg-[#d6c2a3] border-none px-3 py-1">
                      {pt.tag.name}
                    </Badge>
                  ))}
                  {project.tags.length > 5 && (
                    <Badge variant="default" className="bg-[#e6dfcf] text-[#20263e] hover:bg-[#d6c2a3] border-none px-3 py-1">
                      +{project.tags.length - 5}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Footer: Client Info */}
            <div className="pt-6 border-t border-[#20263e]/10 mt-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {project.client.avatar_url ? (
                    <img
                      src={project.client.avatar_url}
                      alt={project.client.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#20263e] flex items-center justify-center text-white text-lg font-medium">
                      {project.client.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-[#20263e]">
                      {project.client.name}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      ⭐ {project.client.rating !== null ? project.client.rating.toFixed(1) : "N/A"} · {project.bids_count || 0} 個投標
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {formatRelativeTime(project.created_at)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

