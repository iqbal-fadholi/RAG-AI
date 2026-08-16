"use client";

import { useState, useEffect } from "react";
import { Tag, Loader2 } from "lucide-react";
import { Role, TagItem } from "../types";

interface AssignTagsModalProps {
  role: Role | null;
  tags: TagItem[];
  saving: boolean;
  onClose: () => void;
  onSave: (roleId: string, tagIds: string[]) => void;
}

export function AssignTagsModal({
  role,
  tags,
  saving,
  onClose,
  onSave,
}: AssignTagsModalProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  useEffect(() => {
    if (role) {
      setSelectedTagIds(role.tags.map((t) => t.id));
    }
  }, [role]);

  if (!role) return null;

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = () => {
    onSave(role.id, selectedTagIds);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel rounded-[2rem] bg-[#1a162b] border border-outline-variant w-full max-w-lg p-6 space-y-6 shadow-2xl animate-scale-in">
        <div>
          <h3 className="font-headline-md text-lg font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Assign Knowledge Tags: <span className="capitalize">{role.name}</span>
          </h3>
          <p className="font-body-sm text-xs text-on-surface-variant mt-1">
            Select which tags users with the <strong>{role.name}</strong> role can search and retrieve in the AI Assistant.
          </p>
        </div>

        {tags.length === 0 ? (
          <p className="font-body-sm text-xs text-on-surface-variant italic p-4 bg-surface-container-high/40 rounded-xl text-center border border-outline-variant/30">
            No tags available yet. Upload documents with tags in the Ingest page first.
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {tags.map((tag) => {
              const isChecked = selectedTagIds.includes(tag.id);
              return (
                <label
                  key={tag.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isChecked
                      ? "bg-surface-variant border-outline-variant/60 text-white"
                      : "bg-surface-container-high/40 border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    <span className="font-label-md text-sm font-medium">{tag.name}</span>
                    <span className="text-[11px] text-on-surface-variant font-mono">
                      ({tag.document_count} doc{Number(tag.document_count) === 1 ? "" : "s"})
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleTag(tag.id)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant bg-surface"
                  />
                </label>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
          <button
            type="button"
            onClick={onClose}
            className="action-button-secondary px-5 py-2 rounded-xl font-label-md text-label-md transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="action-button-primary px-6 py-2 rounded-xl font-label-md text-label-md transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Tag Access"}
          </button>
        </div>
      </div>
    </div>
  );
}
