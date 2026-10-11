/**
 * Quick — "improve how it is said, not what is said".
 *
 * The writing engine Quick shares with Copy Maker is told to "add at least one
 * fresh insight or angle not present in the user input", and a step before it
 * infers benefits, differentiators and credibility points for the writer to
 * emphasise. For a tool that improves copy a client will publish, that goes
 * too far. Seen on 2026-10-11: "espacios limitados" (limited places) in an
 * email that offered no such thing, "sin facturas sorpresa" in another, and a
 * four-word headline that lost "sin plantillas", the one fact it had.
 *
 * So every Quick run tells the writer to keep to the facts of the original:
 * add none, drop none, make no claim stronger. The writer's second pass gets
 * one rule to the same effect (refineOutput.ts, behind formState.keepToOriginal,
 * which only Quick sets). Copy Maker writes as before.
 *
 * Measured on 2026-10-11 against the live model, six texts, three versions
 * each: claims added 12 without the note, 2 with note and rule; facts dropped
 * 20 without, 3 to 6 with; the average score moved by less than one point.
 *
 * Plain sentences on purpose: the engine reads a line that starts with a label
 * in capitals and a colon as a section to write.
 */

/** Told to the writer on every Quick run. */
export const KEEP_TO_ORIGINAL_NOTE = [
  'Improve how this copy says things, not what it says.',
  'Every fact in your version must come from the original. Do not add numbers, prices, offers, guarantees, deadlines, limited availability, results, customers, awards, features or services that the original does not state, and do not make a claim stronger than the original makes it.',
  'Keep the facts the original states: its numbers, names, offers, and what it says makes the product different.',
  'The benefits, differentiators and credibility elements listed earlier in these instructions are ideas for emphasis: use one only where the original itself says it.',
  'A fresh angle means a new way of saying what is already there, not new information.',
].join(' ');

/**
 * Told to the rewrite step when a version is changed by request. The request
 * comes first: "add our guarantee" or "shorter" is the user's decision.
 */
export const KEEP_TO_ORIGINAL_CHANGE_NOTE =
  'Apart from what the request asks for, change how the text says things, not what it says: do not add numbers, offers, guarantees, deadlines, limited availability, results or customers that the text does not state, and keep the facts it states.';
