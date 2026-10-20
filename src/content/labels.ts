import type { Editorial } from "./schema";

/**
 * Reader-facing status wording (docs/EDITORIAL.md §Labels). Wording only: nothing is ever
 * labelled verified here, because that needs a qualified tier A review the publisher approves.
 */
export function transcriptionLabel(ed: Editorial | undefined): string | null {
  if (!ed) return null;
  if (ed.content === "placeholder") return "Placeholder text";
  switch (ed.transcription) {
    case "editor-reviewed": return "Editor reviewed";
    case "proofread": return "Provisionally reviewed";
    case "unchecked": return "Unverified transcription";
    default: return null;
  }
}

export const isPlaceholder = (ed: Editorial | undefined) => ed?.content === "placeholder";
