"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent>
        <div className="flex justify-between items-start mb-3">
          <Link href={`/projects/${project.id}`}>
            <h3 className="text-lg font-semibold text-[#20263e] hover:text-[#2d3550] cursor-pointer">
              {project.title}
            </h3>
          </Link>
          <Badge variant={statusVariant[project.status as keyof typeof statusVariant]}>
            {statusText[project.status as keyof typeof statusText]}
          </Badge>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg font-bold text-[#20263e]">
            ${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}
          </span>
        </div>

        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.slice(0, 5).map((pt, index) => (
              <Badge key={index} variant="default" size="sm">
                {pt.tag.name}
              </Badge>
            ))}
            {project.tags.length > 5 && (
              <Badge variant="default" size="sm">
                +{project.tags.length - 5}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {project.client.avatar_url ? (
              <img
                src={project.client.avatar_url}
                alt={project.client.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#c5ae8c] flex items-center justify-center text-white">
                {project.client.name[0]}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {project.client.name}
              </p>
              <p className="text-xs text-gray-500">
                ⭐ {project.client.rating !== null ? project.client.rating.toFixed(1) : "N/A"} · {project.bids_count || 0} 個投標
              </p>
            </div>
          </div>

          {showActions && (
            <Link href={`/projects/${project.id}`}>
              <Button size="sm">查看詳情</Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

