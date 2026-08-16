"use client";

import React from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Modal, Button } from "@/components/ui";

interface DeleteConversationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  isDeleting?: boolean;
}

export function DeleteConversationModal({
  open,
  onClose,
  onConfirm,
  title,
  isDeleting = false,
}: DeleteConversationModalProps) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="md">
      <Modal.Header onClose={onClose}>
        <div className="flex items-center gap-2 text-error">
          <Trash2 className="w-5 h-5" />
          <span>Delete Conversation</span>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-error/10 border border-error/20 text-on-surface">
            <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div className="text-body-sm space-y-1">
              <p className="font-medium text-white">This action cannot be undone.</p>
              <p className="text-on-surface-variant">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-white">
                  "{title || "this conversation"}"
                </span>
                ? All messages and citations in this session will be permanently removed.
              </p>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          loading={isDeleting}
          className="gap-1.5"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
