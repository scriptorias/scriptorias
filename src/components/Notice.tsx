/**
 * Renders approved notice wording with minimal markup: **bold**, *italic* and [text](https://…).
 * Nothing else is interpreted, so the wording shows exactly as approved.
 */
import type { ReactNode } from "react";

const TOKEN = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g;

export function richText(src: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of src.matchAll(TOKEN)) {
    if (m.index! > last) out.push(src.slice(last, m.index));
    const k = out.length;
    if (m[1] !== undefined) out.push(<b key={k}>{m[1]}</b>);
    else if (m[2] !== undefined) out.push(<em key={k}>{m[2]}</em>);
    else out.push(<a key={k} href={m[4]} target="_blank" rel="noopener">{m[3]}</a>);
    last = m.index! + m[0].length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

export function Notice({ text, kind, className = "" }: { text: string; kind: string; className?: string }) {
  return <p className={`notice ${className}`.trim()} data-notice={kind}>{richText(text)}</p>;
}
