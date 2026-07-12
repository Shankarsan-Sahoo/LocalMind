import { create } from 'zustand';
import { db } from '../db';
import type { Conversation, Message } from '../types';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isGenerating: boolean;
  streamingMessage: string;
  loadConversations: () => Promise<void>;
  setActiveConversation: (id: string | null) => Promise<void>;
  createConversation: (title?: string) => Promise<string>;
  renameConversation: (id: string, newTitle: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => Promise<void>;
  setGenerating: (generating: boolean) => void;
  setStreamingMessage: (msg: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isGenerating: false,
  streamingMessage: '',

  loadConversations: async () => {
    const convos = await db.conversations.orderBy('updatedAt').reverse().toArray();
    set({ conversations: convos });
  },

  setActiveConversation: async (id: string | null) => {
    if (!id) {
      set({ activeConversationId: null, messages: [] });
      return;
    }
    const messages = await db.messages.where('conversationId').equals(id).sortBy('createdAt');
    set({ activeConversationId: id, messages });
  },

  createConversation: async (title = 'New Chat') => {
    const newId = crypto.randomUUID();
    const now = Date.now();
    const newConv: Conversation = {
      id: newId,
      title,
      createdAt: now,
      updatedAt: now
    };
    await db.conversations.add(newConv);
    await get().loadConversations();
    await get().setActiveConversation(newId);
    return newId;
  },

  renameConversation: async (id: string, newTitle: string) => {
    await db.conversations.update(id, { title: newTitle, updatedAt: Date.now() });
    await get().loadConversations();
  },

  deleteConversation: async (id: string) => {
    await db.conversations.delete(id);
    await db.messages.where('conversationId').equals(id).delete();
    const { activeConversationId } = get();
    if (activeConversationId === id) {
      set({ activeConversationId: null, messages: [] });
    }
    await get().loadConversations();
  },

  addMessage: async (message) => {
    const newId = crypto.randomUUID();
    const now = Date.now();
    const newMsg: Message = { ...message, id: newId, createdAt: now };
    
    await db.messages.add(newMsg);
    await db.conversations.update(message.conversationId, { updatedAt: now });
    
    const { activeConversationId, messages } = get();
    if (activeConversationId === message.conversationId) {
      set({ messages: [...messages, newMsg] });
    }
    await get().loadConversations();
  },

  setGenerating: (isGenerating) => set({ isGenerating }),
  setStreamingMessage: (streamingMessage) => set({ streamingMessage })
}));
