import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { axiosInstance } from "@/lib/api";
import type { UserProfile } from "@/types/user";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
  },
});

function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    async function bootstrap() {
      const token = await SecureStore.getItemAsync("trovera_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axiosInstance.get<{ data: UserProfile }>("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        await setUser(res.data.data, token);
      } catch {
        await logout();
      }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(app)/dashboard");
    }
  }, [isAuthenticated, isLoading, segments]);

  return null;
}

export default function RootLayout() {
  const resolvedTheme = useUIStore((s) => s.resolvedTheme)();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthGuard />
        <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
