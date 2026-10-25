// The firm's own documents, offered in the back office to download or attach
// to an email. The files live in public/brand/letterhead (rebuilt from
// planning/brand/letterhead) and public/brand/business-card.

export type FirmDocument = {
  name: string;
  label: string;
  detail: string;
  kind: "Word" | "PDF";
  href: string;
  /** An image of the document for viewing in the browser. */
  preview: string;
};

const DIR = "/brand/letterhead";
const CARD = "/brand/business-card";

export const FIRM_DOCUMENTS: FirmDocument[] = [
  { name: "RT-Law-Services-Letterhead.docx", label: "Letterhead", detail: "Blank, ready to type a letter.", kind: "Word", href: `${DIR}/RT-Law-Services-Letterhead.docx`, preview: `${DIR}/RT-Law-Services-Letterhead-preview.webp` },
  { name: "RT-Law-Services-Letterhead.pdf", label: "Letterhead", detail: "Blank, for printing.", kind: "PDF", href: `${DIR}/RT-Law-Services-Letterhead.pdf`, preview: `${DIR}/RT-Law-Services-Letterhead-preview.webp` },
  { name: "RT-Law-Services-Business-Card.pdf", label: "Business card", detail: "Front and back, ready for the printer (3.5 x 2 in, with bleed).", kind: "PDF", href: `${CARD}/RT-Law-Services-Business-Card.pdf`, preview: `${CARD}/RT-Law-Services-Business-Card-preview.webp` },
];

/** Fetches a firm document as a File, ready to attach. */
export async function firmDocumentFile(doc: FirmDocument): Promise<File> {
  const res = await fetch(doc.href, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${doc.name}`);
  const blob = await res.blob();
  const type = { PDF: "application/pdf", Word: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }[doc.kind];
  return new File([blob], doc.name, { type });
}
