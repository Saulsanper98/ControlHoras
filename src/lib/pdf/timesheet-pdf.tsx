import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { TIMESHEET_STATUS_LABEL } from "@/lib/labels";

const STATUS_PDF_STYLE: Record<string, { backgroundColor: string; color: string }> = {
  BORRADOR: { backgroundColor: "#f1f5f9", color: "#475569" },
  FIRMADO_EMPLEADO: { backgroundColor: "#fef3c7", color: "#92400e" },
  FIRMADO_RESPONSABLE: { backgroundColor: "#d1fae5", color: "#065f46" },
  RECHAZADO: { backgroundColor: "#fee2e2", color: "#991b1b" },
  SIN_CONTROL: { backgroundColor: "#f8fafc", color: "#64748b" },
};

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#0A2240",
  },
  header: {
    marginBottom: 16,
    borderBottom: "2 solid #0A2240",
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#334155",
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 24,
  },
  metaItem: {
    flexDirection: "row",
  },
  metaLabel: {
    fontFamily: "Helvetica-Bold",
    marginRight: 4,
  },
  table: {
    marginTop: 8,
    borderTop: "1 solid #cbd5e1",
    borderLeft: "1 solid #cbd5e1",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableHeaderCell: {
    backgroundColor: "#0A2240",
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    padding: 4,
    borderRight: "1 solid #cbd5e1",
    borderBottom: "1 solid #cbd5e1",
  },
  tableCell: {
    padding: 4,
    fontSize: 8,
    borderRight: "1 solid #cbd5e1",
    borderBottom: "1 solid #cbd5e1",
  },
  colDay: { width: "9%" },
  colTime: { width: "11%" },
  colHours: { width: "11%" },
  colNotes: { width: "25%" },
  totalsRow: {
    flexDirection: "row",
    backgroundColor: "#F5EA61",
  },
  totalsLabel: {
    fontFamily: "Helvetica-Bold",
    padding: 4,
    fontSize: 8,
    width: "42%",
    borderRight: "1 solid #cbd5e1",
    borderBottom: "1 solid #cbd5e1",
  },
  notesBox: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#f8fafc",
    fontSize: 9,
  },
  signaturesRow: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBlock: {
    width: "45%",
    alignItems: "center",
  },
  signatureImage: {
    height: 60,
    marginBottom: 4,
    objectFit: "contain",
  },
  signatureLine: {
    borderTop: "1 solid #0A2240",
    width: "100%",
    paddingTop: 4,
    alignItems: "center",
  },
  signatureName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  signatureDate: {
    fontSize: 8,
    color: "#64748b",
  },
  signaturePending: {
    fontSize: 8,
    color: "#94a3b8",
    marginTop: 30,
  },
  statusBadge: {
    marginTop: 10,
    alignSelf: "flex-start",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
});

export type TimeSheetPdfEntry = {
  day: number;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number;
  normalHours: number;
  overtimeHours: number;
  nightHours: number;
  notes: string | null;
};

export type TimeSheetPdfSignature = {
  signerRole: "EMPLEADO" | "RESPONSABLE";
  signerName: string;
  imageAbsolutePath: string;
  signedAt: Date;
};

