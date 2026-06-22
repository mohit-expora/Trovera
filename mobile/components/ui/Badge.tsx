import { View, Text } from "react-native";
import palette from "@/constants/colors";

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "secondary";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default:     { bg: palette.muted,                  text: palette.foreground },
  success:     { bg: `${palette.success}30`,         text: palette.success },
  warning:     { bg: `${palette.warning}40`,         text: "#8a6e00" },
  destructive: { bg: `${palette.destructive}25`,     text: palette.destructive },
  secondary:   { bg: `${palette.secondary}30`,       text: palette.secondary },
};

export function Badge({ label, variant = "default" }: BadgeProps) {
  const c = variantColors[variant];
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" }}>
      <Text style={{ color: c.text, fontSize: 11, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}
