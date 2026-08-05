import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginShell } from "./login-shell";

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
