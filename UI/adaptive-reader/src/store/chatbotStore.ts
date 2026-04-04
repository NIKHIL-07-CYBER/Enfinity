// DONE: Task 5a — Chatbot store
import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AvatarConfig {
  emoji: string;
  color: string;
  size: number;
  positionX: number;
  positionY: number;
}

const DEFAULT_AVATAR: AvatarConfig = {
  emoji: '🦉',
  color: '#185FA5',
  size: 52,
  positionX: 20,
  positionY: 12,
};

export interface ChatbotState {
  isOpen: boolean;
  messages: ChatMessage[];
  avatarConfig: AvatarConfig;
  isTyping: boolean;
  contextParagraphId: string | null;
  hasUnread: boolean;
  toggleOpen: () => void;
  addMessage: (msg: ChatMessage) => void;
  setIsTyping: (v: boolean) => void;
  updateAvatarConfig: (config: Partial<AvatarConfig>) => void;
  setContextParagraph: (id: string | null) => void;
  setHasUnread: (v: boolean) => void;
}

function loadMessages(): ChatMessage[] {
  try {
    const stored = localStorage.getItem('chatbot_messages');
    if (stored) {
      const msgs = JSON.parse(stored);
      return msgs.slice(-50);
    }
  } catch { /* empty */ }
  return [];
}

function loadAvatarConfig(): AvatarConfig {
  try {
    const stored = localStorage.getItem('chatbot_avatar_config');
    if (stored) return { ...DEFAULT_AVATAR, ...JSON.parse(stored) };
  } catch { /* empty */ }
  return { ...DEFAULT_AVATAR };
}

function saveMessages(msgs: ChatMessage[]) {
  localStorage.setItem('chatbot_messages', JSON.stringify(msgs.slice(-50)));
}

function saveAvatarConfig(config: AvatarConfig) {
  localStorage.setItem('chatbot_avatar_config', JSON.stringify(config));
}

export const useChatbotStore = create<ChatbotState>((set) => ({
  isOpen: false,
  messages: loadMessages(),
  avatarConfig: loadAvatarConfig(),
  isTyping: false,
  contextParagraphId: null,
  hasUnread: false,

  toggleOpen: () =>
    set((state) => ({ isOpen: !state.isOpen, hasUnread: false })),

  addMessage: (msg) =>
    set((state) => {
      const next = [...state.messages, msg].slice(-50);
      saveMessages(next);
      return { messages: next, hasUnread: msg.role === 'assistant' && !state.isOpen };
    }),

  setIsTyping: (v) => set({ isTyping: v }),

  updateAvatarConfig: (config) =>
    set((state) => {
      const next = { ...state.avatarConfig, ...config };
      saveAvatarConfig(next);
      return { avatarConfig: next };
    }),

  setContextParagraph: (id) => set({ contextParagraphId: id }),

  setHasUnread: (v) => set({ hasUnread: v }),
}));
