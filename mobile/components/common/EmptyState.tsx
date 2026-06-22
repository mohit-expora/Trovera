import { View, Text } from "react-native";
import palette from "@/constants/colors";

interface EmptyStateProps {
  title: string;
  description?: string;
  dark?: boolean;
}

export function EmptyState({ title, description, dark }: EmptyStateProps) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingVertical: 48 }}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
      <Text style={{ fontSize: 17, fontWeight: "600", color: dark ? palette.foregroundDark : palette.foreground, textAlign: "center" }}>
        {title}
      </Text>
      {description && (
        <Text style={{ fontSize: 14, color: palette.mutedForeground, textAlign: "center", marginTop: 6 }}>
          {description}
        </Text>
      )}
    </View>
  );
}
