/**
 * Quick — "rewrite freely, keep to the facts".
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
 * Until 2026-10-14 the note also said "improve how this copy says things, not
 * what it says", and Quick kept the original's headings in their places. On
 * sharpen.studio that day Quick's versions scored 72-74 and Copy Maker's, which
 * write a new page from the same engine, 86-87 on the same scorer, with no fact
 * added. The facts rule stays for every kind of text; for a page the wording,
 * the order of the parts, the headings and the opening are now the writer's to
 * change (QUICK_REWRITE_NOTE).
 *
 * Plain sentences on purpose: the engine reads a line that starts with a label
 * in capitals and a colon as a section to write.
 */

/** Told to the writer on every Quick run. */
export const KEEP_TO_ORIGINAL_NOTE = [
  'Every fact in your version must come from the original. Do not add numbers, prices, offers, guarantees, deadlines, limited availability, results, customers, awards, features or services that the original does not state, and do not make a claim stronger than the original makes it.',
  'Keep the facts the original states: its numbers, names, offers, and what it says makes the product different.',
  'The benefits, differentiators and credibility elements listed earlier in these instructions are ideas for emphasis: use one only where the original itself says it.',
  'A new angle or a new order is welcome; new information is not.',
].join(' ');

/**
 * Told to the writer when the copy is a page, or its kind is not known: the
 * freedom Copy Maker's writer has. The other kinds of text (a slogan, an email,
 * an ad) keep their own form; their notes are in textKinds.ts.
 */
export const QUICK_REWRITE_NOTE = [
  'Rewrite this copy so it works as well as possible for its goal. You are free to change the wording, the order of the parts, the headings and the opening.',
  'For example, open with the problem the reader has, put the strongest reasons first, cut repetition and filler, and end with one clear call to action.',
].join(' ');

/**
 * Told to the rewrite step when a version is changed by request. The request
 * comes first: "add our guarantee" or "shorter" is the user's decision.
 */
export const KEEP_TO_ORIGINAL_CHANGE_NOTE =
  'Apart from what the request asks for, change how the text says things, not what it says: do not add numbers, offers, guarantees, deadlines, limited availability, results or customers that the text does not state, and keep the facts it states.';
