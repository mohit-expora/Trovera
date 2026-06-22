import { useState } from "react";
import { ScrollView, View, Text, Image, useColorScheme, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUIStore } from "@/store/uiStore";
import { useBook } from "@/hooks/useBooks";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { IssueBookModal } from "@/components/transactions/IssueBookModal";
import { usePermission } from "@/hooks/usePermission";
import palette from "@/constants/colors";

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const systemScheme = useColorScheme();
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark" || (theme === "system" && systemScheme === "dark");
  const canIssue = usePermission("transactions:issue:cta");
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  const { data: book, isLoading, error, refetch } = useBook(id ?? "");

  const bg = isDark ? palette.backgroundDark : palette.background;
  const fg = isDark ? palette.foregroundDark : palette.foreground;
  const card = isDark ? palette.cardDark : palette.card;
  const border = isDark ? palette.borderDark : palette.border;

  if (isLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: bg }}><LoadingSpinner fullScreen /></SafeAreaView>;
  if (error || !book) return <SafeAreaView style={{ flex: 1, backgroundColor: bg }}><ErrorState message="Book not found" onRetry={refetch} dark={isDark} /></SafeAreaView>;

  const available = book.available_quantity > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="arrow-back" size={20} color={palette.primary} />
          <Text style={{ color: palette.primary, fontSize: 15, fontWeight: "600" }}>Books</Text>
        </TouchableOpacity>

        {/* Cover */}
        <View style={{ height: 220, borderRadius: 16, overflow: "hidden", backgroundColor: isDark ? palette.mutedDark : palette.muted, alignItems: "center", justifyContent: "center" }}>
          {book.cover_image_url ? (
            <Image source={{ uri: book.cover_image_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 64 }}>📚</Text>
          )}
        </View>

        {/* Info */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: fg }}>{book.title}</Text>
          <Text style={{ fontSize: 16, color: palette.mutedForeground }}>{book.author}</Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Badge label={available ? `${book.available_quantity} of ${book.total_quantity} available` : "Unavailable"} variant={available ? "success" : "destructive"} />
            {book.language && <Badge label={book.language.toUpperCase()} variant="secondary" />}
            {book.category && <Badge label={book.category.name} />}
          </View>
        </View>

        {/* Details */}
        <View style={{ backgroundColor: card, borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: border }}>
          {[
            { label: "ISBN", value: book.isbn },
            { label: "Publisher", value: book.publisher },
            { label: "Year", value: book.published_year?.toString() },
            { label: "Shelf", value: book.shelf_location },
          ].filter((r) => r.value).map((row) => (
            <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: palette.mutedForeground, fontSize: 13 }}>{row.label}</Text>
              <Text style={{ color: fg, fontSize: 13, fontWeight: "500" }}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        {book.description && (
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: fg }}>Description</Text>
            <Text style={{ fontSize: 14, color: palette.mutedForeground, lineHeight: 22 }}>{book.description}</Text>
          </View>
        )}

        {/* Issue CTA */}
        {canIssue && available && (
          <Button label="Issue This Book" size="lg" onPress={() => setIssueModalOpen(true)} />
        )}
      </ScrollView>

      <IssueBookModal
        visible={issueModalOpen}
        bookId={id ?? ""}
        bookTitle={book.title}
        onClose={() => setIssueModalOpen(false)}
        dark={isDark}
      />
    </SafeAreaView>
  );
}
