export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const LOCALES: Record<string, string> = {
  en: "English",
  hi: "हिंदी",
  es: "Español",
  fr: "Français",
};

export interface ColorPalette {
  id: string;
  name: string;
  primaryHue: number;
  secondaryHue: number;
  accentHue: number;
}

export const COLOR_PALETTES: ColorPalette[] = [
  { id: "lavender", name: "Lavender", primaryHue: 270, secondaryHue: 220, accentHue: 340 },
  { id: "ocean",    name: "Ocean",    primaryHue: 200, secondaryHue: 180, accentHue: 160 },
  { id: "rose",     name: "Rose",     primaryHue: 340, secondaryHue: 310, accentHue: 15  },
  { id: "sage",     name: "Sage",     primaryHue: 145, secondaryHue: 170, accentHue: 80  },
  { id: "sunset",   name: "Sunset",   primaryHue: 25,  secondaryHue: 45,  accentHue: 0   },
];

export const DEFAULT_PALETTE_ID = "lavender";
export const DEFAULT_SATURATION = 100;
export const DEFAULT_BRIGHTNESS = 0;
