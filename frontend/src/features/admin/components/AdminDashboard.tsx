"use client";

import { Loader2, AlertCircle, Check } from "lucide-react";
import { useAdminData } from "../hooks/useAdminData";
import { AdminTabs } from "./AdminTabs";
import { UsersTab } from "./UsersTab";
import { RolesTab } from "./RolesTab";
import { KnowledgeObacTab } from "./KnowledgeObacTab";
import { CreateRoleModal } from "./CreateRoleModal";
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
    selectedRoleForTags,
    setSelectedRoleForTags,
    handleRoleChange,
    handleDeleteUser,
    handleToggleRolePage,
    handleCreateRole,
    handleDeleteRole,
    handleSaveRoleTags,
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
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-body-sm text-body-sm animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-body-sm text-body-sm">
          <Check className="w-5 h-5 flex-shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

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
              onDeleteTag={handleDeleteTag}
            />
          )}
        </>
      )}

      {/* Modals */}
      <CreateRoleModal
        isOpen={showCreateRoleModal}
        onClose={() => setShowCreateRoleModal(false)}
        saving={saving}
        onCreateRole={handleCreateRole}
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
