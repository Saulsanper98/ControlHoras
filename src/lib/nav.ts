import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarClock,
  Umbrella,
  Newspaper,
  Users,
  BarChart3,
  Shield,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavGroup = {
  id: string;
  label: string | null;
  items: NavItem[];
};

export const employeeNav: NavItem[] = [
  { href: "/", label: "Panel principal", icon: LayoutDashboard },
  { href: "/control-horario", label: "Control horario", icon: ClipboardList },
  { href: "/horario", label: "Mi horario", icon: CalendarClock },
  { href: "/vacaciones", label: "Vacaciones y horas", icon: Umbrella },
  { href: "/noticias", label: "Noticias", icon: Newspaper },
];

export const jefaNav: NavItem[] = [
  { href: "/", label: "Panel principal", icon: LayoutDashboard },
  { href: "/jefa/controles", label: "Controles horarios", icon: ClipboardList },
  { href: "/jefa/empleados", label: "Empleados", icon: Users },
  { href: "/jefa/horarios", label: "Horarios", icon: CalendarClock },
  { href: "/jefa/vacaciones", label: "Vacaciones y horas", icon: Umbrella },
  { href: "/jefa/noticias", label: "Noticias", icon: Newspaper },
  { href: "/jefa/informes", label: "Informe de horas", icon: BarChart3 },
  { href: "/jefa/auditoria", label: "Auditoría", icon: Shield },
];

/** Secciones del menú de la responsable (Panel sin label de grupo). */
export const jefaNavGroups: NavGroup[] = [
  {
    id: "panel",
    label: null,
    items: [{ href: "/", label: "Panel principal", icon: LayoutDashboard }],
  },
  {
    id: "operativa",
    label: "Operativa",
    items: [
      { href: "/jefa/controles", label: "Controles horarios", icon: ClipboardList },
      { href: "/jefa/horarios", label: "Horarios", icon: CalendarClock },
      { href: "/jefa/informes", label: "Informe de horas", icon: BarChart3 },
    ],
  },
  {
    id: "personas",
    label: "Personas",
    items: [
      { href: "/jefa/empleados", label: "Empleados", icon: Users },
      { href: "/jefa/vacaciones", label: "Vacaciones y horas", icon: Umbrella },
    ],
  },
  {
    id: "comunicacion",
    label: "Comunicación",
    items: [{ href: "/jefa/noticias", label: "Noticias", icon: Newspaper }],
  },
  {
    id: "sistema",
    label: "Sistema",
    items: [{ href: "/jefa/auditoria", label: "Auditoría", icon: Shield }],
  },
];

/** Título corto para cabecera móvil según ruta. */
/** Orden: rutas más específicas primero. */
export const MOBILE_TITLE_BY_PATH: { match: string; title: string }[] = [
  { match: "/jefa/vacaciones/calendario", title: "Calendario" },
  { match: "/jefa/controles", title: "Controles" },
  { match: "/jefa/empleados", title: "Empleados" },
  { match: "/jefa/horarios", title: "Horarios" },
  { match: "/jefa/vacaciones", title: "Vacaciones" },
  { match: "/jefa/noticias", title: "Noticias" },
  { match: "/jefa/informes", title: "Informes" },
  { match: "/jefa/auditoria", title: "Auditoría" },
  { match: "/control-horario", title: "Control horario" },
  { match: "/vacaciones", title: "Vacaciones" },
  { match: "/horario", title: "Mi horario" },
  { match: "/noticias", title: "Noticias" },
  { match: "/cambiar-contrasena", title: "Contraseña" },
];

export function mobileTitleForPath(pathname: string): string {
  for (const entry of MOBILE_TITLE_BY_PATH) {
    if (pathname === entry.match || pathname.startsWith(`${entry.match}/`)) {
      return entry.title;
    }
  }
  return pathname === "/" ? "Panel" : "Portal";
}
