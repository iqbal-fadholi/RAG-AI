"use client";

import { useState } from "react";
import { UserPlus, Mail, Lock, User as UserIcon, ShieldCheck } from "lucide-react";
import { Modal, Input, Button } from "@/components/ui";
import { Role } from "../types";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: Role[];
  saving: boolean;
  onCreateUser: (data: {
    email: string;
    password: string;
    displayName: string;
    roleId: string;
  }) => Promise<void>;
}

export function CreateUserModal({
  isOpen,
  onClose,
  roles,
  saving,
  onCreateUser,
}: CreateUserModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Set default role when opened
  const effectiveRoleId = roleId || (roles.length > 0 ? (roles.find(r => r.name === 'viewer')?.id || roles[0].id) : "");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!displayName.trim()) {
      setValidationError("Display name is required");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setValidationError("A valid email address is required");
      return;
    }
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return;
    }
    if (!effectiveRoleId) {
      setValidationError("Please select a role for the new user");
      return;
    }

    try {
      await onCreateUser({
        displayName: displayName.trim(),
        email: email.toLowerCase().trim(),
        password,
        roleId: effectiveRoleId,
      });
      // Reset form
      setDisplayName("");
      setEmail("");
      setPassword("");
      setRoleId("");
      onClose();
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : "Failed to create user");
    }
  };

  const handleClose = () => {
    setValidationError(null);
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose} maxWidth="md">
      <Modal.Header onClose={handleClose}>
        <UserPlus className="w-5 h-5 text-primary" />
        Add New User
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body className="space-y-4">
          {validationError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-body-sm">
              {validationError}
            </div>
          )}

          <Input
            label="Display Name"
            type="text"
            required
            placeholder="e.g. Jane Doe"
            icon={<UserIcon className="w-4 h-4" />}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="e.g. jane@company.com"
            icon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            required
            placeholder="Minimum 6 characters"
            icon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div>
            <label className="block font-label-md text-xs font-semibold text-on-surface-variant uppercase mb-1.5 tracking-wide">
              Assigned Role
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <select
                value={effectiveRoleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full rounded-xl bg-surface-container-high/60 border border-outline-variant/40 text-on-surface font-body-sm text-sm pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all backdrop-blur-sm"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#1e1b2e] text-on-surface">
                    {r.name} {r.is_system ? "(System Role)" : ""} - {r.pages.join(", ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            icon={<UserPlus className="w-4 h-4" />}
            disabled={saving || !displayName.trim() || !email.trim() || password.length < 6}
            loading={saving}
          >
            Create User
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
