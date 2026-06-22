import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from "react-native";
import palette from "@/constants/colors";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary:     { bg: palette.primary,      text: "#fff" },
  secondary:   { bg: palette.secondary,    text: "#fff" },
  outline:     { bg: "transparent",        text: palette.primary,     border: palette.primary },
  ghost:       { bg: "transparent",        text: palette.primary },
  destructive: { bg: palette.destructive,  text: "#fff" },
};

const sizeStyles: Record<Size, { px: number; py: number; text: number; radius: number }> = {
  sm: { px: 12, py: 8,  text: 13, radius: 8  },
  md: { px: 16, py: 12, text: 15, radius: 10 },
  lg: { px: 20, py: 14, text: 16, radius: 12 },
};

export function Button({ label, variant = "primary", size = "md", loading, disabled, style, ...rest }: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      style={[
        {
          backgroundColor: v.bg,
          paddingHorizontal: s.px,
          paddingVertical: s.py,
          borderRadius: s.radius,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          borderWidth: v.border ? 1.5 : 0,
          borderColor: v.border,
          opacity: isDisabled ? 0.55 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading && <ActivityIndicator size="small" color={v.text} />}
      <Text style={{ color: v.text, fontSize: s.text, fontWeight: "600" }}>{label}</Text>
    </TouchableOpacity>
  );
}
