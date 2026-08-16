"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, activeId, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex items-center justify-center w-full", className)}>
      <div className="flex items-center gap-1.5 bg-surface-container-high/60 border border-outline-variant/30 p-1.5 rounded-xl backdrop-blur-sm">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                "px-4 py-2 rounded-lg font-label-md text-label-md transition-all duration-200 flex items-center gap-2 cursor-pointer",
                isActive
                  ? "bg-surface-variant text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-white/5",
              )}
            >
              {item.icon}
              {item.label}
              {item.count !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
