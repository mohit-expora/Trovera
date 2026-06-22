import { View, Text, ScrollView, useColorScheme, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import palette from "@/constants/colors";
import { api } from "@/lib/api";

type ThemeOption = "light" | "dark" | "system";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  librarian: "Librarian",
  member: "Member",
};

export default function SettingsScreen() {
  const systemScheme = useColorScheme();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const isDark = theme === "dark" || (theme === "system" && systemScheme === "dark");

  const { user, logout } = useAuthStore();
  const router = useRouter();

  const bg = isDark ? palette.backgroundDark : palette.background;
  const fg = isDark ? palette.foregroundDark : palette.foreground;

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try { await api.post("/auth/logout"); } catch { /* ignore */ }
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  const themeOptions: { label: string; value: ThemeOption; emoji: string }[] = [
    { label: "Light", value: "light", emoji: "☀️" },
    { label: "Dark", value: "dark", emoji: "🌙" },
    { label: "System", value: "system", emoji: "⚙️" },
  ];

  if (!user) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: fg }}>Settings</Text>

        {/* Profile Card */}
        <Card dark={isDark}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Avatar name={user.full_name} src={user.avatar_url} size={56} dark={isDark} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: fg }}>{user.full_name}</Text>
              <Text style={{ fontSize: 13, color: palette.mutedForeground }}>{user.email}</Text>
              <Badge label={roleLabels[user.role] ?? user.role} variant="secondary" />
            </View>
          </View>
        </Card>

        {/* Theme */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: fg }}>Appearance</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {themeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setTheme(opt.value)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  gap: 4,
                  borderWidth: 2,
                  borderColor: theme === opt.value ? palette.primary : (isDark ? palette.borderDark : palette.border),
                  backgroundColor: theme === opt.value
                    ? palette.primary + "18"
                    : (isDark ? palette.cardDark : palette.card),
                }}
              >
                <Text style={{ fontSize: 22 }}>{opt.emoji}</Text>
                <Text style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: theme === opt.value ? palette.primary : palette.mutedForeground,
                }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account info */}
        <Card dark={isDark} style={{ gap: 10 }}>
          {[
            { label: "Phone", value: user.phone ?? "—" },
            { label: "Address", value: user.address ?? "—" },
            { label: "Member ID", value: user.membership_id ?? "—" },
            { label: "Auth Provider", value: user.auth_provider },
          ].map((row) => (
            <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 13, color: palette.mutedForeground }}>{row.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: "500", color: fg }}>{row.value}</Text>
            </View>
          ))}
        </Card>

        <Button label="Sign Out" variant="destructive" onPress={handleLogout} size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}
