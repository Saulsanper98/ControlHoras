"use client";

import { useMemo, useState } from "react";
import { Mail, Search, Users } from "lucide-react";
import { EmployeeRowActions } from "@/components/jefa/employee-row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSurface } from "@/components/ui/list-surface";
import { SectionEyebrow } from "@/components/ui/section-title";
import { StatusBadge } from "@/components/ui/status-badge";
import { Stagger } from "@/components/ui/stagger";

export type EmployeeRowUser = {
  id: string;
  name: string;
  email: string;
  role: "EMPLEADO" | "JEFA";
  active: boolean;
  departmentId: string | null;
};

type Dept = { id: string; name: string };

export function EmployeesDirectory({
  departments,
  users,
}: {
  departments: Dept[];
  users: EmployeeRowUser[];
}) {
  const [query, setQuery] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (onlyActive && !u.active) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, query, onlyActive]);

  const usersByDept = useMemo(() => {
    const map = new Map<string, EmployeeRowUser[]>();
    const noDept: EmployeeRowUser[] = [];
    for (const u of filtered) {
      if (!u.departmentId) {
        noDept.push(u);
        continue;
      }
      const list = map.get(u.departmentId) ?? [];
      list.push(u);
      map.set(u.departmentId, list);
    }
    return { map, noDept };
  }, [filtered]);

  return (
    <div className="space-y-8">
      <Stagger delay={70}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o email…"
              className="field-control w-full rounded-lg py-2.5 pl-9 pr-3 text-sm"
              aria-label="Buscar empleados"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
              className="accent-brand-blue"
            />
            Solo activos
          </label>
        </div>
      </Stagger>

      {departments.map((dept) => {
        const list = usersByDept.map.get(dept.id) ?? [];
        if (list.length === 0) return null;
        return (
          <section key={dept.id}>
            <SectionEyebrow>
              {dept.name} ({list.length})
            </SectionEyebrow>
            <ListSurface>
              {list.map((u) => (
                <EmployeeRow key={u.id} user={u} departments={departments} />
              ))}
            </ListSurface>
          </section>
        );
      })}

      {usersByDept.noDept.length > 0 && (
        <section>
          <SectionEyebrow>Sin departamento ({usersByDept.noDept.length})</SectionEyebrow>
          <ListSurface>
            {usersByDept.noDept.map((u) => (
              <EmployeeRow key={u.id} user={u} departments={departments} />
            ))}
          </ListSurface>
        </section>
      )}

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay empleados"
          description="Da de alta el primer empleado para empezar a gestionar controles y vacaciones."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin coincidencias"
          description="Prueba otro término de búsqueda o desactiva «Solo activos»."
        />
      ) : null}
    </div>
  );
}

function EmployeeRow({
  user,
  departments,
}: {
  user: EmployeeRowUser;
  departments: Dept[];
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="font-medium text-brand-navy">{user.name}</p>
        <p className="flex items-center gap-1 text-sm text-slate-500">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{user.email}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <StatusBadge status={user.active ? "ACTIVE" : "INACTIVE"} preset="active" />
        <EmployeeRowActions user={user} departments={departments} />
      </div>
    </div>
  );
}
