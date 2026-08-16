"use client";

import { useState, useEffect } from "react";
import { Tag } from "lucide-react";
import { Modal, Button } from "@/components/ui";
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
    <Modal open={!!role} onClose={onClose} maxWidth="lg">
      <Modal.Header onClose={onClose}>
        <Tag className="w-5 h-5 text-primary" />
        <span>Assign Knowledge Tags: <span className="capitalize">{role.name}</span></span>
      </Modal.Header>

      <Modal.Body className="space-y-4">
        <p className="font-body-sm text-xs text-on-surface-variant">
          Select which tags users with the <strong>{role.name}</strong> role can search and retrieve in the AI Assistant.
        </p>

        {tags.length === 0 ? (
          <p className="font-body-sm text-xs text-on-surface-variant italic p-4 bg-surface-container-high/40 rounded-xl text-center border border-outline-variant/30">
            No tags available yet. Upload documents with tags in the Ingest page first.
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {tags.map((tag) => {
              const isChecked = selectedTagIds.includes(tag.id);
              return (
                <label
                  key={tag.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
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
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save Tag Access
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
