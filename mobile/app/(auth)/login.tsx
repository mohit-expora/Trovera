import { useState } from "react";
import {
  View, Text, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/store/authStore";
import { axiosInstance } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import palette from "@/constants/colors";
import type { UserProfile } from "@/types/user";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";

export default function LoginScreen() {
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    setErrorMsg("");
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setErrorMsg("Email and password are required.");
      return;
    }

    console.log("[Login] Attempting login:", trimmedEmail, "→", API_URL);
    setLoading(true);

    try {
      const res = await axiosInstance.post<{
        success: boolean;
        data: { access_token: string; user: UserProfile };
      }>("/auth/login", { email: trimmedEmail, password: trimmedPassword });

      console.log("[Login] Response received, success:", res.data.success);

      const token = res.data.data.access_token;
      const user = res.data.data.user;

      if (!token || !user) {
        console.error("[Login] Missing token or user in response", res.data);
        setErrorMsg("Unexpected server response. Please try again.");
        return;
      }

      console.log("[Login] Setting user:", user.email, user.role);
      await setUser(user, token);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { error?: { message?: string } } };
        message?: string;
        code?: string;
      };

      const status = axiosErr?.response?.status;
      const serverMsg = axiosErr?.response?.data?.error?.message;
      const networkMsg = axiosErr?.message;
      const code = axiosErr?.code;

      console.error("[Login] Error:", { status, serverMsg, networkMsg, code });

      if (code === "ECONNABORTED" || networkMsg?.includes("Network") || !axiosErr.response) {
        setErrorMsg(`Cannot reach server.\nURL: ${API_URL}\n\nMake sure the backend is running and the IP in .env is correct.`);
      } else if (status === 401) {
        setErrorMsg("Invalid email or password.");
      } else {
        setErrorMsg(serverMsg ?? networkMsg ?? "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={["#e8e0ff", "#d8eaff", "#f8f6ff"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: 36 }}>
            <View
              style={{
                width: 72, height: 72, borderRadius: 20,
                backgroundColor: palette.primary,
                alignItems: "center", justifyContent: "center",
                marginBottom: 14,
                shadowColor: palette.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
              }}
            >
              <Text style={{ fontSize: 36 }}>📚</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: "800", color: palette.foreground, letterSpacing: -0.5 }}>
              Trovera
            </Text>
            <Text style={{ fontSize: 13, color: palette.mutedForeground, marginTop: 3 }}>
              Library Management
            </Text>
          </View>

          {/* Card */}
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              borderRadius: 20, padding: 24, gap: 14,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.1, shadowRadius: 20, elevation: 6,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", color: palette.foreground }}>
              Sign in
            </Text>

            {/* Error banner */}
            {!!errorMsg && (
              <View style={{
                backgroundColor: `${palette.destructive}15`,
                borderRadius: 10, padding: 12,
                borderLeftWidth: 3, borderLeftColor: palette.destructive,
              }}>
                <Text style={{ fontSize: 13, color: palette.destructive, lineHeight: 18 }}>
                  {errorMsg}
                </Text>
              </View>
            )}

            <Input
              label="Email"
              placeholder="admin@trovera.dev"
              value={email}
              onChangeText={(t) => { setEmail(t); setErrorMsg(""); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
            />

            <View style={{ gap: 6 }}>
              <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={(t) => { setPassword(t); setErrorMsg(""); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                spellCheck={false}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={{ alignSelf: "flex-end" }}>
                <Text style={{ fontSize: 12, color: palette.primary }}>
                  {showPassword ? "Hide" : "Show"} password
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              label="Sign in"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={{ marginTop: 2 }}
            />
          </View>

          {/* Debug URL indicator */}
          <Text style={{ textAlign: "center", color: palette.mutedForeground, fontSize: 10, marginTop: 16, opacity: 0.6 }}>
            {API_URL}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
