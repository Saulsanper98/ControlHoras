import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/");

  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-navy px-4">
      <div className="w-full max-w-sm animate-fade-slide-up">
        <div className="mb-8 flex justify-center">
          <img src="/brand/logo.svg" alt="Logo de la empresa" className="h-16 w-auto" />
        </div>
        <div className="rounded-xl bg-white p-8 shadow-xl">
          <h1 className="mb-1 text-xl font-semibold text-brand-navy">
            Portal del Empleado
          </h1>
          <p className="mb-6 text-sm text-slate-500">
            Inicia sesión con tu cuenta corporativa
          </p>
          <LoginForm callbackUrl={callbackUrl ?? "/"} />
        </div>
      </div>
    </div>
  );
}
