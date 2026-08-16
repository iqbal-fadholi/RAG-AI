"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  MessageSquare,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  PanelLeftClose,
  PanelLeft,
  Clock,
  Sparkles,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { Conversation } from "@/types";
import { DeleteConversationModal } from "./DeleteConversationModal";
import { Button } from "@/components/ui";

interface GroupedConversations {
  label: string;
  items: Conversation[];
}

export function ChatSidebar() {
  const router = useRouter();
  const params = useParams();
  const activeId = (params?.id as string) || null;

  const {
    conversations,
    isLoadingConversations,
    loadConversations,
    renameConversationItem,
    deleteConversationItem,
    startNewChat,
    isSidebarOpen,
    toggleSidebar,
    setIsSidebarOpen,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const editInputRef = useRef<HTMLInputElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Focus input when inline editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  // Group chronologically
  const grouped = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 7 * 86400000;

    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const pastWeek: Conversation[] = [];
    const older: Conversation[] = [];

    filteredConversations.forEach((conv) => {
      const convTime = new Date(conv.updated_at || conv.created_at).getTime();
      if (convTime >= todayStart) {
        today.push(conv);
      } else if (convTime >= yesterdayStart) {
        yesterday.push(conv);
      } else if (convTime >= weekStart) {
        pastWeek.push(conv);
      } else {
        older.push(conv);
      }
    });

    const groups: GroupedConversations[] = [];
    if (today.length > 0) groups.push({ label: "Today", items: today });
    if (yesterday.length > 0)
      groups.push({ label: "Yesterday", items: yesterday });
    if (pastWeek.length > 0)
      groups.push({ label: "Previous 7 Days", items: pastWeek });
    if (older.length > 0) groups.push({ label: "Older", items: older });

    return groups;
  }, [filteredConversations]);

  const handleStartNewChat = () => {
    startNewChat();
    router.push("/chat");
    // On small screens, close sidebar when clicking new chat
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    if (editingId) return;
    router.push(`/chat/${id}`);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleStartRename = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingId || !editTitle.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await renameConversationItem(editingId, editTitle.trim());
    } catch (err) {
      console.error(err);
    } finally {
      setEditingId(null);
    }
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleOpenDelete = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setDeleteTarget(conv);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteConversationItem(deleteTarget.id);
      if (activeId === deleteTarget.id) {
        router.push("/chat");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed top-20 left-0 bottom-0 z-40 w-72 md:w-80 glass-panel border-r border-outline-variant/60 bg-[#0e0a17]/95 backdrop-blur-2xl flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? "translate-x-0 opacity-100 shadow-2xl"
            : "-translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-outline-variant/40 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-headline-md font-semibold text-sm tracking-wide">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Chat History</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={toggleSidebar}
              title="Close sidebar"
              className="p-1.5 h-auto text-on-surface-variant hover:text-white"
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </div>

          {/* New Chat Button */}
          <Button onClick={handleStartNewChat}>
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>New Chat</span>
          </Button>

          {/* Search Box */}
          {conversations.length > 0 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white/5 border border-outline-variant/40 rounded-lg text-white placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
          {isLoadingConversations && conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-on-surface-variant">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Loading chats...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4 text-on-surface-variant/70 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto opacity-40 text-primary" />
              <p className="text-xs font-medium text-white/80">
                {searchQuery ? "No matching chats" : "No conversation history"}
              </p>
              <p className="text-[11px] leading-relaxed">
                {searchQuery
                  ? "Try searching for a different keyword."
                  : "Start a conversation to see your history saved here."}
              </p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map((conv) => {
                    const isActive = activeId === conv.id;
                    const isEditing = editingId === conv.id;

                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all duration-150 ${
                          isActive
                            ? "bg-primary/20 text-white font-medium border border-primary/40 shadow-sm"
                            : "text-on-surface-variant hover:text-white hover:bg-white/[0.06] border border-transparent"
                        }`}
                      >
                        {isEditing ? (
                          <form
                            onSubmit={handleSaveRename}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 w-full"
                          >
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              className="flex-1 bg-black/40 border border-primary text-white text-xs px-2 py-1 rounded outline-none"
                            />
                            <button
                              type="submit"
                              className="p-1 hover:text-primary transition-colors text-white"
                              title="Save title"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelRename}
                              className="p-1 hover:text-error transition-colors text-on-surface-variant"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                              <MessageSquare
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isActive
                                    ? "text-primary"
                                    : "text-on-surface-variant group-hover:text-white"
                                }`}
                              />
                              <span className="truncate" title={conv.title}>
                                {conv.title}
                              </span>
                            </div>

                            {/* Action Buttons on Hover */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                onClick={(e) => handleStartRename(e, conv)}
                                className="p-1 text-on-surface-variant hover:text-white hover:bg-white/10 rounded transition-colors"
                                title="Rename chat"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => handleOpenDelete(e, conv)}
                                className="p-1 text-on-surface-variant hover:text-error hover:bg-error/10 rounded transition-colors"
                                title="Delete chat"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Floating Toggle Button when sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-24 left-4 z-30 p-2.5 rounded-xl glass-panel bg-[#140f22]/90 border border-outline-variant/60 text-on-surface-variant hover:text-white hover:border-primary/50 shadow-lg transition-all animate-fade-in"
          title="Open chat history"
        >
          <PanelLeft className="w-4 h-4 text-primary" />
        </button>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConversationModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.title}
        isDeleting={isDeleting}
      />
    </>
  );
}
