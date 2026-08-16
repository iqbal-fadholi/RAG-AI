"use client";

import { Users, ShieldCheck, Tag } from "lucide-react";
import { Tabs } from "@/components/ui";
import { AdminTab } from "../types";
import type { TabItem } from "@/components/ui";

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
  const items: TabItem[] = [
    {
      id: "users",
      label: "Users",
      icon: <Users className="w-4 h-4" />,
      count: usersCount,
    },
    {
      id: "roles",
      label: "Roles & RBAC",
      icon: <ShieldCheck className="w-4 h-4" />,
      count: rolesCount,
    },
    {
      id: "tags",
      label: "Knowledge OBAC",
      icon: <Tag className="w-4 h-4" />,
      count: tagsCount,
    },
  ];

  return (
    <Tabs
      items={items}
      activeId={activeTab}
      onChange={(id) => onTabChange(id as AdminTab)}
    />
  );
}
