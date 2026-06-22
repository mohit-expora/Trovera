import { View, type ViewProps } from "react-native";
import palette from "@/constants/colors";

interface CardProps extends ViewProps {
  dark?: boolean;
}

export function Card({ dark, style, children, ...rest }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: dark ? palette.cardDark : palette.card,
          borderRadius: 14,
          padding: 16,
          borderWidth: 1,
          borderColor: dark ? palette.borderDark : palette.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: dark ? 0.25 : 0.06,
          shadowRadius: 8,
          elevation: 2,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
