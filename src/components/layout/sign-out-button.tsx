"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export function SignOutButton({ variant = "sidebar" }: { variant?: "sidebar" | "glass" }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectTo: "/login" })}
      className={cn(
        "flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        variant === "glass"
          ? "justify-center border border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
          : "text-slate-300 hover:bg-brand-navy-light hover:text-white"
      )}
    >
      <LogOut className="h-4 w-4" />
      Cerrar sesión
    </button>
  );
}
