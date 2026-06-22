"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/types/api";
import type { UserProfile } from "@/types/user";
import {
  THEMES, LOCALES,
  COLOR_PALETTES, DEFAULT_PALETTE_ID, DEFAULT_SATURATION, DEFAULT_BRIGHTNESS,
} from "@/config/theme";

// ── Profile Section ────────────────────────────────────────────────────────

function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const res = await api.patch<ApiSuccess<UserProfile>>(`/users/${user.id}`, {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      });
      updateUser(res.data);
      toast.success("Profile updated.");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Profile</CardTitle>
        <CardDescription>Update your personal information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Full Name</Label>
            <Input id="profile-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={user?.email ?? ""} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-phone">Phone</Label>
            <Input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-address">Address</Label>
          <textarea
            id="profile-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            placeholder="Your address"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Security Section ───────────────────────────────────────────────────────

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Security</CardTitle>
        <CardDescription>Manage your account password.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Password change is coming soon. Please contact your administrator to reset your password.
          </p>
        </div>
        <div className="space-y-3 opacity-50 pointer-events-none select-none" aria-disabled="true">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" disabled />
          </div>
          <div className="flex justify-end"><Button disabled>Change Password</Button></div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Appearance Section ─────────────────────────────────────────────────────

function AppearanceSection() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const paletteId      = useUIStore((s) => s.paletteId);
  const saturation     = useUIStore((s) => s.saturation);
  const brightness     = useUIStore((s) => s.brightness);
  const setPaletteId   = useUIStore((s) => s.setPaletteId);
  const setSaturation  = useUIStore((s) => s.setSaturation);
  const setBrightness  = useUIStore((s) => s.setBrightness);
  const resetAppearance = useUIStore((s) => s.resetAppearance);
  const locale         = useUIStore((s) => s.locale);
  const setLocale      = useUIStore((s) => s.setLocale);

  const isModified =
    paletteId !== DEFAULT_PALETTE_ID ||
    saturation !== DEFAULT_SATURATION ||
    brightness !== DEFAULT_BRIGHTNESS;

  // True pastel base values — mirrors ThemeApplier constants
  const sf = saturation / 100;
  const b  = brightness;
  const [pS, pL]  = isDark ? [28, 62] : [38, 78];
  const [s2S, s2L]= isDark ? [24, 48] : [42, 83];
  const [aS, aL]  = isDark ? [24, 55] : [42, 85];

  function swatchColor(h: number, baseS: number, baseL: number) {
    const s = Math.min(100, Math.max(0, Math.round(baseS * sf)));
    const l = Math.min(95, Math.max(5, Math.round(baseL + b)));
    return `hsl(${h} ${s}% ${l}%)`;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Appearance</CardTitle>
            <CardDescription>Customize colors and theme.</CardDescription>
          </div>
          {isModified && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground -mt-1"
              onClick={() => { resetAppearance(); toast.success("Reset to defaults."); }}
            >
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Mode */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Mode</p>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all capitalize ${
                  theme === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-muted"
                }`}
              >
                {t === "light" ? "☀️" : t === "dark" ? "🌙" : "💻"} {t}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Palette */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Color Palette</p>
          <div className="flex gap-3 flex-wrap">
            {COLOR_PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaletteId(p.id)}
                className={`relative flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all hover:scale-105 ${
                  paletteId === p.id
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {paletteId === p.id && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">✓</span>
                )}
                <div className="flex gap-1">
                  <span className="h-5 w-5 rounded-full shadow-sm border border-black/10"
                    style={{ background: swatchColor(p.primaryHue,   pS,  pL)  }} />
                  <span className="h-5 w-5 rounded-full shadow-sm border border-black/10"
                    style={{ background: swatchColor(p.secondaryHue, s2S, s2L) }} />
                  <span className="h-5 w-5 rounded-full shadow-sm border border-black/10"
                    style={{ background: swatchColor(p.accentHue,    aS,  aL)  }} />
                </div>
                <span className="text-xs font-medium">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Tuning */}
        <div className="space-y-5">
          <p className="text-sm font-medium">Tuning</p>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm text-muted-foreground">Saturation</Label>
              <span className="text-xs tabular-nums text-muted-foreground">{saturation}%</span>
            </div>
            <Slider
              min={30} max={170} step={5}
              value={[saturation]}
              onValueChange={(vals: number[]) => setSaturation(vals[0])}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Muted</span><span>Vivid</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm text-muted-foreground">Brightness</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {brightness > 0 ? `+${brightness}` : brightness}
              </span>
            </div>
            <Slider
              min={-15} max={15} step={1}
              value={[brightness]}
              onValueChange={(vals: number[]) => setBrightness(vals[0])}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Darker</span><span>Lighter</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Language */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Language</p>
          <Select value={locale} onValueChange={(v) => setLocale(v as "en" | "hi" | "es" | "fr")}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LOCALES).map(([code, label]) => (
                <SelectItem key={code} value={code}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </CardContent>
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, security, and preferences.</p>
      </div>
      <ProfileSection />
      <SecuritySection />
      <AppearanceSection />
    </div>
  );
}
