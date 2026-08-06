import type { DefaultSession } from "next-auth";
import type { AppRole } from "@/lib/roles";

declare module "next-auth" {
  interface User {
    role: AppRole;
    departmentId: string | null;
    departmentName: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: AppRole;
      departmentId: string | null;
      departmentName: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
    departmentId: string | null;
    departmentName: string | null;
  }
}
