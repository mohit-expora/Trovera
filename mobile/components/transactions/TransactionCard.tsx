import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import palette from "@/constants/colors";
import { Badge } from "@/components/ui/Badge";
import type { Transaction } from "@/types/transaction";

interface TransactionCardProps {
  tx: Transaction;
  dark?: boolean;
  onReturn?: () => void;
}

const statusVariant: Record<string, "success" | "warning" | "destructive" | "default"> = {
  issued: "default",
  returned: "success",
  overdue: "destructive",
  lost: "destructive",
};

const statusLabel: Record<string, string> = {
  issued: "Issued",
  returned: "Returned",
  overdue: "Overdue",
  lost: "Lost",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function TransactionCard({ tx, dark, onReturn }: TransactionCardProps) {
  const fg = dark ? palette.foregroundDark : palette.foreground;
  const isOverdue = new Date(tx.due_date) < new Date() && tx.status === "issued";

  return (
    <View
      style={{
        backgroundColor: dark ? palette.cardDark : palette.card,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: isOverdue ? palette.destructive + "60" : (dark ? palette.borderDark : palette.border),
        gap: 6,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Text
          style={{ flex: 1, fontSize: 14, fontWeight: "600", color: fg, marginRight: 8 }}
          numberOfLines={2}
        >
          {tx.book?.title ?? "Unknown Book"}
        </Text>
        <Badge
          label={statusLabel[tx.status] ?? tx.status}
          variant={statusVariant[tx.status] ?? "default"}
        />
      </View>

      {tx.member && (
        <Text style={{ fontSize: 12, color: palette.mutedForeground }}>
          {tx.member.full_name}
        </Text>
      )}

      <View style={{ flexDirection: "row", gap: 16, marginTop: 2 }}>
        <Text style={{ fontSize: 12, color: palette.mutedForeground }}>
          Issued: {formatDate(tx.issued_at)}
        </Text>
        <Text style={{ fontSize: 12, color: isOverdue ? palette.destructive : palette.mutedForeground }}>
          Due: {formatDate(tx.due_date)}
        </Text>
      </View>

      {onReturn && (
        <TouchableOpacity
          onPress={onReturn}
          style={{
            marginTop: 4,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            alignSelf: "flex-start",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: palette.success + "20",
            borderWidth: 1,
            borderColor: palette.success + "50",
          }}
        >
          <Ionicons name="return-down-back-outline" size={14} color={palette.success} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: palette.success }}>Return</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
