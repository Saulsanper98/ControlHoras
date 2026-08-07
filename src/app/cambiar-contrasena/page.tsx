import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChangePasswordForm } from "./change-password-form";
import { LoginVideoBackground } from "@/components/auth/login-video-background";
import { SignOutButton } from "@/components/layout/sign-out-button";

export default async function CambiarContrasenaPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mustChangePassword: true },
  });

  const mustChange = Boolean(user?.mustChangePassword);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-navy px-4">
      <LoginVideoBackground />
      <div className="relative z-10 w-full max-w-sm animate-fade-slide-up">
        <div className="mb-8 flex justify-center drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
          <img src="/brand/logo.svg" alt="Logo de la empresa" className="h-16 w-auto" />
        </div>
        <div className="rounded-2xl border border-white/25 bg-white/12 p-8 shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-2xl backdrop-saturate-150">
          {!mustChange && (
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-white/70 transition hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Volver al portal
            </Link>
          )}
          <h1 className="font-display mb-1 text-xl font-semibold text-white">Cambiar contraseña</h1>
          <p className="mb-6 text-sm text-slate-300">
            {mustChange
              ? "Por seguridad, debes cambiar tu contraseña antes de continuar."
              : "Actualiza tu contraseña de acceso."}
          </p>
          <ChangePasswordForm />
          {mustChange && (
            <div className="mt-4 border-t border-white/15 pt-4">
              <SignOutButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
