"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Role, User, TagItem, AdminTab } from "../types";

export function useAdminData() {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [selectedRoleForTags, setSelectedRoleForTags] = useState<Role | null>(null);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, rolesData, tagsData] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getRoles(),
        adminApi.getTags(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setTags(tagsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ===== USER ACTIONS =====
  const handleRoleChange = async (userId: string, newRoleId: string) => {
    setSaving(true);
    setError(null);
    try {
      await adminApi.updateUserRole(userId, newRoleId);
      showNotification("User role updated successfully");
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update user role");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (userId === currentUser?.userId) {
      alert("You cannot delete your own active admin account.");
      return;
    }
    if (!confirm(`Are you sure you want to delete user ${email}?`)) return;

    setSaving(true);
    try {
      await adminApi.deleteUser(userId);
      showNotification(`User ${email} deleted`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (data: {
    email: string;
    password: string;
    displayName: string;
    roleId: string;
  }) => {
    setSaving(true);
    setError(null);
    try {
      await adminApi.createUser(data);
      showNotification(`User ${data.displayName} created successfully`);
      await loadData();
    } catch (err: unknown) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // ===== ROLE ACTIONS =====
  const handleToggleRolePage = async (role: Role, pageId: string) => {
    const updatedPages = role.pages.includes(pageId)
      ? role.pages.filter((p) => p !== pageId)
      : [...role.pages, pageId];

    if (updatedPages.length === 0) {
      alert("A role must have at least one page permission.");
      return;
    }

    setSaving(true);
    try {
      await adminApi.updateRole(role.id, { pages: updatedPages });
      showNotification(`Updated permissions for ${role.name}`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update role permissions");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async (name: string, description: string, pages: string[]) => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      await adminApi.createRole({
        name: name.trim(),
        description: description.trim() || undefined,
        pages,
      });
      setShowCreateRoleModal(false);
      showNotification(`Role "${name}" created successfully`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create role");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the "${roleName}" role?`)) return;

    setSaving(true);
    try {
      await adminApi.deleteRole(roleId);
      showNotification(`Role "${roleName}" deleted`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete role");
    } finally {
      setSaving(false);
    }
  };

  // ===== OBAC TAG ACTIONS =====
  const handleSaveRoleTags = async (roleId: string, tagIds: string[]) => {
    setSaving(true);
    try {
      await adminApi.assignRoleTags(roleId, tagIds);
      const role = roles.find((r) => r.id === roleId);
      setSelectedRoleForTags(null);
      showNotification(`Updated knowledge tags for ${role?.name || "role"}`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update role tags");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!confirm(`Are you sure you want to delete tag "${tagName}"? It will be removed from all documents and roles.`)) return;

    setSaving(true);
    try {
      await adminApi.deleteTag(tagId);
      showNotification(`Tag "${tagName}" deleted`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete tag");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.display_name && u.display_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.role_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    currentUser,
    activeTab,
    setActiveTab,
    users,
    filteredUsers,
    roles,
    tags,
    loading,
    saving,
    error,
    successMsg,
    searchQuery,
    setSearchQuery,
    showCreateRoleModal,
    setShowCreateRoleModal,
    showCreateUserModal,
    setShowCreateUserModal,
    selectedRoleForTags,
    setSelectedRoleForTags,
    handleRoleChange,
    handleDeleteUser,
    handleCreateUser,
    handleToggleRolePage,
    handleCreateRole,
    handleDeleteRole,
    handleSaveRoleTags,
    handleDeleteTag,
  };
}
