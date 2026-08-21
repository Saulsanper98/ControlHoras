import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Borra cookies de sesión Auth.js (nombres varían según secure/host). */
export function clearSessionCookies(
  req: NextRequest,
  res: NextResponse
): NextResponse {
  for (const cookie of req.cookies.getAll()) {
    if (
      cookie.name.includes("session-token") ||
      cookie.name.includes("authjs") ||
      cookie.name.includes("next-auth")
    ) {
      // path=/ es obligatorio: si no, el navegador puede no borrar la cookie.
      res.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
      res.cookies.delete({ name: cookie.name, path: "/" });
    }
  }
  return res;
}

export function hasSessionCookie(req: NextRequest): boolean {
  return req.cookies.getAll().some((c) => c.name.includes("session-token"));
}
