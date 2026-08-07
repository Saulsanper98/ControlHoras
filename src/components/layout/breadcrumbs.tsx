"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  jefa: "Gestión",
  controles: "Controles horarios",
  empleados: "Empleados",
  horarios: "Horarios",
  vacaciones: "Vacaciones",
  noticias: "Noticias",
  calendario: "Calendario",
  informes: "Informe de horas",
  auditoria: "Auditoría",
  "control-horario": "Control horario",
  horario: "Mi horario",
};

export function Breadcrumbs({ tail }: { tail?: string }) {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { href: string; label: string }[] = [{ href: "/", label: "Inicio" }];

  let path = "";
  for (const part of parts) {
    path += `/${part}`;
    if (/^[a-z0-9]{20,}$/i.test(part)) continue;
    crumbs.push({
      href: path,
      label: SEGMENT_LABELS[part] ?? part,
    });
  }

  if (tail) {
    crumbs.push({ href: pathname, label: tail });
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Ruta" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-slate-500">
      <Link href="/" aria-label="Inicio" className="inline-flex items-center hover:text-brand-blue">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.slice(1).map((c, i) => (
        <span key={c.href} className="inline-flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-slate-400" />
          {i === crumbs.length - 2 || tail ? (
            <span className="font-medium text-brand-navy">{c.label}</span>
          ) : (
            <Link href={c.href} className="hover:text-brand-blue">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
