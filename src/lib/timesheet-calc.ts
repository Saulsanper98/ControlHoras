// Replica de las fórmulas de Plantilla_Control_Horario.xlsx (columnas E, F, G, H)

export type DayHours = {
  totalHours: number;
  normalHours: number;
  overtimeHours: number;
  nightHours: number;
};

const ZERO: DayHours = {
  totalHours: 0,
  normalHours: 0,
  overtimeHours: 0,
  nightHours: 0,
};

function toHours(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Un turno de más de 16h en un solo día es casi con toda seguridad un error
// de entrada (p. ej. hora de salida mal introducida, interpretada como turno
// nocturno de ~23h por el envolvente módulo 24). Se usa como cota de cordura
// para avisar/rechazar en el servidor, no como límite legal.
export const MAX_REASONABLE_SHIFT_HOURS = 16;

export function isSuspiciousShift(hours: DayHours): boolean {
  return hours.totalHours > MAX_REASONABLE_SHIFT_HOURS;
}

export function calculateDayHours(checkIn: string, checkOut: string): DayHours {
  if (!checkIn || !checkOut) return ZERO;

  const start = toHours(checkIn);
  const end = toHours(checkOut);

  // E7: =24*MOD(D7-B7,1) — duración dentro de un día, con salto de madrugada
  const totalHours = ((end - start) % 24 + 24) % 24;

  // H7: solapamiento del turno (en la línea temporal extendida) con 22:00-24:00 y 24:00-30:00 (00:00-06:00 del día siguiente)
  const start2 = start;
  const end2 = start + totalHours;
  const overlap = (a: number, b: number) => Math.max(0, Math.min(end2, b) - Math.max(start2, a));
  const nightHours = overlap(22, 24) + overlap(24, 30);

  // F7/G7: reparto de las horas diurnas (total - nocturnas) entre normales (hasta 8) y extra
  const dayPortion = totalHours - nightHours;
  const normalHours = Math.max(0, Math.min(8, dayPortion));
  const overtimeHours = Math.max(0, dayPortion - 8);

  return {
    totalHours: round2(totalHours),
    normalHours: round2(normalHours),
    overtimeHours: round2(overtimeHours),
    nightHours: round2(nightHours),
  };
}

export function sumDayHours(entries: DayHours[]): DayHours {
  return entries.reduce(
    (acc, e) => ({
      totalHours: round2(acc.totalHours + e.totalHours),
      normalHours: round2(acc.normalHours + e.normalHours),
      overtimeHours: round2(acc.overtimeHours + e.overtimeHours),
      nightHours: round2(acc.nightHours + e.nightHours),
    }),
    { ...ZERO }
  );
}

export function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}
