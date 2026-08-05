// Roles: EMPLEADO (empleado normal), JEFA (responsable, sin cuenta de empleado
// propia), ADMIN (permisos de jefa + rellena su propio control horario como
// un empleado más de su departamento — pensado para Saúl/Sistemas).

export type AppRole = "EMPLEADO" | "JEFA" | "ADMIN";

/** ¿Puede revisar/firmar controles horarios, gestionar horarios, vacaciones y noticias? */
export function canManage(role: AppRole): boolean {
  return role === "JEFA" || role === "ADMIN";
}

/** ¿Tiene su propio control horario / horario asignado / vacaciones como empleado? */
export function hasOwnEmployeeData(role: AppRole): boolean {
  return role === "EMPLEADO" || role === "ADMIN";
}
