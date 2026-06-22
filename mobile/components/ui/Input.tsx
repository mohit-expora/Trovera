import { TextInput, View, Text, type TextInputProps } from "react-native";
import palette from "@/constants/colors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  dark?: boolean;
}

export function Input({ label, error, dark, style, ...rest }: InputProps) {
  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text style={{ fontSize: 13, fontWeight: "500", color: dark ? palette.foregroundDark : palette.foreground }}>
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={palette.mutedForeground}
        style={[
          {
            height: 46,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: error ? palette.destructive : (dark ? palette.borderDark : palette.border),
            backgroundColor: dark ? palette.mutedDark : palette.card,
            paddingHorizontal: 14,
            fontSize: 15,
            color: dark ? palette.foregroundDark : palette.foreground,
          },
          style,
        ]}
        {...rest}
      />
      {error && <Text style={{ fontSize: 12, color: palette.destructive }}>{error}</Text>}
    </View>
  );
}
