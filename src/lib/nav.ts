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
