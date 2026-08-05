import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarClock,
  Umbrella,
  Newspaper,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavSection = {
  title?: string;
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
];

// ADMIN combina la gestión de la responsable con su propio flujo de empleado
// (Saúl rellena y firma su control horario como cualquier otro de Sistemas).
export const adminNavSections: NavSection[] = [
  {
    items: [{ href: "/", label: "Panel principal", icon: LayoutDashboard }],
  },
  {
    title: "Mi cuenta",
    items: [
      { href: "/control-horario", label: "Mi control horario", icon: ClipboardList },
      { href: "/horario", label: "Mi horario", icon: CalendarClock },
      { href: "/vacaciones", label: "Mis vacaciones", icon: Umbrella },
    ],
  },
  {
    title: "Gestión",
    items: [
      { href: "/jefa/controles", label: "Controles horarios", icon: ClipboardList },
      { href: "/jefa/empleados", label: "Empleados", icon: Users },
      { href: "/jefa/horarios", label: "Horarios", icon: CalendarClock },
      { href: "/jefa/vacaciones", label: "Vacaciones y horas", icon: Umbrella },
      { href: "/jefa/noticias", label: "Noticias", icon: Newspaper },
    ],
  },
];
