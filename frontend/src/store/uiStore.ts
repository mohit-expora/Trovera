import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_PALETTE_ID, DEFAULT_SATURATION, DEFAULT_BRIGHTNESS } from "@/config/theme";

type Locale = "en" | "hi" | "es" | "fr";

interface UIState {
  sidebarOpen: boolean;
  locale: Locale;
  // Color theming
  paletteId: string;
  saturation: number;  // 50–150, default 100
  brightness: number;  // -15 to +15, default 0

  toggleSidebar: () => void;
  setSidebarOpen: (v: boolean) => void;
  setLocale: (l: Locale) => void;
  setPaletteId: (id: string) => void;
  setSaturation: (v: number) => void;
  setBrightness: (v: number) => void;
  resetAppearance: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      locale: "en",
      paletteId: DEFAULT_PALETTE_ID,
      saturation: DEFAULT_SATURATION,
      brightness: DEFAULT_BRIGHTNESS,

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      setLocale: (l) => set({ locale: l }),
      setPaletteId: (id) => set({ paletteId: id }),
      setSaturation: (v) => set({ saturation: Math.round(v) }),
      setBrightness: (v) => set({ brightness: Math.round(v) }),
      resetAppearance: () => set({
        paletteId: DEFAULT_PALETTE_ID,
        saturation: DEFAULT_SATURATION,
        brightness: DEFAULT_BRIGHTNESS,
      }),
    }),
    {
      name: "trovera-ui",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
    }
  )
);
