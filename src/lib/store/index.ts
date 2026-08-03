import { create } from 'zustand'
import type { User, Notification } from '@/lib/types'

interface AppState {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void

  isLoading: boolean
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  setLoading: (loading: boolean) => void

  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  notifications: Notification[]
  addNotification: (notification: Notification) => void
  markNotificationRead: (notificationId: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void

  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
}

export const useStore = create<AppState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  isLoading: true,
  isAuthenticated: false,
  login: (user) => set({ currentUser: user, isAuthenticated: true, isLoading: false }),
  logout: () => set({ currentUser: null, isAuthenticated: false, isLoading: false, notifications: [] }),
  setLoading: (loading) => set({ isLoading: loading }),

  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),
  markNotificationRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ),
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
    })),
  clearNotifications: () => set({ notifications: [] }),

  theme: 'light',
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
}))

export const useAppStore = useStore
