import { create } from 'zustand';
import { ChatMessage } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  input: string;
  threadId: string | null;
  isStreaming: boolean;
  
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  setInput: (input: string) => void;
  setThreadId: (id: string | null) => void;
  setIsStreaming: (isStreaming: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  input: "",
  threadId: null,
  isStreaming: false,
  
  setMessages: (updater) => set((state) => ({
    messages: typeof updater === 'function' ? updater(state.messages) : updater
  })),
  setInput: (input) => set({ input }),
  setThreadId: (threadId) => set({ threadId }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
}));
