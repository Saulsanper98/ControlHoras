"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Pencil, UserCheck, UserPlus, UserX } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { FieldSelect } from "@/components/ui/field-select";
import {
  createEmployeeAction,
  resetEmployeePasswordAction,
  toggleEmployeeActiveAction,
  updateEmployeeAction,
} from "@/app/(app)/jefa/empleados/actions";

type Dept = { id: string; name: string };
type Employee = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  departmentId: string | null;
};

export function EmployeeCreateForm({ departments }: { departments: Dept[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "");

  function submit() {
    startTransition(async () => {
      const result = await createEmployeeAction({ name, email, departmentId });
      if (result.ok) {
        showToast("Empleado creado. Deberá cambiar la contraseña temporal al entrar.");
        setOpen(false);
        setName("");
        setEmail("");
        router.refresh();
      } else {
        showToast(result.error ?? "Error.", "error");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90"
      >
        <UserPlus className="h-4 w-4" />
        Alta de empleado
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo empleado">
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre completo"
            className="field-control w-full px-3 py-2 text-sm"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="field-control w-full px-3 py-2 text-sm"
          />
          <FieldSelect
            value={departmentId}
            onChange={setDepartmentId}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
          />
          <p className="text-xs text-slate-500">
            Se generará una contraseña temporal. El empleado deberá cambiarla al iniciar sesión.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="w-full rounded-lg bg-brand-blue py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Crear empleado
          </button>
        </div>
      </Modal>
    </>
  );
}

export function EmployeeRowActions({
  user,
  departments,
}: {
  user: Employee;
  departments: Dept[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [departmentId, setDepartmentId] = useState(user.departmentId ?? departments[0]?.id ?? "");

  function handleToggle() {
    const next = !user.active;
    startTransition(async () => {
      const result = await toggleEmployeeActiveAction(user.id, next);
      if (result.ok) {
        showToast(next ? "Empleado activado." : "Empleado desactivado.");
        router.refresh();
      } else {
        showToast(result.error ?? "Error.", "error");
      }
    });
  }

  function handleResetPassword() {
    startTransition(async () => {
      const result = await resetEmployeePasswordAction(user.id);
      if (result.ok) {
        showToast("Contraseña restablecida. El empleado deberá cambiarla al entrar.");
        router.refresh();
      } else {
        showToast(result.error ?? "Error.", "error");
      }
    });
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateEmployeeAction({
        userId: user.id,
        name,
        email,
        departmentId,
      });
      if (result.ok) {
        showToast("Empleado actualizado.");
        setEditOpen(false);
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
        onClick={() => setEditOpen(true)}
        disabled={pending}
        className="flex items-center gap-1 rounded-md border border-brand-navy/15 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-brand-navy/5 disabled:opacity-60"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar
      </button>
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className="flex items-center gap-1 rounded-md border border-brand-navy/15 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-brand-navy/5 disabled:opacity-60"
      >
        {user.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
        {user.active ? "Desactivar" : "Activar"}
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

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar empleado">
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field-control w-full px-3 py-2 text-sm"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="field-control w-full px-3 py-2 text-sm"
          />
          <FieldSelect
            value={departmentId}
            onChange={setDepartmentId}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
          />
          <button
            type="button"
            disabled={pending}
            onClick={handleSave}
            className="w-full rounded-lg bg-brand-blue py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Guardar cambios
          </button>
        </div>
      </Modal>
    </div>
  );
}
