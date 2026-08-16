"use client";

import { Trash2, UserPlus } from "lucide-react";
import { Card, DataTable, SearchInput, Badge, Button } from "@/components/ui";
import { User, Role } from "../types";

interface UsersTabProps {
  users: User[];
  filteredUsers: User[];
  roles: Role[];
  currentUserId?: string;
  saving: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRoleChange: (userId: string, newRoleId: string) => void;
  onDeleteUser: (userId: string, email: string) => void;
  onOpenCreateModal?: () => void;
}

export function UsersTab({
  users,
  filteredUsers,
  roles,
  currentUserId,
  saving,
  searchQuery,
  onSearchChange,
  onRoleChange,
  onDeleteUser,
  onOpenCreateModal,
}: UsersTabProps) {
  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <SearchInput
            className="w-full sm:w-72"
            placeholder="Search users or roles..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange("")}
          />
          <div className="text-on-surface-variant font-label-md text-label-md">
            Showing {filteredUsers.length} of {users.length} registered accounts
          </div>
        </div>

        {onOpenCreateModal && (
          <Button
            variant="primary"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={onOpenCreateModal}
            className="shadow-md shrink-0"
          >
            Add User
          </Button>
        )}
      </div>

      {/* Users Table */}
      <Card className="shadow-2xl">
        <Card.Header>
          <h2 className="font-headline-md text-headline-md text-white">Registered Users & Permissions</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-on-surface-variant font-label-md text-label-md">{users.length} Accounts</span>
          </div>
        </Card.Header>
        <Card.Body className="p-4">
          <DataTable>
            <DataTable.Head>
              <tr>
                <DataTable.Header>User</DataTable.Header>
                <DataTable.Header>Role</DataTable.Header>
                <DataTable.Header>Page Permissions</DataTable.Header>
                <DataTable.Header>Date Added</DataTable.Header>
                <DataTable.Header className="text-right">Actions</DataTable.Header>
              </tr>
            </DataTable.Head>
            <DataTable.Body>
              {filteredUsers.length === 0 ? (
                <DataTable.Empty colSpan={5} message="No users found matching your search." />
              ) : (
                filteredUsers.map((u) => {
                  const userRole = roles.find((r) => r.id === u.role_id);
                  const isSelf = u.id === currentUserId;

                  return (
                    <DataTable.Row key={u.id}>
                      <DataTable.Cell className="font-medium text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold font-label-md text-xs">
                            {(u.display_name || u.email).substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{u.display_name || "User"}</p>
                            <p className="text-xs text-on-surface-variant">{u.email}</p>
                          </div>
                        </div>
                      </DataTable.Cell>
                      <DataTable.Cell>
                        <select
                          value={u.role_id}
                          onChange={(e) => onRoleChange(u.id, e.target.value)}
                          disabled={saving || isSelf}
                          className="bg-surface-container-high/80 border border-outline-variant/40 text-on-surface font-body-sm text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id} className="bg-[#1e1b2e] text-on-surface">
                              {r.name} {r.is_system ? "(System)" : ""}
                            </option>
                          ))}
                        </select>
                      </DataTable.Cell>
                      <DataTable.Cell>
                        <div className="flex flex-wrap gap-1.5">
                          {userRole?.pages.map((p) => (
                            <Badge key={p} variant="primary">/{p}</Badge>
                          )) || <span className="text-xs text-on-surface-variant/60 font-body-sm">None</span>}
                        </div>
                      </DataTable.Cell>
                      <DataTable.Cell className="text-on-surface-variant font-body-sm">
                        {new Date(u.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </DataTable.Cell>
                      <DataTable.Cell className="text-right">
                        <div className="flex items-center justify-end">
                          <Button
                            variant="ghost"
                            iconOnly
                            icon={<Trash2 className="w-4 h-4" />}
                            onClick={() => onDeleteUser(u.id, u.email)}
                            disabled={saving || isSelf}
                            title={isSelf ? "Cannot delete yourself" : "Delete user"}
                            className="hover:text-red-400 hover:bg-red-500/10"
                          />
                        </div>
                      </DataTable.Cell>
                    </DataTable.Row>
                  );
                })
              )}
            </DataTable.Body>
          </DataTable>
        </Card.Body>
      </Card>
    </div>
  );
}
