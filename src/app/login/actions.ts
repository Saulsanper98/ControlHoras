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

export async function loginAction(
  _prevState: { error: string | null; redirectTo?: string | null },
  formData: FormData
): Promise<{ error: string | null; redirectTo?: string | null }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/");

  try {
    // Sin redirect automático: el cliente anima la salida y navega después.
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
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
      return { error: "Usuario o contraseña incorrectos.", redirectTo: null };
    }
    throw error;
  }
}
