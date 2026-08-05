import { auth } from "@/auth";
import { canManage, hasOwnEmployeeData } from "@/lib/roles";

/** Sesión autenticada, sin restricción de rol. */
export async function verifiedSession() {
  const session = await auth();
  if (!session) return null;
  return session;
}

/** Sesión de un usuario con permisos de gestión (JEFA/ADMIN). */
export async function requireManagerSession() {
  const session = await auth();
  if (!session || !canManage(session.user.role)) return null;
  return session;
}

/** Sesión de un usuario con datos propios de empleado (EMPLEADO/ADMIN). */
export async function requireEmployeeSession() {
  const session = await auth();
  if (!session || !hasOwnEmployeeData(session.user.role)) return null;
  return session;
}
