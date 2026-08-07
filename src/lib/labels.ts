/** Etiquetas y colores canónicos de la app (una sola fuente de verdad). */

export const LEAVE_TYPE_LABEL: Record<string, string> = {
  VACACIONES: "Vacaciones",
  ASUNTOS_PROPIOS: "Asuntos propios",
  MEDIO_DIA: "Medio día",
};

/** Texto corto para badges y stats. */
export const TIMESHEET_STATUS_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  FIRMADO_EMPLEADO: "Pendiente de firma",
  FIRMADO_RESPONSABLE: "Firmado",
  RECHAZADO: "Rechazado",
  SIN_CONTROL: "Sin control",
};

/** Texto largo para cabeceras / descripciones. */
export const TIMESHEET_STATUS_DESCRIPTION: Record<string, string> = {
  BORRADOR: "Borrador / sin enviar",
  FIRMADO_EMPLEADO: "Enviado, pendiente de la responsable",
  FIRMADO_RESPONSABLE: "Firmado y cerrado",
  RECHAZADO: "Rechazado, puedes corregirlo",
  SIN_CONTROL: "Sin control este mes",
};

export const TIMESHEET_STATUS_COLOR: Record<string, string> = {
  BORRADOR: "bg-brand-navy/[0.06] text-slate-600",
  FIRMADO_EMPLEADO: "bg-amber-500/12 text-amber-800",
  FIRMADO_RESPONSABLE: "bg-emerald-500/12 text-emerald-800",
  RECHAZADO: "bg-red-500/12 text-red-800",
  SIN_CONTROL: "bg-brand-navy/[0.05] text-slate-500",
};

export const LEAVE_STATUS_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  CANCELADA: "Cancelada",
};

export const LEAVE_STATUS_COLOR: Record<string, string> = {
  PENDIENTE: "bg-amber-500/15 text-amber-800",
  APROBADA: "bg-emerald-500/15 text-emerald-800",
  RECHAZADA: "bg-red-500/15 text-red-800",
  CANCELADA: "bg-brand-navy/8 text-slate-500",
};

export const TEMP_EMPLOYEE_PASSWORD = "Cambiar123!";
