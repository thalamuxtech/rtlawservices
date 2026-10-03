import type { ReactNode } from "react";

/**
 * Renders the small markdown subset used by blog posts into React elements.
 * No raw HTML is ever injected, so text written in the back office cannot
 * run scripts on the public site.
 *
 * Supported: "## " and "### " headings, paragraphs, "- " bullet lists,
 * "1. " numbered lists, **bold**, *italic* and [links](https://...).
 */
export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim());
        if (!lines.length) return null;
        const first = lines[0];
        if (first.startsWith("### ")) return <h3 key={i} id={slugify(first.slice(4))}>{inline(first.slice(4))}</h3>;
        if (first.startsWith("## ")) return <h2 key={i} id={slugify(first.slice(3))}>{inline(first.slice(3))}</h2>;
        if (lines.every((l) => /^- /.test(l.trim()))) {
          return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.trim().slice(2))}</li>)}</ul>;
        }
        if (lines.every((l) => /^\d+\. /.test(l.trim()))) {
          return <ol key={i}>{lines.map((l, j) => <li key={j}>{inline(l.trim().replace(/^\d+\. /, ""))}</li>)}</ol>;
        }
        return <p key={i}>{inline(lines.join(" "))}</p>;
      })}
    </>
  );
}

export function headings(source: string) {
  return source
    .split("\n")
    .filter((l) => l.startsWith("## "))
    .map((l) => ({ text: l.slice(3).replace(/[*_]/g, ""), id: slugify(l.slice(3)) }));
}

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[*_]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2]) out.push(<strong key={k++}>{m[2]}</strong>);
    else if (m[4]) out.push(<em key={k++}>{m[4]}</em>);
    else if (m[6]) {
      const href = m[7];
      const external = href.startsWith("http");
      out.push(
        <a key={k++} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {m[6]}
        </a>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
