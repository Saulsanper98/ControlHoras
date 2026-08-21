import { APP_TIMEZONE, formatDate, formatDateShort } from "@/lib/format-date";

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatRelativeTime(value: Date | string): string {
  const date = asDate(value);
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} día${days === 1 ? "" : "s"}`;

  const nowDate = new Date(now);
  if (date.getFullYear() !== nowDate.getFullYear()) {
    return formatDate(date);
  }
  return formatDateShort(date);
}

/** Utilidad por si algún consumidor necesita la zona explícita. */
export { APP_TIMEZONE };
