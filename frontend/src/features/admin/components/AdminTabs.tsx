"use client";

import { Users, ShieldCheck, Tag } from "lucide-react";
import { AdminTab } from "../types";

interface AdminTabsProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  usersCount: number;
  rolesCount: number;
  tagsCount: number;
}

export function AdminTabs({
  activeTab,
  onTabChange,
  usersCount,
  rolesCount,
  tagsCount,
}: AdminTabsProps) {
  return (
    <div className="flex items-center justify-center w-full">
      <div className="flex items-center gap-1.5 bg-surface-container-high/60 border border-outline-variant/30 p-1.5 rounded-xl backdrop-blur-sm">
        <button
          onClick={() => onTabChange("users")}
          className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === "users"
              ? "bg-surface-variant text-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Users className="w-4 h-4" />
          Users
          <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
            {usersCount}
          </span>
        </button>
        <button
          onClick={() => onTabChange("roles")}
          className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === "roles"
              ? "bg-surface-variant text-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Roles & RBAC
          <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
            {rolesCount}
          </span>
        </button>
        <button
          onClick={() => onTabChange("tags")}
          className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === "tags"
              ? "bg-surface-variant text-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Tag className="w-4 h-4" />
          Knowledge OBAC
          <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
            {tagsCount}
          </span>
        </button>
      </div>
    </div>
  );
}
