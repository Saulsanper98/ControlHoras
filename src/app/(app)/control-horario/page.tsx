import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Stagger } from "@/components/ui/stagger";
import { requireEmployeeSession } from "@/lib/auth-helpers";
import { TimeSheetForm } from "@/components/control-horario/timesheet-form";
import { MONTH_NAMES_ES } from "@/lib/format-date";
import { TIMESHEET_STATUS_DESCRIPTION } from "@/lib/labels";

export default async function ControlHorarioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await requireEmployeeSession();
  if (!session) redirect("/");

  const now = new Date();
  const params = await searchParams;
  const month = Number(params.month) || now.getMonth() + 1;
  const year = Number(params.year) || now.getFullYear();

  const timeSheet = await prisma.timeSheet.findUnique({
    where: { userId_month_year: { userId: session.user.id, month, year } },
    include: {
      entries: { orderBy: { day: "asc" } },
      attachments: { orderBy: { uploadedAt: "desc" } },
      signatures: true,
    },
  });

  const status = timeSheet?.status ?? "SIN_CONTROL";

  return (
    <div className="space-y-6">
      <Stagger>
        <PageHeader
          title="Control horario"
          description={TIMESHEET_STATUS_DESCRIPTION[status] ?? status}
        />
      </Stagger>

      <TimeSheetForm
        timeSheetId={timeSheet?.id ?? null}
        month={month}
        year={year}
        monthNames={[...MONTH_NAMES_ES]}
        status={status}
        notes={timeSheet?.notes ?? ""}
        rejectionReason={timeSheet?.rejectionReason}
        entries={
          timeSheet?.entries.map((e) => ({
            day: e.day,
            checkIn: e.checkIn ?? "",
            checkOut: e.checkOut ?? "",
            notes: e.notes ?? "",
          })) ?? []
        }
        attachments={
          timeSheet?.attachments.map((a) => ({
            id: a.id,
            fileName: a.fileName,
            filePath: a.filePath,
          })) ?? []
        }
        employeeSignaturePath={
          timeSheet?.signatures.find((s) => s.signerRole === "EMPLEADO")?.imagePath ?? null
        }
        employeeSignedAt={
          timeSheet?.signatures.find((s) => s.signerRole === "EMPLEADO")?.signedAt?.toISOString() ??
          null
        }
        responsableSignaturePath={
          timeSheet?.signatures.find((s) => s.signerRole === "RESPONSABLE")?.imagePath ?? null
        }
        responsableSignedAt={
          timeSheet?.signatures.find((s) => s.signerRole === "RESPONSABLE")?.signedAt?.toISOString() ??
          null
        }
      />
    </div>
  );
}
