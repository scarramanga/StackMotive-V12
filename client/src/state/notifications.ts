import { create } from "zustand";

export interface NotificationMessage {
  title: string;
  body?: string;
}

interface NotificationsState {
  messages: NotificationMessage[];
  push: (message: NotificationMessage) => void;
  clear: () => void;
}

export const useNotifications = create<NotificationsState>((set) => ({
  messages: [],
  push: (message) => set((state) => ({ messages: [message, ...state.messages] })),
  clear: () => set({ messages: [] })
}));
