"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = {
  error: {
    container: "bg-red-500/10 border-red-500/20 text-red-400",
    icon: <AlertCircle className="w-5 h-5 shrink-0" />,
  },
  success: {
    container: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    icon: <CheckCircle2 className="w-5 h-5 shrink-0" />,
  },
  warning: {
    container: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
    icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
  },
  info: {
    container: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    icon: <Info className="w-5 h-5 shrink-0" />,
  },
} as const;

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: keyof typeof alertVariants;
  icon?: React.ReactNode;
}

export function Alert({
  className,
  variant,
  icon,
  children,
  ...props
}: AlertProps) {
  const config = alertVariants[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl border font-body-sm text-body-sm animate-fade-in",
        config.container,
        className,
      )}
      {...props}
    >
      {icon || config.icon}
      <div className="flex-1">{children}</div>
    </div>
  );
}
