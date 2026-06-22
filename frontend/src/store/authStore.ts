import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserProfile } from "@/types/user";
import { setAccessToken } from "@/lib/api";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile, token: string) => void;
  updateUser: (partial: Partial<UserProfile>) => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user, token) => {
        setAccessToken(token);
        set({ user, isAuthenticated: true, isLoading: false });
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      logout: () => {
        setAccessToken(null);
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: "trovera-auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
