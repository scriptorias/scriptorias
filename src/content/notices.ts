/**
 * Public notices (approved wording, 2026-10-21). Edition-specific notices live with the
 * translation record (`notices`); these apply wherever the material appears.
 */

/** Original SCRIPTORIAS material: footer of introductions, notes and alignment panels. */
export const CC0_NOTICE = "Introductions, notes, verse alignments and other original SCRIPTORIAS material are dedicated to the public domain under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/), to the extent that any copyright or related rights exist in them.";

/** Factual data: where bibliographic data, identifiers, checksums or reference tables are shown. */
export const FACTUAL_NOTICE = "Bibliographic details, page numbers, identifiers, checksums and reference correspondences are factual information. No rights are claimed in them.";

/** Status line text after the label (the label itself comes from transcriptionLabel). */
export const STATUS_DETAIL = "Readings and verse mappings marked *Provisional* are open questions, not established findings. Changes are listed in the correction history.";

/** Where readers report a suspected transcription error (.github/ISSUE_TEMPLATE/transcription-error.yml). */
export const REPORT_FORM = "https://github.com/scriptorias/scriptorias/issues/new";
export const REPORT_NOTE = "(requires a free GitHub account; reports are public)";

/** Issue-form URL prefilled with the form's field ids: work, edition, ref. */
export function reportUrl(fields: { work: string; edition: string; ref: string }) {
  const q = { template: "transcription-error.yml", ...fields };
  return `${REPORT_FORM}?${Object.entries(q).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&")}`;
}
