import { View, Text } from "react-native";
import palette from "@/constants/colors";

interface StatsCardProps {
  label: string;
  value: number | string;
  emoji: string;
  accent?: string;
  dark?: boolean;
}

export function StatsCard({ label, value, emoji, accent, dark }: StatsCardProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: dark ? palette.cardDark : palette.card,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: dark ? palette.borderDark : palette.border,
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: dark ? 0.2 : 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <Text style={{ fontSize: 28 }}>{emoji}</Text>
      <Text style={{ fontSize: 26, fontWeight: "700", color: accent ?? palette.primary }}>
        {value}
      </Text>
      <Text style={{ fontSize: 13, color: palette.mutedForeground }}>{label}</Text>
    </View>
  );
}
