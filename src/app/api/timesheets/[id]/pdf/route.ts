import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadsRoot } from "@/lib/uploads";
import { TimeSheetPdf, type TimeSheetPdfSignature } from "@/lib/pdf/timesheet-pdf";
import { canManage } from "@/lib/roles";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  const { id } = await params;

  const timeSheet = await prisma.timeSheet.findUnique({
    where: { id },
    include: {
      user: { include: { department: true } },
      entries: { orderBy: { day: "asc" } },
      signatures: { include: { signer: true } },
    },
  });

  if (!timeSheet) return new NextResponse("No encontrado", { status: 404 });

  const isOwner = timeSheet.userId === session.user.id;
  const isJefa = canManage(session.user.role);
  if (!isOwner && !isJefa) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const root = uploadsRoot();
  const signatures: TimeSheetPdfSignature[] = timeSheet.signatures.map((s) => ({
    signerRole: s.signerRole,
    signerName: s.signer.name,
    imageAbsolutePath: path.join(root, s.imagePath),
    signedAt: s.signedAt,
  }));

  const buffer = await renderToBuffer(
    TimeSheetPdf({
      employeeName: timeSheet.user.name,
      departmentName: timeSheet.user.department?.name ?? null,
      month: timeSheet.month,
      year: timeSheet.year,
      status: timeSheet.status,
      notes: timeSheet.notes,
      entries: timeSheet.entries.map((e) => ({
        day: e.day,
        checkIn: e.checkIn,
        checkOut: e.checkOut,
        totalHours: Number(e.totalHours),
        normalHours: Number(e.normalHours),
        overtimeHours: Number(e.overtimeHours),
        nightHours: Number(e.nightHours),
        notes: e.notes,
      })),
      signatures,
    })
  );

  const fileName = `control-horario-${timeSheet.user.name.replace(/\s+/g, "_")}-${timeSheet.month}-${timeSheet.year}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
