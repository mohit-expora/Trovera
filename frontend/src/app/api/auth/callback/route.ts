import { NextResponse } from "next/server";

// OAuth code-exchange callback is no longer used.
// Google sign-in is handled client-side via GSI (ID token → POST /auth/google).
export function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
