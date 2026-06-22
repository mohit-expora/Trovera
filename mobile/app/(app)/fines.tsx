import { View, Text, FlatList, useColorScheme, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUIStore } from "@/store/uiStore";
import { useFines } from "@/hooks/useTransactions";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Card } from "@/components/ui/Card";
import palette from "@/constants/colors";
import type { Fine } from "@/types/transaction";

const statusVariant: Record<string, "warning" | "success" | "default"> = {
  pending: "warning",
  paid: "success",
  waived: "default",
};

function FineCard({ fine, dark }: { fine: Fine; dark: boolean }) {
  return (
    <Card dark={dark} style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: dark ? palette.foregroundDark : palette.foreground, marginRight: 8 }} numberOfLines={2}>
          {fine.transaction?.book?.title ?? "Unknown Book"}
        </Text>
        <Badge label={fine.status.charAt(0).toUpperCase() + fine.status.slice(1)} variant={statusVariant[fine.status] ?? "default"} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 13, color: palette.mutedForeground }}>{fine.days_overdue} days overdue</Text>
        <Text style={{ fontSize: 16, fontWeight: "700", color: fine.status === "pending" ? palette.destructive : palette.success }}>
          ${fine.amount.toFixed(2)}
        </Text>
      </View>
    </Card>
  );
}

export default function FinesScreen() {
  const systemScheme = useColorScheme();
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark" || (theme === "system" && systemScheme === "dark");

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useFines();
  const fines: Fine[] = data?.pages.flatMap((p) => p.data) ?? [];

  const bg = isDark ? palette.backgroundDark : palette.background;
  const fg = isDark ? palette.foregroundDark : palette.foreground;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: fg }}>Fines</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : fines.length === 0 ? (
        <EmptyState title="No fines" description="All clear! No pending fines." dark={isDark} />
      ) : (
        <FlatList
          data={fines}
          keyExtractor={(f) => f.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 10 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={palette.primary} />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={isFetchingNextPage ? <LoadingSpinner /> : null}
          renderItem={({ item }) => <FineCard fine={item} dark={isDark} />}
        />
      )}
    </SafeAreaView>
  );
}
