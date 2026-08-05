import { redirect } from "next/navigation";
import { auth } from "@/auth";
// Ruta canónica; también existe copia en ./login-shell
import { LoginShell } from "@/components/auth/login-shell";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/");

  const { callbackUrl } = await searchParams;

  return <LoginShell callbackUrl={callbackUrl ?? "/"} />;
}
