import "server-only";
import QRCode from "qrcode";

export async function generateQrDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, { errorCorrectionLevel: "M", margin: 1, width: 320 });
}
