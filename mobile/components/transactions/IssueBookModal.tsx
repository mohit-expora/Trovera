import { useState, useCallback } from "react";
import {
  Modal, View, Text, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import palette from "@/constants/colors";
import type { User } from "@/types/user";

interface Props {
  visible: boolean;
  bookId: string;
  bookTitle: string;
  onClose: () => void;
  dark?: boolean;
}

const DUE_OPTIONS = [
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "21 days", days: 21 },
  { label: "30 days", days: 30 },
];

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function IssueBookModal({ visible, bookId, bookTitle, onClose, dark }: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [dueDays, setDueDays] = useState(14);

  const bg = dark ? palette.cardDark : palette.card;
  const fg = dark ? palette.foregroundDark : palette.foreground;
  const border = dark ? palette.borderDark : palette.border;
  const inputBg = dark ? palette.mutedDark : palette.muted;

  const onSearchChange = useCallback((text: string) => {
    setSearch(text);
    clearTimeout((onSearchChange as unknown as { _t: ReturnType<typeof setTimeout> })._t);
    (onSearchChange as unknown as { _t: ReturnType<typeof setTimeout> })._t = setTimeout(
      () => setDebouncedSearch(text),
      400
    );
  }, []);

  const { data, isLoading } = useInfiniteQuery({
    queryKey: ["issue-member-search", debouncedSearch],
    queryFn: async ({ pageParam = 1 }) =>
      api.getPaginated<User>("/users", {
        role: "member",
        search: debouncedSearch || undefined,
        page: pageParam,
        page_size: 10,
      }),
    initialPageParam: 1,
    getNextPageParam: (last, _, lastPageParam) =>
      lastPageParam < last.meta.total_pages ? lastPageParam + 1 : undefined,
    enabled: visible,
  });

  const members: User[] = data?.pages.flatMap((p) => p.data) ?? [];

  const { mutate: issue, isPending } = useMutation({
    mutationFn: () =>
      api.post("/transactions/issue", {
        book_id: bookId,
        member_id: selectedMember!.id,
        due_date: addDays(dueDays),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["book", bookId] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      Alert.alert("Success", `Book issued to ${selectedMember!.full_name}!`);
      handleClose();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Failed to issue book";
      Alert.alert("Error", msg);
    },
  });

  function handleClose() {
    setSearch("");
    setDebouncedSearch("");
    setSelectedMember(null);
    setDueDays(14);
    onClose();
  }

  function handleConfirm() {
    if (!selectedMember) {
      Alert.alert("Select Member", "Please select a member to issue this book to.");
      return;
    }
    Alert.alert(
      "Confirm Issue",
      `Issue "${bookTitle}" to ${selectedMember.full_name} for ${dueDays} days?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Issue", onPress: () => issue() },
      ]
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}>
          <View style={{
            backgroundColor: dark ? palette.backgroundDark : palette.background,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            maxHeight: "85%", paddingBottom: 32,
          }}>
            {/* Handle */}
            <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: border }} />
            </View>

            <View style={{ paddingHorizontal: 20, paddingBottom: 12, gap: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: fg }}>Issue Book</Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={24} color={palette.mutedForeground} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 13, color: palette.mutedForeground }} numberOfLines={1}>
                {bookTitle}
              </Text>
            </View>

            {/* Due date selector */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: fg, marginBottom: 8 }}>Due Date</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {DUE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.days}
                    onPress={() => setDueDays(opt.days)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: dueDays === opt.days ? palette.primary : border,
                      backgroundColor: dueDays === opt.days ? palette.primary + "18" : bg,
                    }}
                  >
                    <Text style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: dueDays === opt.days ? palette.primary : palette.mutedForeground,
                    }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Member search */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: fg, marginBottom: 8 }}>
                Select Member {selectedMember ? `— ${selectedMember.full_name}` : ""}
              </Text>
              <View style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: inputBg, borderRadius: 10,
                paddingHorizontal: 10, gap: 8, borderWidth: 1, borderColor: border,
              }}>
                <Ionicons name="search-outline" size={16} color={palette.mutedForeground} />
                <TextInput
                  placeholder="Search members…"
                  placeholderTextColor={palette.mutedForeground}
                  value={search}
                  onChangeText={onSearchChange}
                  style={{ flex: 1, height: 38, fontSize: 14, color: fg }}
                />
              </View>
            </View>

            {isLoading ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator color={palette.primary} />
              </View>
            ) : (
              <FlatList
                data={members}
                keyExtractor={(m) => m.id}
                style={{ maxHeight: 240 }}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: member }) => {
                  const isSelected = selectedMember?.id === member.id;
                  return (
                    <TouchableOpacity
                      onPress={() => setSelectedMember(member)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isSelected ? palette.primary : border,
                        backgroundColor: isSelected ? palette.primary + "12" : bg,
                      }}
                    >
                      <View style={{
                        width: 38, height: 38, borderRadius: 19,
                        backgroundColor: palette.primary + "28",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: palette.primary }}>
                          {member.full_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: fg }}>{member.full_name}</Text>
                        <Text style={{ fontSize: 12, color: palette.mutedForeground }}>{member.email}</Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={palette.primary} />
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <Text style={{ color: palette.mutedForeground, fontSize: 14, textAlign: "center", paddingVertical: 16 }}>
                    No members found
                  </Text>
                }
              />
            )}

            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              <Button
                label={isPending ? "Issuing…" : "Issue Book"}
                onPress={handleConfirm}
                loading={isPending}
                size="lg"
                disabled={!selectedMember || isPending}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
