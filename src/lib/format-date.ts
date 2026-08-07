/** Zona horaria de la organización (Gran Canaria). Fija SSR = cliente. */
export const APP_TIMEZONE = "Atlantic/Canary";

export const MONTH_NAMES_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export const MONTH_SHORT_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const;

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Extrae YYYY-MM-DD de un Date/@db.Date o ISO sin desfase de día. */
export function toDateKey(value: Date | string): string {
  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const d = asDate(value);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Medianoche civil en UTC a partir de YYYY-MM-DD (seguro para @db.Date). */
export function dateKeyToUtcNoon(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export function formatDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  }
): string {
  const key = toDateKey(value);
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: APP_TIMEZONE,
    ...options,
  }).format(dateKeyToUtcNoon(key));
}

export function formatDateShort(value: Date | string): string {
  return formatDate(value, { day: "numeric", month: "short" });
}

export function formatDateNumeric(value: Date | string): string {
  return formatDate(value, { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Datetime completo; misma zona en servidor y navegador → sin hydration mismatch. */
export function formatDateTime(value: Date | string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: APP_TIMEZONE,
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(asDate(value));
}

export function formatWeekdayShort(year: number, month: number, day: number): string {
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
  }).format(date);
}

export function yearFromDateKey(value: Date | string): number {
  return Number(toDateKey(value).slice(0, 4));
}

export function monthFromDateKey(value: Date | string): number {
  return Number(toDateKey(value).slice(5, 7));
}
