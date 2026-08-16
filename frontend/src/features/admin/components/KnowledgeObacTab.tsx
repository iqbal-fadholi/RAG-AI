"use client";

import { Layers, Tag, FileText, Trash2 } from "lucide-react";
import { Card, Badge, Button, EmptyState } from "@/components/ui";
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
      <Card className="shadow-2xl">
        <Card.Header>
          <h3 className="font-headline-md text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Role-to-Tag Access Mapping
          </h3>
        </Card.Header>

        <Card.Body>
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
                      <Badge variant="success">Full Access (*)</Badge>
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
                        <Badge key={t.id} variant="primary" icon={<Tag className="w-3 h-3" />}>
                          {t.name}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs text-on-surface-variant/60 italic font-body-sm">
                        Only untagged (public) documents accessible.
                      </p>
                    )}
                  </div>
                </div>

                {role.name !== "admin" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenTagModal(role)}
                    className="w-full text-center"
                  >
                    Configure Allowed Tags
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* All Registered Tags List */}
      <Card className="shadow-2xl">
        <Card.Header>
          <h3 className="font-headline-md text-base font-bold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            All Ingestion Tags ({tags.length})
          </h3>
        </Card.Header>

        <Card.Body>
          {tags.length === 0 ? (
            <EmptyState
              icon={<Tag className="w-8 h-8" />}
              title="No tags yet"
              description="Tags are automatically created when documents are uploaded with tags during ingestion."
            />
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
                  <Button
                    variant="ghost"
                    iconOnly
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => onDeleteTag(t.id, t.name)}
                    disabled={saving}
                    title="Delete Tag"
                    className="hover:text-red-400 hover:bg-red-500/10"
                  />
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
