import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { UserProfile } from "@/types/user";

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: async (user, token) => {
    await SecureStore.setItemAsync("trovera_token", token);
    set({ user, accessToken: token, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("trovera_token");
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (v) => set({ isLoading: v }),
}));
