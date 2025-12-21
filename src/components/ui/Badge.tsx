import React from "react";
import { clsx } from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "khaki";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  className,
  onClick,
}) => {
  const baseStyles = "inline-flex items-center font-medium rounded-full transition-colors";

  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    khaki: "bg-[#e6dfcf] text-[#20263e] hover:bg-[#d6c2a3]",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-sm",
    lg: "px-3 py-1 text-base",
  };

  return (
    <span
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      {children}
    </span>
  );
};

