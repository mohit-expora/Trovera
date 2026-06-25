"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useUIStore } from "@/store/uiStore";
import { COLOR_PALETTES, DEFAULT_PALETTE_ID } from "@/config/theme";

// bg + card are always neutral white/black.
// Palette only affects primary, secondary, accent, border, ring, muted.
const LIGHT = {
  border:     { s: 18,  l: 86  },
  muted:      { s: 12,  l: 96  },
  primary:    { s: 55,  l: 50  },
  secondary:  { s: 45,  l: 60  },
  accent:     { s: 50,  l: 55  },
};

const DARK = {
  border:     { s: 14,  l: 22  },
  muted:      { s: 8,   l: 18  },
  primary:    { s: 45,  l: 65  },
  secondary:  { s: 35,  l: 52  },
  accent:     { s: 38,  l: 58  },
};

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

// Format as "H S% L%" (no hsl() wrapper — matches shadcn convention)
function hv(h: number, s: number, l: number) {
  return `${Math.round(h)} ${clamp(Math.round(s), 0, 100)}% ${clamp(Math.round(l), 2, 97)}%`;
}

function applyPalette(
  palette: { primaryHue: number; secondaryHue: number; accentHue: number },
  saturation: number,   // 30–170, default 100
  brightness: number,   // -15..+15, default 0
  isDark: boolean,
) {
  const sf = saturation / 100;
  const b  = brightness;
  const ph = palette.primaryHue;
  const sh = palette.secondaryHue;
  const ah = palette.accentHue;
  const el = document.documentElement;
  const C  = isDark ? DARK : LIGHT;

  // Background + card: always pure white (light) / pure black (dark)
  el.style.setProperty("--background",         isDark ? "0 0% 4%"  : "0 0% 100%");
  el.style.setProperty("--foreground",         isDark ? "0 0% 92%" : "0 0% 8%");
  el.style.setProperty("--card",               isDark ? "0 0% 8%"  : "0 0% 100%");
  el.style.setProperty("--card-foreground",    isDark ? "0 0% 92%" : "0 0% 8%");
  el.style.setProperty("--popover",            isDark ? "0 0% 8%"  : "0 0% 100%");
  el.style.setProperty("--popover-foreground", isDark ? "0 0% 92%" : "0 0% 8%");

  // Muted + border: palette-hued so they shift with palette selection
  el.style.setProperty("--muted",              hv(ph, C.muted.s,  clamp(C.muted.l  + b, 5, 99)));
  el.style.setProperty("--muted-foreground",   hv(ph, 10,          isDark ? 58 : 46));
  el.style.setProperty("--border",             hv(ph, C.border.s, clamp(C.border.l + b, 5, 97)));
  el.style.setProperty("--input",              hv(ph, C.border.s, clamp(C.border.l + b, 5, 97)));

  // Accent colors — true pastel: low-medium saturation × user slider
  el.style.setProperty("--primary",            hv(ph, C.primary.s   * sf, clamp(C.primary.l   + b, 30, 93)));
  el.style.setProperty("--primary-foreground", hv(ph, 10, isDark ? 96 : 20));
  el.style.setProperty("--secondary",          hv(sh, C.secondary.s * sf, clamp(C.secondary.l + b, 30, 95)));
  el.style.setProperty("--secondary-foreground", hv(sh, 10, isDark ? 92 : 20));
  el.style.setProperty("--accent",             hv(ah, C.accent.s    * sf, clamp(C.accent.l    + b, 30, 96)));
  el.style.setProperty("--accent-foreground",  hv(ah, 10, isDark ? 92 : 20));
  el.style.setProperty("--ring",               hv(ph, C.primary.s   * sf, clamp(C.primary.l   + b, 30, 93)));

  // Status colors — keep recognisable, apply brightness only
  el.style.setProperty("--destructive",            hv(0,   isDark ? 35 : 45, clamp((isDark ? 52 : 72) + b, 30, 88)));
  el.style.setProperty("--destructive-foreground", hv(0,   10, isDark ? 96 : 20));
  el.style.setProperty("--success",                hv(145, isDark ? 22 : 35, clamp((isDark ? 42 : 68) + b, 25, 85)));
  el.style.setProperty("--success-foreground",     hv(145, 10, isDark ? 92 : 20));
  el.style.setProperty("--warning",                hv(45,  isDark ? 35 : 55, clamp((isDark ? 47 : 74) + b, 30, 88)));
  el.style.setProperty("--warning-foreground",     hv(45,  10, isDark ? 92 : 20));
}

export function ThemeApplier() {
  const { resolvedTheme } = useTheme();
  const paletteId  = useUIStore((s) => s.paletteId);
  const saturation = useUIStore((s) => s.saturation);
  const brightness = useUIStore((s) => s.brightness);

  useEffect(() => {
    const palette =
      COLOR_PALETTES.find((p) => p.id === paletteId) ??
      COLOR_PALETTES.find((p) => p.id === DEFAULT_PALETTE_ID)!;
    applyPalette(palette, saturation, brightness, resolvedTheme === "dark");
  }, [paletteId, saturation, brightness, resolvedTheme]);

  return null;
}

// Exported so the settings swatches can preview the same math
export { LIGHT, DARK };