export type TimeSheetPdfProps = {
  employeeName: string;
  departmentName: string | null;
  month: number;
  year: number;
  status: string;
  notes: string | null;
  entries: TimeSheetPdfEntry[];
  signatures: TimeSheetPdfSignature[];
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Atlantic/Canary",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function TimeSheetPdf({
  employeeName,
  departmentName,
  month,
  year,
  status,
  notes,
  entries,
  signatures,
}: TimeSheetPdfProps) {
  const totals = entries.reduce(
    (acc, e) => ({
      totalHours: acc.totalHours + e.totalHours,
      normalHours: acc.normalHours + e.normalHours,
      overtimeHours: acc.overtimeHours + e.overtimeHours,
      nightHours: acc.nightHours + e.nightHours,
    }),
    { totalHours: 0, normalHours: 0, overtimeHours: 0, nightHours: 0 }
  );

  const rows = entries.filter((e) => e.checkIn || e.checkOut || e.notes);
  const empleadoSig = signatures.find((s) => s.signerRole === "EMPLEADO");
  const responsableSig = signatures.find((s) => s.signerRole === "RESPONSABLE");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Control horario mensual</Text>
          <Text style={styles.subtitle}>Portal del Empleado</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Trabajador:</Text>
              <Text>{employeeName}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Departamento:</Text>
              <Text>{departmentName ?? "—"}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Periodo:</Text>
              <Text>
                {MONTH_NAMES[month - 1]} de {year}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.statusBadge,
              STATUS_PDF_STYLE[status] ?? { backgroundColor: "#f1f5f9", color: "#475569" },
            ]}
          >
            {TIMESHEET_STATUS_LABEL[status] ?? status}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeaderCell, styles.colDay]}>Día</Text>
            <Text style={[styles.tableHeaderCell, styles.colTime]}>Entrada</Text>
            <Text style={[styles.tableHeaderCell, styles.colTime]}>Salida</Text>
            <Text style={[styles.tableHeaderCell, styles.colHours]}>Total</Text>
            <Text style={[styles.tableHeaderCell, styles.colHours]}>Normales</Text>
            <Text style={[styles.tableHeaderCell, styles.colHours]}>Extra</Text>
            <Text style={[styles.tableHeaderCell, styles.colHours]}>Nocturnas</Text>
            <Text style={[styles.tableHeaderCell, styles.colNotes]}>Observaciones</Text>
          </View>
          {rows.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: "100%", textAlign: "center" }]}>
                Sin registros diarios (control adjuntado como archivo).
              </Text>
            </View>
          )}
          {rows.map((entry) => (
            <View style={styles.tableRow} key={entry.day} wrap={false}>
              <Text style={[styles.tableCell, styles.colDay]}>{entry.day}</Text>
              <Text style={[styles.tableCell, styles.colTime]}>{entry.checkIn || "—"}</Text>
              <Text style={[styles.tableCell, styles.colTime]}>{entry.checkOut || "—"}</Text>
              <Text style={[styles.tableCell, styles.colHours]}>{entry.totalHours.toFixed(2)}</Text>
              <Text style={[styles.tableCell, styles.colHours]}>{entry.normalHours.toFixed(2)}</Text>
              <Text style={[styles.tableCell, styles.colHours]}>{entry.overtimeHours.toFixed(2)}</Text>
              <Text style={[styles.tableCell, styles.colHours]}>{entry.nightHours.toFixed(2)}</Text>
              <Text style={[styles.tableCell, styles.colNotes]}>{entry.notes || ""}</Text>
            </View>
          ))}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Totales</Text>
            <Text style={[styles.tableCell, styles.colHours, { backgroundColor: "#F5EA61" }]}>
              {totals.totalHours.toFixed(2)}
            </Text>
            <Text style={[styles.tableCell, styles.colHours, { backgroundColor: "#F5EA61" }]}>
              {totals.normalHours.toFixed(2)}
            </Text>
            <Text style={[styles.tableCell, styles.colHours, { backgroundColor: "#F5EA61" }]}>
              {totals.overtimeHours.toFixed(2)}
            </Text>
            <Text style={[styles.tableCell, styles.colHours, { backgroundColor: "#F5EA61" }]}>
              {totals.nightHours.toFixed(2)}
            </Text>
            <Text style={[styles.tableCell, styles.colNotes, { backgroundColor: "#F5EA61" }]} />
          </View>
        </View>

        {notes && (
          <View style={styles.notesBox}>
            <Text>Notas: {notes}</Text>
          </View>
        )}

        <View style={styles.signaturesRow}>
          <View style={styles.signatureBlock}>
            {empleadoSig ? (
              <>
                <Image style={styles.signatureImage} src={empleadoSig.imageAbsolutePath} />
                <View style={styles.signatureLine}>
                  <Text style={styles.signatureName}>{empleadoSig.signerName}</Text>
                  <Text style={styles.signatureDate}>Firmado el {formatDate(empleadoSig.signedAt)}</Text>
                </View>
              </>
            ) : (
              <View style={styles.signatureLine}>
                <Text style={styles.signaturePending}>Firma del empleado pendiente</Text>
              </View>
            )}
          </View>
          <View style={styles.signatureBlock}>
            {responsableSig ? (
              <>
                <Image style={styles.signatureImage} src={responsableSig.imageAbsolutePath} />
                <View style={styles.signatureLine}>
                  <Text style={styles.signatureName}>{responsableSig.signerName}</Text>
                  <Text style={styles.signatureDate}>Firmado el {formatDate(responsableSig.signedAt)}</Text>
                </View>
              </>
            ) : (
              <View style={styles.signatureLine}>
                <Text style={styles.signaturePending}>Firma de la responsable pendiente</Text>
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
