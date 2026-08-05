"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { checkLoginRateLimit, recordLoginFailure } from "@/lib/login-rate-limit";

export async function loginAction(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/");

  const rateLimit = checkLoginRateLimit(email);
  if (rateLimit.blocked) {
    return {
      error: `Demasiados intentos fallidos. Inténtalo de nuevo en ${rateLimit.retryAfterMinutes} minuto(s).`,
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
    return { error: null };
  } catch (error) {
    if (error instanceof AuthError) {
      recordLoginFailure(email);
      return { error: "Usuario o contraseña incorrectos." };
    }
    throw error;
  }
}
