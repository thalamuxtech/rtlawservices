// The firm's own documents, offered in the back office to download or attach
// to an email. The files live in public/brand/letterhead (rebuilt from
// planning/brand/letterhead) and public/brand/qr.

export type FirmDocument = {
  name: string;
  label: string;
  detail: string;
  kind: "Word" | "PDF" | "PNG";
  href: string;
  /** An image of the document for viewing in the browser. */
  preview: string;
};

const DIR = "/brand/letterhead";
const QR = "/brand/qr";

export const FIRM_DOCUMENTS: FirmDocument[] = [
  { name: "RT-Law-Services-Letterhead.docx", label: "Letterhead", detail: "Blank, ready to type a letter.", kind: "Word", href: `${DIR}/RT-Law-Services-Letterhead.docx`, preview: `${DIR}/RT-Law-Services-Letterhead-preview.webp` },
  { name: "RT-Law-Services-Letterhead.pdf", label: "Letterhead", detail: "Blank, for printing.", kind: "PDF", href: `${DIR}/RT-Law-Services-Letterhead.pdf`, preview: `${DIR}/RT-Law-Services-Letterhead-preview.webp` },
  { name: "RT-Law-Services-QR-Code.pdf", label: "QR code", detail: "Opens rtlawservices.com. For print, 3 inches square.", kind: "PDF", href: `${QR}/RT-Law-Services-QR-Code.pdf`, preview: `${QR}/RT-Law-Services-QR-Code.png` },
  { name: "RT-Law-Services-QR-Code.png", label: "QR code", detail: "Opens rtlawservices.com. For screens and social media.", kind: "PNG", href: `${QR}/RT-Law-Services-QR-Code.png`, preview: `${QR}/RT-Law-Services-QR-Code.png` },
];

/** Fetches a firm document as a File, ready to attach. */
export async function firmDocumentFile(doc: FirmDocument): Promise<File> {
  const res = await fetch(doc.href, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${doc.name}`);
  const blob = await res.blob();
  const type = { PDF: "application/pdf", PNG: "image/png", Word: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }[doc.kind];
  return new File([blob], doc.name, { type });
}
