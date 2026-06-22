import { useState } from "react";
import { View, Text, FlatList, useColorScheme, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUIStore } from "@/store/uiStore";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionCard } from "@/components/transactions/TransactionCard";
import { ReturnBookModal } from "@/components/transactions/ReturnBookModal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { usePermission } from "@/hooks/usePermission";
import palette from "@/constants/colors";
import type { Transaction } from "@/types/transaction";

export default function TransactionsScreen() {
  const systemScheme = useColorScheme();
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark" || (theme === "system" && systemScheme === "dark");
  const canReturn = usePermission("transactions:return:cta");

  const [returnTx, setReturnTx] = useState<Transaction | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useTransactions();
  const transactions: Transaction[] = data?.pages.flatMap((p) => p.data) ?? [];

  const bg = isDark ? palette.backgroundDark : palette.background;
  const fg = isDark ? palette.foregroundDark : palette.foreground;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: fg }}>Transactions</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : transactions.length === 0 ? (
        <EmptyState title="No transactions" description="No book transactions yet" dark={isDark} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 10 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={palette.primary} />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={isFetchingNextPage ? <LoadingSpinner /> : null}
          renderItem={({ item }) => (
            <TransactionCard
              tx={item}
              dark={isDark}
              onReturn={canReturn && item.status === "issued" ? () => setReturnTx(item) : undefined}
            />
          )}
        />
      )}

      <ReturnBookModal
        transaction={returnTx}
        onClose={() => setReturnTx(null)}
        dark={isDark}
      />
    </SafeAreaView>
  );
}
