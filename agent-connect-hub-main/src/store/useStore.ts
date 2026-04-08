import { create } from "zustand";
import type { Agent, Message, CannedResponse } from "@/types";

interface AppState {
  // Agent session
  activeAgent: Agent | null;
  setActiveAgent: (agent: Agent | null) => void;

  // Messages
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  prependMessage: (message: Message) => void;
  updateMessage: (externalId: string, updates: Partial<Message>) => void;
  removeMessage: (externalId: string) => void;

  // Selected message for workspace
  selectedMessage: Message | null;
  setSelectedMessage: (message: Message | null) => void;

  // Canned responses
  cannedResponses: CannedResponse[];
  setCannedResponses: (responses: CannedResponse[]) => void;
  addCannedResponse: (response: CannedResponse) => void;

  // WebSocket status
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  activeAgent: null,
  setActiveAgent: (agent) => set({ activeAgent: agent }),

  messages: [],
  setMessages: (messages) => set({ messages }),
  prependMessage: (message) =>
    set((state) => ({ messages: [message, ...state.messages] })),
  updateMessage: (externalId, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.external_id === externalId ? { ...m, ...updates } : m
      ),
    })),
  removeMessage: (externalId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.external_id !== externalId),
    })),

  selectedMessage: null,
  setSelectedMessage: (message) => set({ selectedMessage: message }),

  cannedResponses: [],
  setCannedResponses: (responses) => set({ cannedResponses: responses }),
  addCannedResponse: (response) =>
    set((state) => ({
      cannedResponses: [...state.cannedResponses, response],
    })),

  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),
}));
