"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Pencil, UserCheck, UserPlus, UserX } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { FieldSelect } from "@/components/ui/field-select";
import { TEMP_EMPLOYEE_PASSWORD } from "@/lib/labels";
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

function tempPasswordToast(
  showToast: ReturnType<typeof useToast>["showToast"],
  prefix: string
) {
  const message = `${prefix} Contraseña temporal: ${TEMP_EMPLOYEE_PASSWORD}`;
  showToast(message, "success", {
    action: {
      label: "Copiar contraseña",
      onClick: () => {
        void navigator.clipboard?.writeText(TEMP_EMPLOYEE_PASSWORD);
      },
    },
  });
}

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
        tempPasswordToast(
          showToast,
          "Empleado creado. Deberá cambiarla al entrar."
        );
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
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        <UserPlus className="h-4 w-4" />
        Alta de empleado
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo empleado">
        <div className="space-y-3">
          <div>
            <label htmlFor="emp-create-name" className="mb-1 block text-xs font-medium text-slate-500">
              Nombre completo
            </label>
            <input
              id="emp-create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre y apellidos"
              className="field-control w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="emp-create-email" className="mb-1 block text-xs font-medium text-slate-500">
              Email
            </label>
            <input
              id="emp-create-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@empresa.com"
              type="email"
              className="field-control w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="emp-create-dept" className="mb-1 block text-xs font-medium text-slate-500">
              Departamento
            </label>
            <FieldSelect
              id="emp-create-dept"
              value={departmentId}
              onChange={setDepartmentId}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
          </div>
          <p className="text-xs text-slate-500">
            Se generará una contraseña temporal. El empleado deberá cambiarla al iniciar sesión.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="btn-primary w-full disabled:opacity-60"
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
  const { confirm } = useConfirm();
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [departmentId, setDepartmentId] = useState(user.departmentId ?? departments[0]?.id ?? "");

  async function handleToggle() {
    const next = !user.active;
    if (!next) {
      const ok = await confirm({
        title: "Desactivar empleado",
        message: `¿Desactivar a ${user.name}? No podrá iniciar sesión hasta que se reactive.`,
        variant: "danger",
        confirmLabel: "Desactivar",
      });
      if (!ok) return;
    }
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

  async function handleResetPassword() {
    const ok = await confirm({
      title: "Restablecer contraseña",
      message: `Se generará una contraseña temporal para ${user.name}. Deberá cambiarla al entrar.`,
      confirmLabel: "Restablecer",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await resetEmployeePasswordAction(user.id);
      if (result.ok) {
        tempPasswordToast(showToast, "Contraseña restablecida.");
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
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-1">
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        disabled={pending}
        className="btn-sm btn-ghost"
      >
        <Pencil className="h-4 w-4" />
        Editar
      </button>
      <button
        type="button"
        onClick={() => void handleToggle()}
        disabled={pending}
        className="btn-sm btn-ghost"
      >
        {user.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
        {user.active ? "Desactivar" : "Activar"}
      </button>
      <button
        type="button"
        onClick={() => void handleResetPassword()}
        disabled={pending}
        className="btn-sm btn-ghost text-brand-blue hover:text-brand-blue"
      >
        <KeyRound className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">Restablecer contraseña</span>
      </button>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar empleado">
        <div className="space-y-3">
          <div>
            <label htmlFor={`emp-edit-name-${user.id}`} className="mb-1 block text-xs font-medium text-slate-500">
              Nombre completo
            </label>
            <input
              id={`emp-edit-name-${user.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field-control w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor={`emp-edit-email-${user.id}`} className="mb-1 block text-xs font-medium text-slate-500">
              Email
            </label>
            <input
              id={`emp-edit-email-${user.id}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="field-control w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor={`emp-edit-dept-${user.id}`} className="mb-1 block text-xs font-medium text-slate-500">
              Departamento
            </label>
            <FieldSelect
              id={`emp-edit-dept-${user.id}`}
              value={departmentId}
              onChange={setDepartmentId}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={handleSave}
            className="btn-primary w-full disabled:opacity-60"
          >
            Guardar cambios
          </button>
        </div>
      </Modal>
    </div>
  );
}
