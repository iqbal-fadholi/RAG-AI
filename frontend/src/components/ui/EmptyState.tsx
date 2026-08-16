"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  className,
  icon,
  title,
  description,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center gap-3 animate-fade-in",
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-surface-variant/40 border border-outline-variant/30 flex items-center justify-center mb-1">
          <span className="text-on-surface-variant/40">{icon}</span>
        </div>
      )}
      {title && (
        <h3 className="font-headline-md text-base font-semibold text-white">
          {title}
        </h3>
      )}
      {description && (
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
