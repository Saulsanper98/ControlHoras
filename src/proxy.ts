import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { clearSessionCookies, hasSessionCookie } from "@/lib/clear-session-cookies";

const PUBLIC_PATHS = ["/login"];

function sessionUserId(authSession: { user?: { id?: string } } | null): string | null {
  const id = authSession?.user?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

/**
 * Solo auth + roles desde el JWT. Nada de Prisma aquí:
 * una consulta BD lenta/fallida tras el login provocaba
 * / → /login → / en bucle (la pass se aceptaba y volvías al login).
 * active / mustChangePassword se revalidan en el layout de la app.
 */
export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const userId = sessionUserId(req.auth);
  const role = req.auth?.user?.role;

  // Cookie basura (otro AUTH_SECRET): solo limpiar en /login.
  if (!req.auth && hasSessionCookie(req) && isPublic) {
    return clearSessionCookies(req, NextResponse.next());
  }

  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const res = NextResponse.redirect(loginUrl);
    if (hasSessionCookie(req)) clearSessionCookies(req, res);
    return res;
  }

  if (req.auth && isPublic) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  if (req.auth) {
    if (!userId) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      return clearSessionCookies(req, NextResponse.redirect(loginUrl));
    }

    if (pathname.startsWith("/jefa") && role !== "JEFA") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }

    const employeeOnlyPrefixes = ["/control-horario", "/horario", "/vacaciones"];
    if (
      role === "JEFA" &&
      employeeOnlyPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
    ) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|brand).*)"],
};
