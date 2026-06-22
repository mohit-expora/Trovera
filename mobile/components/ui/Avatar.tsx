import { View, Text, Image } from "react-native";
import palette from "@/constants/colors";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  dark?: boolean;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Avatar({ name, src, size = 40, dark }: AvatarProps) {
  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: palette.primary + "30",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.35, fontWeight: "700", color: palette.primary }}>
        {initials(name)}
      </Text>
    </View>
  );
}
