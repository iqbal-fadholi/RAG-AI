"use client";

import React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default:
    "bg-surface-variant border-outline-variant text-on-surface",
  primary:
    "bg-primary/10 border-primary/20 text-primary",
  success:
    "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  warning:
    "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
  danger:
    "bg-red-500/10 border-red-500/20 text-red-400",
  info:
    "bg-blue-500/10 border-blue-500/20 text-blue-400",
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
  dot?: boolean;
  dotColor?: string;
  dotPulse?: boolean;
  icon?: React.ReactNode;
}

export function Badge({
  className,
  variant = "default",
  dot = false,
  dotColor,
  dotPulse = false,
  icon,
  children,
  ...props
}: BadgeProps) {
  const dotColorClass = dotColor || {
    default: "bg-on-surface-variant/50",
    primary: "bg-primary",
    success: "bg-emerald-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
    info: "bg-blue-500",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-label-md text-[11px] font-medium whitespace-nowrap",
        badgeVariants[variant],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            dotColorClass,
            dotPulse && "animate-pulse",
          )}
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
