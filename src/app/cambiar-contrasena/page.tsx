import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChangePasswordForm } from "./change-password-form";

export default async function CambiarContrasenaPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mustChangePassword: true },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-navy px-4">
      <div className="w-full max-w-sm animate-fade-slide-up">
        <div className="mb-8 flex justify-center">
          <img src="/brand/logo.svg" alt="Logo de la empresa" className="h-16 w-auto" />
        </div>
        <div className="rounded-xl bg-white p-8 shadow-xl">
          <h1 className="mb-1 text-xl font-semibold text-brand-navy">Cambiar contraseña</h1>
          <p className="mb-6 text-sm text-slate-500">
            {user?.mustChangePassword
              ? "Por seguridad, debes cambiar tu contraseña antes de continuar."
              : "Actualiza tu contraseña de acceso."}
          </p>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
