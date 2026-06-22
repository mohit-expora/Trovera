import { create } from "zustand";
import { Appearance } from "react-native";

type Theme = "light" | "dark" | "system";

interface UIState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: () => "light" | "dark";
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: "system",

  setTheme: (t) => set({ theme: t }),

  resolvedTheme: () => {
    const { theme } = get();
    if (theme === "system") {
      const scheme = Appearance.getColorScheme();
      return scheme === "dark" ? "dark" : "light";
    }
    return theme;
  },
}));
