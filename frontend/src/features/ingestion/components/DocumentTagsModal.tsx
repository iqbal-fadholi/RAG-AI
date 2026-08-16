"use client";

import { useState, useEffect } from "react";
import { Tag, ShieldAlert } from "lucide-react";
import { Modal, Button, Badge } from "@/components/ui";
import { TagItem } from "@/types";

interface DocumentTagsModalProps {
  isOpen: boolean;
  docId: string | null;
  docFilename: string;
  currentTags: TagItem[];
  availableTags: TagItem[];
  saving: boolean;
  onClose: () => void;
  onSave: (docId: string, tagIds: string[]) => Promise<void>;
}

export function DocumentTagsModal({
  isOpen,
  docId,
  docFilename,
  currentTags,
  availableTags,
  saving,
  onClose,
  onSave,
}: DocumentTagsModalProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedTagIds(currentTags.map((t) => t.id));
      setError(null);
    }
  }, [isOpen, currentTags]);

  if (!isOpen || !docId) return null;

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = async () => {
    setError(null);
    try {
      await onSave(docId, selectedTagIds);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update tags");
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} maxWidth="md">
      <Modal.Header onClose={onClose}>
        <Tag className="w-5 h-5 text-primary" />
        <span>Manage Tags for OBAC: <span className="text-white font-medium truncate max-w-[200px] inline-block align-bottom">{docFilename}</span></span>
      </Modal.Header>

      <Modal.Body className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-body-sm">
            {error}
          </div>
        )}

        <div className="p-3 rounded-xl bg-surface-container-high/40 border border-outline-variant/30 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
            Tagged documents can only be retrieved by user roles with corresponding tag permissions in Object-Based Access Control (OBAC). If no tags are selected, the document is <strong>Public</strong> to all authenticated users.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              Available Registered Tags ({availableTags.length})
            </label>
            <span className="text-xs text-on-surface-variant font-mono">
              {selectedTagIds.length} selected
            </span>
          </div>

          {availableTags.length === 0 ? (
            <p className="font-body-sm text-xs text-on-surface-variant italic p-4 bg-surface-container-high/40 rounded-xl text-center border border-outline-variant/30">
              No registered tags found in the system. An administrator can register tags in the Admin OBAC page.
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {availableTags.map((tag) => {
                const isChecked = selectedTagIds.includes(tag.id);
                return (
                  <label
                    key={tag.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isChecked
                        ? "bg-surface-variant border-outline-variant/60 text-white shadow-sm"
                        : "bg-surface-container-high/40 border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary" />
                      <span className="font-label-md text-sm font-medium">{tag.name}</span>
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
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save Document Tags
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
