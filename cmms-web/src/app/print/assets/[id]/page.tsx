import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { generateQrDataUrl } from "@/lib/qrcode";
import { PrintButton } from "./print-button";

export default async function AssetQrLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const asset = await db.asset.findUnique({ where: { id } });
  if (!asset) notFound();

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const assetUrl = `${protocol}://${host}/assets/${asset.id}`;
  const qrDataUrl = await generateQrDataUrl(assetUrl);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-8 print:p-0">
      <div className="flex w-72 flex-col items-center gap-3 rounded-lg border border-slate-300 p-6 text-center print:border-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt={`Código QR de ${asset.code}`} className="h-56 w-56" />
        <p className="text-lg font-bold text-slate-900">{asset.code}</p>
        <p className="text-sm text-slate-700">{asset.name}</p>
        {asset.location && <p className="text-xs text-slate-500">{asset.location}</p>}
      </div>
      <div className="print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
