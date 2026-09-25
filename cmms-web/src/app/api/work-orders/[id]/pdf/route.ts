import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getInstitutionSettings } from "@/lib/settings";
import { renderWorkOrderPdf } from "@/lib/pdf/work-order-document";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  const { id } = await params;
  const workOrder = await db.workOrder.findUnique({
    where: { id },
    include: {
      asset: true,
      requestedBy: true,
      assignedTo: true,
      parts: { include: { inventoryItem: true } },
      checklistItems: true,
      measurements: true,
      signatures: true,
      statusLogs: { include: { changedBy: true } },
    },
  });
  if (!workOrder) return new NextResponse("No encontrado", { status: 404 });

  const settings = await getInstitutionSettings();
  const buffer = await renderWorkOrderPdf(workOrder, settings);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${workOrder.code}.pdf"`,
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });
}
