"use client";

import { Loader2 } from "lucide-react";
import { Alert } from "@/components/ui";
import { useAdminData } from "../hooks/useAdminData";
import { AdminTabs } from "./AdminTabs";
import { UsersTab } from "./UsersTab";
import { RolesTab } from "./RolesTab";
import { KnowledgeObacTab } from "./KnowledgeObacTab";
import { SettingsTab } from "./SettingsTab";
import { CreateRoleModal } from "./CreateRoleModal";
import { CreateUserModal } from "./CreateUserModal";
import { CreateTagModal } from "./CreateTagModal";
import { AssignTagsModal } from "./AssignTagsModal";

export function AdminDashboard() {
  const {
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
    showCreateTagModal,
    setShowCreateTagModal,
    selectedRoleForTags,
    setSelectedRoleForTags,
    handleRoleChange,
    handleDeleteUser,
    handleCreateUser,
    handleToggleRolePage,
    handleCreateRole,
    handleDeleteRole,
    handleSaveRoleTags,
    handleCreateTag,
    handleDeleteTag,
  } = useAdminData();

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Tab Navigation */}
      <AdminTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        usersCount={users.length}
        rolesCount={roles.length}
        tagsCount={tags.length}
      />

      {/* Notifications */}
      {error && <Alert variant="error">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="font-body-md text-body-md text-on-surface-variant">Loading administration data...</p>
        </div>
      ) : (
        <>
          {activeTab === "users" && (
            <UsersTab
              users={users}
              filteredUsers={filteredUsers}
              roles={roles}
              currentUserId={currentUser?.userId}
              saving={saving}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onRoleChange={handleRoleChange}
              onDeleteUser={handleDeleteUser}
              onOpenCreateModal={() => setShowCreateUserModal(true)}
            />
          )}

          {activeTab === "roles" && (
            <RolesTab
              roles={roles}
              saving={saving}
              onOpenCreateModal={() => setShowCreateRoleModal(true)}
              onToggleRolePage={handleToggleRolePage}
              onDeleteRole={handleDeleteRole}
              onOpenTagModal={setSelectedRoleForTags}
            />
          )}

          {activeTab === "tags" && (
            <KnowledgeObacTab
              roles={roles}
              tags={tags}
              saving={saving}
              onOpenTagModal={setSelectedRoleForTags}
              onOpenCreateTagModal={() => setShowCreateTagModal(true)}
              onDeleteTag={handleDeleteTag}
            />
          )}

          {activeTab === "settings" && <SettingsTab />}
        </>
      )}

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        roles={roles}
        saving={saving}
        onCreateUser={handleCreateUser}
      />

      <CreateRoleModal
        isOpen={showCreateRoleModal}
        onClose={() => setShowCreateRoleModal(false)}
        saving={saving}
        onCreateRole={handleCreateRole}
      />

      <CreateTagModal
        isOpen={showCreateTagModal}
        onClose={() => setShowCreateTagModal(false)}
        saving={saving}
        onCreateTag={handleCreateTag}
      />

      <AssignTagsModal
        role={selectedRoleForTags}
        tags={tags}
        saving={saving}
        onClose={() => setSelectedRoleForTags(null)}
        onSave={handleSaveRoleTags}
      />
    </div>
  );
}
