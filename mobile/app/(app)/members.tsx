import { useState, useCallback } from "react";
import { View, Text, FlatList, TextInput, useColorScheme, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useUIStore } from "@/store/uiStore";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Card } from "@/components/ui/Card";
import palette from "@/constants/colors";
import type { User } from "@/types/user";

export default function MembersScreen() {
  const systemScheme = useColorScheme();
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark" || (theme === "system" && systemScheme === "dark");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const onSearchChange = useCallback((text: string) => {
    setSearch(text);
    clearTimeout((onSearchChange as unknown as { _t: ReturnType<typeof setTimeout> })._t);
    (onSearchChange as unknown as { _t: ReturnType<typeof setTimeout> })._t = setTimeout(
      () => setDebouncedSearch(text),
      400
    );
  }, []);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ["members", debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      return api.getPaginated<User>("/users", {
        role: "member",
        search: debouncedSearch || undefined,
        page: pageParam,
        page_size: 20,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (last, _, lastPageParam) =>
      lastPageParam < last.meta.total_pages ? lastPageParam + 1 : undefined,
  });

  const members: User[] = data?.pages.flatMap((p) => p.data) ?? [];
  const bg = isDark ? palette.backgroundDark : palette.background;
  const fg = isDark ? palette.foregroundDark : palette.foreground;
  const inputBg = isDark ? palette.mutedDark : palette.muted;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 14 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: fg }}>Members</Text>
        <View style={{
          flexDirection: "row", alignItems: "center", backgroundColor: inputBg,
          borderRadius: 12, paddingHorizontal: 12, gap: 8, borderWidth: 1,
          borderColor: isDark ? palette.borderDark : palette.border,
        }}>
          <Ionicons name="search-outline" size={18} color={palette.mutedForeground} />
          <TextInput
            placeholder="Search members…"
            placeholderTextColor={palette.mutedForeground}
            value={search}
            onChangeText={onSearchChange}
            style={{ flex: 1, height: 42, fontSize: 14, color: fg }}
          />
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : members.length === 0 ? (
        <EmptyState title="No members found" dark={isDark} />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 10 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={palette.primary} />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={isFetchingNextPage ? <LoadingSpinner /> : null}
          renderItem={({ item: member }) => (
            <Card dark={isDark}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Avatar name={member.full_name} src={member.avatar_url} size={44} dark={isDark} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: fg }}>{member.full_name}</Text>
                  <Text style={{ fontSize: 12, color: palette.mutedForeground }}>{member.email}</Text>
                </View>
                <Badge label={member.is_active ? "Active" : "Inactive"} variant={member.is_active ? "success" : "destructive"} />
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}
