import type { Editorial } from "./schema";

/**
 * Reader-facing status wording (docs/EDITORIAL.md §9). Wording only. "Independently verified"
 * needs a passing tier A review by a qualified reviewer (validator-enforced for editor-reviewed);
 * internal checks by SCRIPTORIAS are never labelled verified.
 */
export function transcriptionLabel(ed: Editorial | undefined): string | null {
  if (!ed) return null;
  if (ed.content === "placeholder") return "Placeholder text";
  switch (ed.transcription) {
    case "editor-reviewed": return "Independently verified";
    case "proofread": return "Internally checked transcription · not independently verified";
    case "unchecked": return "Unverified transcription";
    default: return null;
  }
}

/** Provisional readings and mappings: open questions, shown with the question. */
export const PROVISIONAL = "Provisional";

export const isPlaceholder = (ed: Editorial | undefined) => ed?.content === "placeholder";
