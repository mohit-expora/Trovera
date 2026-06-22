import { Modal, View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import palette from "@/constants/colors";
import type { Transaction } from "@/types/transaction";

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
  dark?: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function ReturnBookModal({ transaction, onClose, dark }: Props) {
  const qc = useQueryClient();
  const fg = dark ? palette.foregroundDark : palette.foreground;
  const border = dark ? palette.borderDark : palette.border;
  const bg = dark ? palette.backgroundDark : palette.background;

  const isOverdue = transaction
    ? new Date(transaction.due_date) < new Date() && transaction.status === "issued"
    : false;

  const { mutate: returnBook, isPending } = useMutation({
    mutationFn: () =>
      api.patch(`/transactions/${transaction!.id}/return`, {}),
    onSuccess: (result: unknown) => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["fines"] });

      const data = result as { transaction?: unknown; fine?: { amount?: number; days_overdue?: number } | null };
      if (data?.fine?.amount) {
        Alert.alert(
          "Book Returned",
          `Book returned successfully.\nFine applied: $${data.fine.amount.toFixed(2)} (${data.fine.days_overdue ?? 0} days overdue).`,
        );
      } else {
        Alert.alert("Book Returned", "Book returned successfully. No fine applied.");
      }
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Failed to return book";
      Alert.alert("Error", msg);
    },
  });

  function handleConfirm() {
    if (!transaction) return;
    Alert.alert(
      "Confirm Return",
      `Return "${transaction.book?.title ?? "this book"}"${isOverdue ? "\n\nWarning: This book is overdue. A fine will be calculated." : ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Return", onPress: () => returnBook() },
      ]
    );
  }

  if (!transaction) return null;

  return (
    <Modal
      visible={!!transaction}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}>
        <View style={{
          backgroundColor: bg,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          paddingBottom: 40, paddingTop: 16,
        }}>
          {/* Handle */}
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: border }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: fg }}>Return Book</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={palette.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={{
            marginHorizontal: 20, marginBottom: 20,
            backgroundColor: dark ? palette.cardDark : palette.card,
            borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: border,
          }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: fg }} numberOfLines={2}>
              {transaction.book?.title ?? "Unknown Book"}
            </Text>
            {transaction.member && (
              <Text style={{ fontSize: 13, color: palette.mutedForeground }}>
                Issued to: {transaction.member.full_name}
              </Text>
            )}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: palette.mutedForeground, marginBottom: 2 }}>Issued</Text>
                <Text style={{ fontSize: 13, fontWeight: "500", color: fg }}>{formatDate(transaction.issued_at)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: palette.mutedForeground, marginBottom: 2 }}>Due Date</Text>
                <Text style={{ fontSize: 13, fontWeight: "500", color: isOverdue ? palette.destructive : fg }}>
                  {formatDate(transaction.due_date)}
                </Text>
              </View>
            </View>
            {isOverdue && (
              <View style={{
                backgroundColor: palette.destructive + "15",
                borderRadius: 8, padding: 10,
                borderLeftWidth: 3, borderLeftColor: palette.destructive,
                flexDirection: "row", alignItems: "center", gap: 8,
              }}>
                <Ionicons name="warning-outline" size={16} color={palette.destructive} />
                <Text style={{ fontSize: 12, color: palette.destructive, flex: 1 }}>
                  This book is overdue. A fine will be applied.
                </Text>
              </View>
            )}
          </View>

          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            <Button
              label={isPending ? "Processing…" : "Confirm Return"}
              onPress={handleConfirm}
              loading={isPending}
              size="lg"
            />
            <Button
              label="Cancel"
              variant="outline"
              onPress={onClose}
              size="lg"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
