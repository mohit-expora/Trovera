import { NextResponse } from "next/server";

// Google sign-in now uses the Identity Services (GSI) client-side library.
// The browser gets an ID token directly from Google and POSTs it to the
// backend at POST /api/v1/auth/google. This server-side OAuth redirect
// route is no longer in use.
export function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
