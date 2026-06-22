import { View, Text } from "react-native";
import palette from "@/constants/colors";
import { Button } from "@/components/ui/Button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  dark?: boolean;
}

export function ErrorState({ message, onRetry, dark }: ErrorStateProps) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
      <Text style={{ fontSize: 36 }}>⚠️</Text>
      <Text style={{ fontSize: 15, color: dark ? palette.foregroundDark : palette.foreground, textAlign: "center" }}>
        {message}
      </Text>
      {onRetry && <Button label="Try Again" variant="outline" onPress={onRetry} />}
    </View>
  );
}
