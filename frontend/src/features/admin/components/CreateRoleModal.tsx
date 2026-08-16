"use client";

import { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { AVAILABLE_PAGES } from "../types";

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  saving: boolean;
  onCreateRole: (name: string, description: string, pages: string[]) => void;
}

export function CreateRoleModal({
  isOpen,
  onClose,
  saving,
  onCreateRole,
}: CreateRoleModalProps) {
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [rolePages, setRolePages] = useState<string[]>(["chat"]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim() || rolePages.length === 0) return;
    onCreateRole(roleName, roleDesc, rolePages);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel rounded-[2rem] bg-[#1a162b] border border-outline-variant w-full max-w-md p-6 space-y-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-md text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Create New Role
          </h3>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-white text-lg p-1 rounded-lg hover:bg-surface-variant transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-label-md text-xs font-semibold text-on-surface-variant uppercase mb-1">
              Role Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. auditor, engineer, analyst"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high/60 border border-outline-variant/40 text-on-surface font-body-sm text-body-sm placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors backdrop-blur-sm"
            />
          </div>

          <div>
            <label className="block font-label-md text-xs font-semibold text-on-surface-variant uppercase mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="Brief role responsibilities..."
              value={roleDesc}
              onChange={(e) => setRoleDesc(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high/60 border border-outline-variant/40 text-on-surface font-body-sm text-body-sm placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors backdrop-blur-sm"
            />
          </div>

          <div>
            <label className="block font-label-md text-xs font-semibold text-on-surface-variant uppercase mb-2">
              Initial Page Permissions (RBAC)
            </label>
            <div className="space-y-2">
              {AVAILABLE_PAGES.map((page) => (
                <label
                  key={page.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-high/40 text-sm text-white cursor-pointer hover:border-outline-variant transition-colors"
                >
                  <span className="font-label-md text-sm">{page.label}</span>
                  <input
                    type="checkbox"
                    checked={rolePages.includes(page.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRolePages([...rolePages, page.id]);
                      } else {
                        setRolePages(rolePages.filter((p) => p !== page.id));
                      }
                    }}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant bg-surface"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
            <button
              type="button"
              onClick={onClose}
              className="action-button-secondary px-5 py-2 rounded-xl font-label-md text-label-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !roleName.trim() || rolePages.length === 0}
              className="action-button-primary px-6 py-2 rounded-xl font-label-md text-label-md transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
