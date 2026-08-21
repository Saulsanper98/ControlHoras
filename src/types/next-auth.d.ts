import type { DefaultSession } from "next-auth";
import type { AppRole } from "@/lib/roles";

declare module "next-auth" {
  interface User {
    role: AppRole;
    departmentId: string | null;
    departmentName: string | null;
    mustChangePassword?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: AppRole;
      departmentId: string | null;
      departmentName: string | null;
      mustChangePassword?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
    departmentId: string | null;
    departmentName: string | null;
    mustChangePassword?: boolean;
  }
}
