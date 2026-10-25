// The firm's own documents, offered in the back office to download or attach
// to an email. The files live in public/brand/letterhead (rebuilt from
// planning/brand/letterhead).

export type FirmDocument = { name: string; label: string; detail: string; kind: "Word" | "PDF"; href: string };

const DIR = "/brand/letterhead";

export const FIRM_DOCUMENTS: FirmDocument[] = [
  { name: "RT-Law-Services-Letterhead.docx", label: "Letterhead", detail: "Blank, ready to type a letter.", kind: "Word", href: `${DIR}/RT-Law-Services-Letterhead.docx` },
  { name: "RT-Law-Services-Letterhead-Sample-Letter.docx", label: "Sample letter", detail: "A filled-in example with placeholders to replace.", kind: "Word", href: `${DIR}/RT-Law-Services-Letterhead-Sample-Letter.docx` },
  { name: "RT-Law-Services-Letterhead.pdf", label: "Letterhead", detail: "Blank, for printing.", kind: "PDF", href: `${DIR}/RT-Law-Services-Letterhead.pdf` },
  { name: "RT-Law-Services-Letterhead-Sample-Letter.pdf", label: "Sample letter", detail: "The example letter, for reference.", kind: "PDF", href: `${DIR}/RT-Law-Services-Letterhead-Sample-Letter.pdf` },
];

/** Fetches a firm document as a File, ready to attach. */
export async function firmDocumentFile(doc: FirmDocument): Promise<File> {
  const res = await fetch(doc.href, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${doc.name}`);
  const blob = await res.blob();
  const type = doc.kind === "PDF" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return new File([blob], doc.name, { type });
}
