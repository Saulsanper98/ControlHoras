"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

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
    if (error instanceof AuthError) {
      return { error: "Usuario o contraseña incorrectos.", redirectTo: null };
    }
    throw error;
  }
}
