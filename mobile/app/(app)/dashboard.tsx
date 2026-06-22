import { ScrollView, View, Text, RefreshControl, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { useDashboardStats, useTransactions } from "@/hooks/useTransactions";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { TransactionCard } from "@/components/transactions/TransactionCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import palette from "@/constants/colors";

export default function DashboardScreen() {
  const systemScheme = useColorScheme();
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark" || (theme === "system" && systemScheme === "dark");

  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: txPages, isLoading: txLoading, refetch: refetchTx } = useTransactions({ page_size: 5 } as Record<string, unknown>);

  const bg = isDark ? palette.backgroundDark : palette.background;
  const fg = isDark ? palette.foregroundDark : palette.foreground;

  const recentTx = txPages?.pages[0]?.data ?? [];

  function handleRefresh() {
    refetchStats();
    refetchTx();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 20 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={palette.primary} />}
      >
        {/* Header */}
        <View style={{ gap: 2 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: fg }}>Dashboard</Text>
          <Text style={{ fontSize: 14, color: palette.mutedForeground }}>
            Welcome back, {user?.full_name?.split(" ")[0]}
          </Text>
        </View>

        {/* Stats */}
        {statsLoading ? (
          <LoadingSpinner />
        ) : (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <StatsCard emoji="📚" label="Total Books" value={stats?.totalBooks ?? 0} accent={palette.primary} dark={isDark} />
            <StatsCard emoji="📤" label="Issued" value={stats?.issuedBooks ?? 0} accent={palette.secondary} dark={isDark} />
            <StatsCard emoji="⚠️" label="Fines" value={stats?.pendingFines ?? 0} accent={palette.destructive} dark={isDark} />
          </View>
        )}

        {/* Recent Transactions */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: fg }}>Recent Transactions</Text>
          {txLoading ? (
            <LoadingSpinner />
          ) : recentTx.length === 0 ? (
            <Text style={{ color: palette.mutedForeground, fontSize: 14 }}>No transactions yet.</Text>
          ) : (
            recentTx.slice(0, 5).map((tx) => (
              <TransactionCard key={tx.id} tx={tx} dark={isDark} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
