import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const PUBLIC_PATHS = ["/login"];
const CHANGE_PASSWORD_PATH = "/cambiar-contrasena";

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (req.auth && isPublic) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  if (req.auth) {
    // Revalidación en vivo contra la base de datos en cada petición. La
    // sesión JWT dura hasta 30 días y, sin esto, no reflejaría a tiempo que
    // la jefa desactivó una cuenta o cambió un rol. Esto es seguro porque en
    // esta versión de Next.js el Proxy corre en el runtime de Node.js por
    // defecto (no Edge), así que puede usar Prisma directamente.
    const dbUser = await prisma.user.findUnique({
      where: { id: req.auth.user.id },
      select: { active: true, role: true, mustChangePassword: true },
    });

    if (!dbUser || !dbUser.active) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      const response = NextResponse.redirect(loginUrl);
      // Cierra la sesión de forma robusta ante variaciones del nombre de
      // cookie de Auth.js (authjs.session-token / __Secure-authjs.session-token).
      for (const cookie of req.cookies.getAll()) {
        if (cookie.name.includes("session-token")) {
          response.cookies.delete(cookie.name);
        }
      }
      return response;
    }

    const role = dbUser.role;
    if (pathname.startsWith("/jefa") && role !== "JEFA" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }

    if (dbUser.mustChangePassword && pathname !== CHANGE_PASSWORD_PATH) {
      return NextResponse.redirect(new URL(CHANGE_PASSWORD_PATH, req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|brand).*)"],
};
