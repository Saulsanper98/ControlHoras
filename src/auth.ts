import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8Q0f6a6b8I8/6t3aRMdT8FRZ5uT.Nm";

const authSecret =
  process.env.AUTH_SECRET ??
  (process.env.NODE_ENV === "production"
    ? undefined
    : "dev-only-insecure-auth-secret-change-me");

function credString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string") return value[0].trim();
  return "";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: authSecret,
  trustHost: true,
  // HTTP en LAN (192.168.x.x): si va en secure, el navegador tira la cookie.
  useSecureCookies: process.env.NODE_ENV === "production",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credString(credentials?.email).toLowerCase();
        const password = credString(credentials?.password);
        if (!email || !password) return null;

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email },
            include: { department: true },
          });
        } catch (error) {
          console.error("[auth] Error al consultar usuario:", error);
          throw error;
        }

        if (!user || !user.active) {
          await bcrypt.compare(password, DUMMY_HASH);
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          departmentName: user.department?.name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.departmentId = user.departmentId;
        token.departmentName = user.departmentName;
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "EMPLEADO" | "JEFA";
        session.user.departmentId = token.departmentId as string | null;
        session.user.departmentName = token.departmentName as string | null;
      }
      return session;
    },
  },
});
