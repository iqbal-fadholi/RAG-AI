import { create } from 'zustand';
import { ChatMessage, Conversation } from '@/types';
import {
  fetchConversations,
  fetchConversationDetails,
  updateConversationTitle,
  deleteConversationApi,
} from '@/lib/api';

interface ChatState {
  messages: ChatMessage[];
  input: string;
  threadId: string | null;
  isStreaming: boolean;
  
  // Sidebar & History State
  conversations: Conversation[];
  isLoadingConversations: boolean;
  isLoadingHistory: boolean;
  isSidebarOpen: boolean;
  
  // Basic Setters
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  setInput: (input: string) => void;
  setThreadId: (id: string | null) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  
  // Async History Actions
  loadConversations: () => Promise<void>;
  loadConversationById: (id: string) => Promise<boolean>;
  renameConversationItem: (id: string, newTitle: string) => Promise<void>;
  deleteConversationItem: (id: string) => Promise<void>;
  startNewChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  input: "",
  threadId: null,
  isStreaming: false,
  conversations: [],
  isLoadingConversations: false,
  isLoadingHistory: false,
  isSidebarOpen: true,
  
  setMessages: (updater) => set((state) => ({
    messages: typeof updater === 'function' ? updater(state.messages) : updater
  })),
  setInput: (input) => set({ input }),
  setThreadId: (threadId) => set({ threadId }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  loadConversations: async () => {
    try {
      set({ isLoadingConversations: true });
      const list = await fetchConversations();
      set({ conversations: list });
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  loadConversationById: async (id: string): Promise<boolean> => {
    try {
      set({ isLoadingHistory: true });
      const details = await fetchConversationDetails(id);
      if (!details || !details.conversation) {
        return false;
      }
      
      const formattedMessages: ChatMessage[] = details.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sources: m.sources,
        createdAt: m.created_at,
      }));

      set({
        threadId: id,
        messages: formattedMessages,
        input: "",
      });
      return true;
    } catch (error) {
      console.error(`Failed to load conversation ${id}:`, error);
      return false;
    } finally {
      set({ isLoadingHistory: false });
    }
  },

  renameConversationItem: async (id: string, newTitle: string) => {
    try {
      const updated = await updateConversationTitle(id, newTitle);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, title: updated.title, updated_at: updated.updated_at } : c
        ),
      }));
    } catch (error) {
      console.error(`Failed to rename conversation ${id}:`, error);
      throw error;
    }
  },

  deleteConversationItem: async (id: string) => {
    try {
      await deleteConversationApi(id);
      set((state) => {
        const nextConversations = state.conversations.filter((c) => c.id !== id);
        const isCurrentActive = state.threadId === id;
        return {
          conversations: nextConversations,
          ...(isCurrentActive ? { threadId: null, messages: [], input: "" } : {}),
        };
      });
    } catch (error) {
      console.error(`Failed to delete conversation ${id}:`, error);
      throw error;
    }
  },

  startNewChat: () => {
    set({
      threadId: null,
      messages: [],
      input: "",
    });
  },
}));
