import { useState, useCallback } from "react";
import { View, Text, FlatList, TextInput, useColorScheme, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUIStore } from "@/store/uiStore";
import { useBooks } from "@/hooks/useBooks";
import { BookCard } from "@/components/books/BookCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import palette from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import type { Book } from "@/types/book";

export default function BooksScreen() {
  const systemScheme = useColorScheme();
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark" || (theme === "system" && systemScheme === "dark");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  const onSearchChange = useCallback((text: string) => {
    setSearch(text);
    clearTimeout((onSearchChange as unknown as { _t: ReturnType<typeof setTimeout> })._t);
    (onSearchChange as unknown as { _t: ReturnType<typeof setTimeout> })._t = setTimeout(
      () => setDebouncedSearch(text),
      400
    );
  }, []);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useBooks(
    debouncedSearch ? { search: debouncedSearch } : {}
  );

  const books: Book[] = data?.pages.flatMap((p) => p.data) ?? [];
  const bg = isDark ? palette.backgroundDark : palette.background;
  const fg = isDark ? palette.foregroundDark : palette.foreground;
  const inputBg = isDark ? palette.mutedDark : palette.muted;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ padding: 20, paddingBottom: 12, gap: 14 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: fg }}>Books</Text>
        {/* Search */}
        <View style={{
          flexDirection: "row", alignItems: "center",
          backgroundColor: inputBg, borderRadius: 12,
          paddingHorizontal: 12, gap: 8, borderWidth: 1,
          borderColor: isDark ? palette.borderDark : palette.border,
        }}>
          <Ionicons name="search-outline" size={18} color={palette.mutedForeground} />
          <TextInput
            placeholder="Search books, authors…"
            placeholderTextColor={palette.mutedForeground}
            value={search}
            onChangeText={onSearchChange}
            style={{ flex: 1, height: 42, fontSize: 14, color: fg }}
          />
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : books.length === 0 ? (
        <EmptyState title="No books found" description="Try a different search term" dark={isDark} />
      ) : (
        <FlatList
          data={books}
          keyExtractor={(b) => b.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20, gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={palette.primary} />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={isFetchingNextPage ? <LoadingSpinner /> : null}
          renderItem={({ item }) => <BookCard book={item} dark={isDark} />}
        />
      )}
    </SafeAreaView>
  );
}
