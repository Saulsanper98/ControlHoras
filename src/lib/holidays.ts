// Festivos nacionales de España + Canarias (Gran Canaria). Ajustar si la empresa
// publica un calendario propio; aquí sirven como referencia visual en el control.

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Festivos del mes (día del mes → nombre). Incluye Canarias. */
export function holidaysInMonth(month: number, year: number): Map<number, string> {
  const map = new Map<number, string>();

  const fixed: [number, number, string][] = [
    [1, 1, "Año Nuevo"],
    [1, 6, "Epifanía"],
    [5, 1, "Fiesta del Trabajo"],
    [5, 30, "Día de Canarias"],
    [8, 15, "Asunción"],
    [10, 12, "Fiesta Nacional"],
    [11, 1, "Todos los Santos"],
    [12, 6, "Día de la Constitución"],
    [12, 8, "Inmaculada Concepción"],
    [12, 25, "Navidad"],
  ];

  for (const [m, d, name] of fixed) {
    if (m === month) map.set(d, name);
  }

  const easter = easterSunday(year);
  const movable: [Date, string][] = [
    [addDays(easter, -2), "Viernes Santo"],
    [addDays(easter, 1), "Lunes de Pascua"],
  ];

  for (const [date, name] of movable) {
    if (date.getMonth() + 1 === month) map.set(date.getDate(), name);
  }

  return map;
}

export function isHoliday(month: number, year: number, day: number): boolean {
  return holidaysInMonth(month, year).has(day);
}

export function countVacationDays(start: Date, end: Date): number {
  if (end < start) return 0;
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const dow = cursor.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const holiday = isHoliday(
      cursor.getMonth() + 1,
      cursor.getFullYear(),
      cursor.getDate()
    );
    if (!isWeekend && !holiday) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function toDateKey(d: Date): string {
  return dateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
