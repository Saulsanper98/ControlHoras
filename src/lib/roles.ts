// Roles: EMPLEADO (empleado normal) y JEFA (responsable de operaciones,
// sin cuenta de empleado propia). El rol ADMIN se eliminó del esquema.

export type AppRole = "EMPLEADO" | "JEFA";

/** ¿Puede revisar/firmar controles horarios, gestionar horarios, vacaciones y noticias? */
export function canManage(role: AppRole): boolean {
  return role === "JEFA";
}

/** ¿Tiene su propio control horario / horario asignado / vacaciones como empleado? */
export function hasOwnEmployeeData(role: AppRole): boolean {
  return role === "EMPLEADO";
}
