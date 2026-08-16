"use client";

import { Layers, Tag, FileText, Trash2 } from "lucide-react";
import { Role, TagItem } from "../types";

interface KnowledgeObacTabProps {
  roles: Role[];
  tags: TagItem[];
  saving: boolean;
  onOpenTagModal: (role: Role) => void;
  onDeleteTag: (tagId: string, tagName: string) => void;
}

export function KnowledgeObacTab({
  roles,
  tags,
  saving,
  onOpenTagModal,
  onDeleteTag,
}: KnowledgeObacTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline-md text-headline-md text-white">Object-Based Access Control (OBAC)</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Documents tagged during ingestion can only be retrieved by roles permitted to access those tags. Untagged documents are public to all authenticated users.
        </p>
      </div>

      {/* Roles Tag Matrix */}
      <div className="glass-panel rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-outline-variant bg-surface-container-high/30 flex justify-between items-center">
          <h3 className="font-headline-md text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Role-to-Tag Access Mapping
          </h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="p-5 rounded-2xl bg-surface-container-high/40 border border-outline-variant/40 flex flex-col justify-between space-y-4 hover:border-outline-variant transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm capitalize font-headline-md">{role.name}</span>
                    {role.name === "admin" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-label-md text-[11px]">
                        Full Access (*)
                      </span>
                    ) : (
                      <span className="text-xs text-on-surface-variant font-mono">
                        {role.tags.length} tags
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 min-h-[48px]">
                    {role.name === "admin" ? (
                      <p className="text-xs text-emerald-400/80 italic font-body-sm">
                        Admin bypasses OBAC and accesses all tagged & untagged documents.
                      </p>
                    ) : role.tags.length > 0 ? (
                      role.tags.map((t) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-md text-[11px]"
                        >
                          <Tag className="w-3 h-3" />
                          {t.name}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-on-surface-variant/60 italic font-body-sm">
                        Only untagged (public) documents accessible.
                      </p>
                    )}
                  </div>
                </div>

                {role.name !== "admin" && (
                  <button
                    onClick={() => onOpenTagModal(role)}
                    className="w-full py-2 px-3 rounded-xl action-button-secondary font-label-md text-xs font-medium text-center transition-colors cursor-pointer"
                  >
                    Configure Allowed Tags
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Registered Tags List */}
      <div className="glass-panel rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-outline-variant bg-surface-container-high/30 flex justify-between items-center">
          <h3 className="font-headline-md text-base font-bold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            All Ingestion Tags ({tags.length})
          </h3>
        </div>

        <div className="p-6">
          {tags.length === 0 ? (
            <p className="text-xs text-on-surface-variant italic font-body-sm">
              No tags created yet. Tags are automatically created when documents are uploaded with tags during ingestion.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {tags.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-surface-container-high/40 border border-outline-variant/40 flex items-center justify-between gap-3 hover:border-outline-variant transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-label-md text-sm font-medium text-white truncate flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      {t.name}
                    </p>
                    <p className="font-body-sm text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <FileText className="w-3 h-3" />
                      {t.document_count} doc{Number(t.document_count) === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteTag(t.id, t.name)}
                    disabled={saving}
                    className="p-1.5 text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Delete Tag"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
