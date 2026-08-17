"use client";

import { useState, useEffect } from "react";
import { Tag, ShieldAlert, Plus, X, Loader2 } from "lucide-react";
import { Modal, Button } from "@/components/ui";
import { TagItem } from "@/types";
import { createTag } from "@/lib/api";

interface DocumentTagsModalProps {
  isOpen: boolean;
  docId: string | null;
  docFilename: string;
  currentTags: TagItem[];
  availableTags: TagItem[];
  saving: boolean;
  onClose: () => void;
  onSave: (docId: string, tagIds: string[]) => Promise<void>;
  onTagCreated?: (newTag: TagItem) => void;
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
  onTagCreated,
}: DocumentTagsModalProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [localTags, setLocalTags] = useState<TagItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedTagIds(currentTags.map((t) => t.id));
      setLocalTags(availableTags);
      setError(null);
      setShowAddTag(false);
      setNewTagName("");
    }
  }, [isOpen, currentTags, availableTags]);

  if (!isOpen || !docId) return null;

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTagName.trim();
    if (!trimmed) return;

    setCreatingTag(true);
    setError(null);
    try {
      const created = await createTag(trimmed);
      // Add to local list if not already present
      setLocalTags((prev) => {
        if (prev.some((t) => t.id === created.id || t.name.toLowerCase() === created.name.toLowerCase())) {
          return prev;
        }
        return [...prev, created];
      });
      // Automatically select the newly created tag
      setSelectedTagIds((prev) =>
        prev.includes(created.id) ? prev : [...prev, created.id]
      );
      onTagCreated?.(created);
      setNewTagName("");
      setShowAddTag(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      setCreatingTag(false);
    }
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
              Available Registered Tags ({localTags.length})
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-on-surface-variant font-mono">
                {selectedTagIds.length} selected
              </span>
              {!showAddTag && (
                <button
                  type="button"
                  onClick={() => setShowAddTag(true)}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-label-md transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tag</span>
                </button>
              )}
            </div>
          </div>

          {/* Inline Add Tag Form */}
          {showAddTag && (
            <form onSubmit={handleCreateTag} className="mb-3 p-3 rounded-xl bg-surface-container-high/60 border border-primary/40 flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter new tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                autoFocus
                disabled={creatingTag}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-surface border border-outline-variant/40 text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={creatingTag || !newTagName.trim()}
                className="h-[32px] px-3 text-xs"
              >
                {creatingTag ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add Tag"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setShowAddTag(false);
                  setNewTagName("");
                }}
                disabled={creatingTag}
                className="p-1.5 text-on-surface-variant hover:text-white rounded-lg hover:bg-surface-variant/60 transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          )}

          {localTags.length === 0 && !showAddTag ? (
            <div className="p-4 bg-surface-container-high/40 rounded-xl text-center border border-outline-variant/30 space-y-2">
              <p className="font-body-sm text-xs text-on-surface-variant italic">
                No registered tags found in the system.
              </p>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setShowAddTag(true)}
              >
                Create Tag
              </Button>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {localTags.map((tag) => {
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
