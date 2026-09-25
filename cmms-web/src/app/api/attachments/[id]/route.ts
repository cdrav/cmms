import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { attachmentFilePath } from "@/lib/attachments";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  const { id } = await params;
  const attachment = await db.attachment.findUnique({ where: { id } });
  if (!attachment) return new NextResponse("No encontrado", { status: 404 });

  try {
    const buffer = await readFile(attachmentFilePath(attachment.filename));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.originalName)}"`,
        "Cache-Control": "private, max-age=0, no-cache",
      },
    });
  } catch {
    return new NextResponse("Archivo no encontrado en disco", { status: 404 });
  }
}
