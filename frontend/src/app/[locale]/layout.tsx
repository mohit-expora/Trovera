import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import { routing } from "@/i18n/routing";
import { SWRProvider } from "@/lib/swr-config";
import { TroveraToaster } from "@/components/common/Feedback/Toast";
import { ThemeApplier } from "@/components/common/ThemeApplier";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Trovera — Library Management",
    template: "%s | Trovera",
  },
  description: "Modern library management system",
};

interface LocaleLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({ children, params: { locale } }: LocaleLayoutProps) {
  if (!routing.locales.includes(locale as "en" | "hi" | "es" | "fr")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={inter.variable}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="trovera-theme"
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <SWRProvider>
              <ThemeApplier />
              {children}
              <TroveraToaster />
            </SWRProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
