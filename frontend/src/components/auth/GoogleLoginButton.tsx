"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import type { ApiSuccess } from "@/types/api";
import type { UserProfile } from "@/types/user";
import { api } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

export function GoogleLoginButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const locale = useLocale();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const renderButton = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            const result = await api.post<ApiSuccess<{ user: UserProfile }>>(
              "/auth/google",
              { id_token: response.credential }
            );
            setUser(result.data.user);
            router.push(`/${locale}/dashboard`);
          } catch {
            toast.error("Google sign-in failed. Please try again.");
          }
        },
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        width: containerRef.current.clientWidth || 400,
        text: "continue_with",
        shape: "rectangular",
      });
    };

    if (window.google?.accounts?.id) {
      renderButton();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = renderButton;
      document.head.appendChild(script);
      return () => {
        if (document.head.contains(script)) document.head.removeChild(script);
      };
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="w-full flex justify-center min-h-[40px]" />;
}
