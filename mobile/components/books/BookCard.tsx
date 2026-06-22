import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import palette from "@/constants/colors";
import { Badge } from "@/components/ui/Badge";
import type { Book } from "@/types/book";

interface BookCardProps {
  book: Book;
  dark?: boolean;
}

export function BookCard({ book, dark }: BookCardProps) {
  const router = useRouter();
  const available = book.available_quantity > 0;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/books/${book.id}`)}
      activeOpacity={0.82}
      style={{
        flex: 1,
        backgroundColor: dark ? palette.cardDark : palette.card,
        borderRadius: 14,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: dark ? palette.borderDark : palette.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {/* Cover */}
      <View style={{ height: 140, backgroundColor: palette.muted, alignItems: "center", justifyContent: "center" }}>
        {book.cover_image_url ? (
          <Image source={{ uri: book.cover_image_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 40 }}>📚</Text>
        )}
      </View>

      <View style={{ padding: 10, gap: 4 }}>
        <Text numberOfLines={2} style={{ fontSize: 13, fontWeight: "600", color: dark ? palette.foregroundDark : palette.foreground }}>
          {book.title}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 12, color: palette.mutedForeground }}>
          {book.author}
        </Text>
        <View style={{ marginTop: 4 }}>
          <Badge
            label={available ? `${book.available_quantity} avail.` : "Unavailable"}
            variant={available ? "success" : "destructive"}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}
