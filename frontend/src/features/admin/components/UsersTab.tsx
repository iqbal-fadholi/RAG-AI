"use client";

import { Search, Trash2 } from "lucide-react";
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
}: UsersTabProps) {
  return (
    <div className="space-y-4">
      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            placeholder="Search users or roles..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-container-high/60 border border-outline-variant/40 text-on-surface font-body-sm text-body-sm placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors backdrop-blur-sm"
          />
        </div>
        <div className="text-on-surface-variant font-label-md text-label-md">
          Showing {filteredUsers.length} of {users.length} registered accounts
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-outline-variant bg-surface-container-high/30 flex justify-between items-center">
          <h2 className="font-headline-md text-headline-md text-white">Registered Users & Permissions</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-on-surface-variant font-label-md text-label-md">{users.length} Accounts</span>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-on-surface-variant font-label-md text-label-md border-b border-outline-variant">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Page Permissions</th>
                <th className="px-6 py-4 font-medium">Date Added</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-body-sm text-on-surface">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant font-body-sm">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const userRole = roles.find((r) => r.id === u.role_id);
                  const isSelf = u.id === currentUserId;

                  return (
                    <tr
                      key={u.id}
                      className="border-b border-outline-variant/30 hover:bg-surface-variant/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold font-label-md text-xs">
                            {(u.display_name || u.email).substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{u.display_name || "User"}</p>
                            <p className="text-xs text-on-surface-variant">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role_id}
                          onChange={(e) => onRoleChange(u.id, e.target.value)}
                          disabled={saving || isSelf}
                          className="bg-surface-container-high/80 border border-outline-variant/50 text-on-surface font-body-sm text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors disabled:opacity-50"
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id} className="bg-[#1e1b2e] text-on-surface">
                              {r.name} {r.is_system ? "(System)" : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {userRole?.pages.map((p) => (
                            <span
                              key={p}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-md text-[11px]"
                            >
                              /{p}
                            </span>
                          )) || <span className="text-xs text-on-surface-variant/60 font-body-sm">None</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant font-body-sm">
                        {new Date(u.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => onDeleteUser(u.id, u.email)}
                            disabled={saving || isSelf}
                            title={isSelf ? "Cannot delete yourself" : "Delete user"}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
