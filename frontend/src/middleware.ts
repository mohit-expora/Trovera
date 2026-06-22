import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_PATHS = ["/login", "/signup", "/verify-email", "/forgot-password", "/reset-password"];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract locale from path
  const localePattern = /^\/([a-z]{2})(\/|$)/;
  const match = pathname.match(localePattern);
  const locale = match ? match[1] : "en";
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

  // Check if this is a public route
  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/")
  );
  const isApiRoute = pathname.startsWith("/api/");

  if (isApiRoute) return NextResponse.next();

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
