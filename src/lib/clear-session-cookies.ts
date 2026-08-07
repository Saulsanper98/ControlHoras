import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Borra cookies de sesión Auth.js (nombres varían según secure/host). */
export function clearSessionCookies(
  req: NextRequest,
  res: NextResponse
): NextResponse {
  for (const cookie of req.cookies.getAll()) {
    if (cookie.name.includes("session-token")) {
      res.cookies.delete(cookie.name);
    }
  }
  return res;
}

export function hasSessionCookie(req: NextRequest): boolean {
  return req.cookies.getAll().some((c) => c.name.includes("session-token"));
}
