import { LoginShell } from "@/components/auth/login-shell";

/**
 * No llamamos a auth() aquí a propósito.
 * El proxy ya redirige a "/" si hay sesión válida. Si la cookie JWT está
 * cifrada con otro AUTH_SECRET, auth() lanza JWTSessionError
 * ("no matching decryption secret") en bucle; el proxy borra esa cookie.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return <LoginShell callbackUrl={callbackUrl ?? "/"} />;
}
