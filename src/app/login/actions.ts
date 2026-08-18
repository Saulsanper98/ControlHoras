"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

function isDatabaseUnreachable(error: unknown): boolean {
  const messages: string[] = [];
  let current: unknown = error;
  for (let i = 0; i < 5 && current; i += 1) {
    if (current instanceof Error) {
      messages.push(current.message);
      current = current.cause;
      continue;
    }
    if (typeof current === "object" && current !== null && "message" in current) {
      messages.push(String((current as { message: unknown }).message));
    }
    break;
  }
  const blob = messages.join("\n");
  return (
    blob.includes("Can't reach database server") ||
    blob.includes("P1001") ||
    blob.includes("ECONNREFUSED")
  );
}

function firstNonEmpty(formData: FormData, keys: string[]): string {
  for (const key of keys) {
    const values = formData.getAll(key);
    for (const value of values) {
      if (typeof value !== "string") continue;
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return "";
}

export async function loginAction(
  _prevState: { error: string | null; redirectTo?: string | null },
  formData: FormData
): Promise<{ error: string | null; redirectTo?: string | null }> {
  // Gestores de contraseñas a veces inyectan otro input name=password vacío.
  const email = firstNonEmpty(formData, ["email", "username", "loginEmail"]);
  const password = firstNonEmpty(formData, ["password", "loginPassword"]);
  const rawCallback = String(formData.get("callbackUrl") ?? "/");
  const callbackUrl =
    rawCallback.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : "/";

  if (!email || !password) {
    return { error: "Usuario o contraseña incorrectos.", redirectTo: null };
  }

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result && typeof result === "object" && "error" in result && result.error) {
      return { error: "Usuario o contraseña incorrectos.", redirectTo: null };
    }

    return { error: null, redirectTo: callbackUrl || "/" };
  } catch (error) {
    if (isDatabaseUnreachable(error)) {
      return {
        error: "No se puede conectar con la base de datos. Inténtalo más tarde.",
        redirectTo: null,
      };
    }
    if (error instanceof AuthError) {
      const code = "type" in error ? String(error.type) : error.name;
      if (code === "CredentialsSignin") {
        return { error: "Usuario o contraseña incorrectos.", redirectTo: null };
      }
      console.error("[login] AuthError:", code, error.message);
      return {
        error: "No se pudo iniciar sesión. Recarga la página e inténtalo de nuevo.",
        redirectTo: null,
      };
    }
    throw error;
  }
}
