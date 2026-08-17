"use client";

import { useState } from "react";
import { Tag, ShieldAlert } from "lucide-react";
import { Modal, Input, Button } from "@/components/ui";

interface CreateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  saving: boolean;
  onCreateTag: (name: string) => Promise<void>;
}

export function CreateTagModal({
  isOpen,
  onClose,
  saving,
  onCreateTag,
}: CreateTagModalProps) {
  const [tagName, setTagName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = tagName.trim();
    if (!trimmed) {
      setValidationError("Tag name is required");
      return;
    }

    try {
      await onCreateTag(trimmed);
      setTagName("");
      onClose();
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : "Failed to create tag");
    }
  };

  const handleClose = () => {
    setValidationError(null);
    setTagName("");
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose} maxWidth="md">
      <Modal.Header onClose={handleClose}>
        <Tag className="w-5 h-5 text-primary" />
        Create Knowledge Tag
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body className="space-y-4">
          {validationError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-body-sm">
              {validationError}
            </div>
          )}

          <div className="p-3 rounded-xl bg-surface-container-high/40 border border-outline-variant/30 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
              Knowledge tags enable <strong>Object-Based Access Control (OBAC)</strong>. When a document is tagged with this tag, only user roles granted access to this tag can discover and retrieve its vector chunks.
            </p>
          </div>

          <Input
            label="Tag Name"
            type="text"
            required
            placeholder="e.g. finance, hr, internal, confidential"
            icon={<Tag className="w-4 h-4" />}
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            autoFocus
          />
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            icon={<Tag className="w-4 h-4" />}
            disabled={saving || !tagName.trim()}
            loading={saving}
          >
            Create Tag
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
