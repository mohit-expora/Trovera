import { ActivityIndicator, View } from "react-native";
import palette from "@/constants/colors";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  color?: string;
}

export function LoadingSpinner({ fullScreen, color }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={color ?? palette.primary} />
      </View>
    );
  }
  return <ActivityIndicator size="small" color={color ?? palette.primary} />;
}
