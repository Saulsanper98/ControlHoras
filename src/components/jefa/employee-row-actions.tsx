"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, UserCheck, UserX } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  resetEmployeePasswordAction,
  toggleEmployeeActiveAction,
} from "@/app/(app)/jefa/empleados/actions";

export function EmployeeRowActions({
  userId,
  active,
}: {
  userId: string;
  active: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    const next = !active;
    const label = next ? "activar" : "desactivar";
    if (!window.confirm(`¿${label.charAt(0).toUpperCase() + label.slice(1)} a este empleado?`)) return;

    startTransition(async () => {
      const result = await toggleEmployeeActiveAction(userId, next);
      if (result.ok) {
        showToast(next ? "Empleado activado." : "Empleado desactivado.");
        router.refresh();
      } else {
        showToast(result.error ?? "Error.", "error");
      }
    });
  }

  function handleResetPassword() {
    if (
      !window.confirm(
        "¿Restablecer la contraseña a Cambiar123!? El empleado deberá cambiarla al iniciar sesión."
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await resetEmployeePasswordAction(userId);
      if (result.ok) {
        showToast("Contraseña restablecida a Cambiar123!");
        router.refresh();
      } else {
        showToast(result.error ?? "Error.", "error");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className="flex items-center gap-1 rounded-md border border-brand-navy/15 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-brand-navy/5 disabled:opacity-60"
      >
        {active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
        {active ? "Desactivar" : "Activar"}
      </button>
      <button
        type="button"
        onClick={handleResetPassword}
        disabled={pending}
        className="flex items-center gap-1 rounded-md border border-brand-blue/30 px-2.5 py-1 text-xs font-medium text-brand-blue hover:bg-brand-blue/10 disabled:opacity-60"
      >
        <KeyRound className="h-3.5 w-3.5" />
        Reset pass
      </button>
    </div>
  );
}
