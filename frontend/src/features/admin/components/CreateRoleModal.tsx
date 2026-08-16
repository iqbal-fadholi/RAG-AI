"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Modal, Input, Button } from "@/components/ui";
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
    <Modal open={isOpen} onClose={onClose} maxWidth="md">
      <Modal.Header onClose={onClose}>
        <ShieldCheck className="w-5 h-5 text-primary" />
        Create New Role
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body className="space-y-4">
          <Input
            label="Role Name"
            type="text"
            required
            placeholder="e.g. auditor, engineer, analyst"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
          />

          <Input
            label="Description"
            type="text"
            placeholder="Brief role responsibilities..."
            value={roleDesc}
            onChange={(e) => setRoleDesc(e.target.value)}
          />

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
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={saving || !roleName.trim() || rolePages.length === 0}
            loading={saving}
          >
            Create Role
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
