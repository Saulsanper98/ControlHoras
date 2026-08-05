import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Hash "señuelo" usado para normalizar el tiempo de respuesta cuando el
// usuario no existe o está inactivo. Sin esto, saltarse el bcrypt.compare()
// en ese camino hace la respuesta perceptiblemente más rápida que cuando la
// contraseña es simplemente incorrecta, permitiendo enumerar emails válidos
// por temporización. El valor no corresponde a ninguna contraseña real.
const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8Q0f6a6b8I8/6t3aRMdT8FRZ5uT.Nm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          include: { department: true },
        });

        if (!user || !user.active) {
          // Comparación señuelo: mantiene el tiempo de respuesta similar al
          // camino de "contraseña incorrecta" para no filtrar por temporización
          // si un email existe o está activo.
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
        session.user.role = token.role as "EMPLEADO" | "JEFA" | "ADMIN";
        session.user.departmentId = token.departmentId as string | null;
        session.user.departmentName = token.departmentName as string | null;
      }
      return session;
    },
  },
});
