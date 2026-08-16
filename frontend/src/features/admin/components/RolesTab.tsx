"use client";

import { ShieldCheck, Plus, Lock, Trash2, Tag } from "lucide-react";
import { Role, AVAILABLE_PAGES } from "../types";

interface RolesTabProps {
  roles: Role[];
  saving: boolean;
  onOpenCreateModal: () => void;
  onToggleRolePage: (role: Role, pageId: string) => void;
  onDeleteRole: (roleId: string, roleName: string) => void;
  onOpenTagModal: (role: Role) => void;
}

export function RolesTab({
  roles,
  saving,
  onOpenCreateModal,
  onToggleRolePage,
  onDeleteRole,
  onOpenTagModal,
}: RolesTabProps) {
  return (
    <div className="space-y-6">
      {/* Header & Create Trigger */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-headline-md text-headline-md text-white">System & Custom Roles</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Control page-level RBAC routing access for each role.
          </p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="action-button-primary flex items-center gap-2 px-6 py-2 rounded-xl font-label-md text-label-md transition-opacity hover:opacity-90 cursor-pointer active:scale-95 shadow-md"
        >
          <Plus className="w-4 h-4" />
          Create Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className="glass-panel rounded-[2rem] p-6 flex flex-col justify-between space-y-6 hover:border-primary/30 transition-all shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-headline-md text-lg font-bold text-white capitalize">{role.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {role.is_system ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-label-md text-[11px]">
                      <Lock className="w-3 h-3" /> System
                    </span>
                  ) : (
                    <button
                      onClick={() => onDeleteRole(role.id, role.name)}
                      disabled={saving}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete Role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="font-body-sm text-body-sm text-on-surface-variant min-h-[32px] mt-1">
                {role.description || "No description provided."}
              </p>

              {/* Page Permissions Checklist */}
              <div className="mt-5 space-y-2">
                <p className="font-label-md text-xs font-semibold text-white uppercase tracking-wider">
                  Page-Level Access (RBAC)
                </p>
                <div className="space-y-2 pt-1">
                  {AVAILABLE_PAGES.map((page) => {
                    const isAllowed = role.pages.includes(page.id);
                    return (
                      <label
                        key={page.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isAllowed
                            ? "bg-surface-variant border-outline-variant/60 text-white"
                            : "bg-surface-container-high/40 border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60"
                        }`}
                      >
                        <div>
                          <p className="font-label-md text-sm font-medium">{page.label}</p>
                          <p className="font-body-sm text-[11px] text-on-surface-variant">{page.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isAllowed}
                          onChange={() => onToggleRolePage(role, page.id)}
                          disabled={saving}
                          className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant bg-surface"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* OBAC Tag Assignment Quick View */}
            <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-body-sm text-xs text-on-surface-variant">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span>{role.tags.length} OBAC Tags Allowed</span>
              </div>
              <button
                onClick={() => onOpenTagModal(role)}
                className="font-label-md text-xs text-primary hover:text-primary/80 font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                Edit Tag Access &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
