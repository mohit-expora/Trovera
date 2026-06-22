import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import palette from "@/constants/colors";

export default function AppLayout() {
  const systemScheme = useColorScheme();
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark" || (theme === "system" && systemScheme === "dark");
  const user = useAuthStore((s) => s.user);
  const isAdminOrLib = user?.role === "super_admin" || user?.role === "librarian";

  const bg = isDark ? palette.backgroundDark : palette.background;
  const card = isDark ? palette.cardDark : palette.card;
  const border = isDark ? palette.borderDark : palette.border;
  const fg = isDark ? palette.foregroundDark : palette.foreground;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: card,
          borderTopColor: border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.mutedForeground,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="books/index"
        options={{
          title: "Books",
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color, size }) => <Ionicons name="swap-horizontal-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="fines"
        options={{
          title: "Fines",
          tabBarIcon: ({ color, size }) => <Ionicons name="alert-circle-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: "Members",
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
          href: isAdminOrLib ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
      {/* Hidden screens (not in tab bar) */}
      <Tabs.Screen name="books/[id]" options={{ href: null }} />
    </Tabs>
  );
}
