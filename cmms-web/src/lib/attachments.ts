import "server-only";
import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

// Los archivos NO se guardan bajo /public: quedan fuera del alcance estático de
// Next.js y solo se sirven a través de la ruta protegida /api/attachments/[id],
// que exige sesión iniciada (ver src/app/api/attachments/[id]/route.ts).
const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export function attachmentFilePath(filename: string) {
  return path.join(STORAGE_DIR, filename);
}

export async function saveAttachmentFile(file: File) {
  if (file.size === 0) {
    throw new Error("El archivo está vacío.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("El archivo supera el tamaño máximo permitido (15 MB).");
  }

  await mkdir(STORAGE_DIR, { recursive: true });

  const ext = path.extname(file.name).slice(0, 10);
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(attachmentFilePath(filename), buffer);

  return {
    filename,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
  };
}

export async function deleteAttachmentFile(filename: string) {
  try {
    await unlink(attachmentFilePath(filename));
  } catch {
    // Si el archivo ya no existe en disco, no bloqueamos el borrado del registro.
  }
}
