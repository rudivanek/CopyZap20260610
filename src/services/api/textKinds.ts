/**
 * The kind of text a piece of copy is: a web page, a short statement, an email,
 * a social post, an ad.
 *
 * The scorer's rubric was written for pages. Measured on 2026-10-11 with the
 * goal "Convert": a 20-word value proposition got 10 of 25 for Persuasion
 * because it has "no CTA whatsoever" and 13 of 25 for Structure because one
 * sentence has "no progression"; a social post lost points for "a bare URL
 * without a button". Both were judged as pages that are too short.
 *
 * So the kind is told to the scorer, and to the writer, as one more note. The
 * four dimensions, the 0-25 range and the calibration scale do not change.
 *
 * "Web page", and "Other" with nothing typed, add no note: such copy is judged
 * and written exactly as before this file existed. A result saved before this
 * file existed has no kind and is treated the same way.
 *
 * Everything a kind needs is one entry in TEXT_KINDS. This file is plain text
 * handling: no model call, no cost.
 */

export type TextKindKey = 'web_page' | 'short_text' | 'email' | 'social_post' | 'ad' | 'other';

export interface TextKind {
  key: TextKindKey;
  /** On the check screen, and after "Judged as:" (for "Other" see textKindLabel). */
  label: string;
  /** For the step that reads the copy: how this kind is recognised. */
  hint: string;
  /** Added to the scorer's instructions. Empty: judged as before. */
  scoring: string;
  /** Told to the writer. Empty: nothing is added. */
  writing: string;
  /** In a sentence, after "This text is": "a post for a social network". Empty for a kind that adds nothing. */
  noun: string;
}

/** Longest text the user can type for "Other". */
export const TEXT_KIND_OTHER_MAX_CHARS = 40;

/** The kind used when nothing better is known. */
export const DEFAULT_TEXT_KIND: TextKindKey = 'other';

export const TEXT_KINDS: TextKind[] = [
  {
    key: 'web_page',
    label: 'Web page',
    hint: 'a page or a section of a website (home, landing, service or product page), usually with headings and several parts',
    scoring: '',
    writing: '',
    noun: '',
  },
  {
    key: 'short_text',
    label: 'Short text (USP, headline, slogan)',
    hint: 'one or two sentences that stand alone: a value proposition, headline, slogan or tagline',
    scoring:
      'The copy is a short stand-alone statement: a value proposition, headline, slogan or tagline. It is complete at one or two sentences and is not a page. Do not take points off for anything a statement of this length cannot hold: a call to action, urgency, proof, a named pain point, sections, or a progression from problem to solution. Judge Persuasion by the promise itself: is it specific, believable and worth something to the reader, or could any competitor say exactly the same? Judge Structure by how the statement is built: the strongest idea in the strongest place, a clear rhythm, no wasted or repeated words.',
    writing:
      'This text is a short stand-alone statement (a value proposition, headline or slogan), not a page. Give back one statement of about the same length as the original, as plain text without bold type and without quotation marks around it. Do not add a heading, a list, a second paragraph, or a call to action that the original does not have.',
    noun: 'a short stand-alone statement (a value proposition, headline or slogan), not a page',
  },
  {
    key: 'email',
    label: 'Email / newsletter',
    hint: 'an email or a newsletter: it has a subject line, a greeting or a sign-off',
    scoring:
      'The copy is an email or a newsletter. A subject line, a greeting, a sign-off and a signature are normal parts and are not padding; when a subject line is there, judge it as the hook of the email. A text link, or one line that asks for the action, is a complete call to action: do not expect a button. Do not take points off when there is no subject line: the user may have pasted the body only. Judge Structure as one message read from top to bottom with one main action.',
    writing:
      'This text is an email or a newsletter. Keep it an email: keep the subject line if there is one (you may improve its wording), the greeting, the sign-off and the signature. Do not turn it into a web page with section headings.',
    noun: 'an email or a newsletter, not a web page',
  },
  {
    key: 'social_post',
    label: 'Social post',
    hint: 'a post for a social network: a few short lines, often with hashtags, emoji, a mention or a bare link',
    scoring:
      'The copy is a post for a social network. It is complete at a few short lines. Hashtags, emoji, mentions and a bare link are normal here and are not faults. The call to action of a post is one short line or a link: do not expect a button, a form, a longer close, or detailed proof. Judge Persuasion by the first line (does it stop the reader), by one clear point and, when the goal asks for an action, by a clear next step. Judge Structure by whether it reads at a glance: hook, point, next step.',
    writing:
      'This text is a post for a social network. Keep it a post of about the same length. Keep the hashtags, mentions and links of the original as they are, and keep emoji if the original has them. Do not add headings or sections.',
    noun: 'a post for a social network, not a web page',
  },
  {
    key: 'ad',
    label: 'Ad',
    hint: 'a paid ad (search, social or display): a headline and one or a few short lines, sometimes labelled Headline and Description',
    scoring:
      'The copy is a paid ad (search, social or display): a headline and one or a few short lines, limited by the space the platform gives. Judge it within that space. Do not take points off for missing detail, proof or sections. A call to action of two to four words is complete here. Judge Persuasion by the pull of the headline, one clear benefit and a clear action. Judge Structure by how the headline and the lines work together without repeating each other.',
    writing:
      'This text is a paid ad. Keep its form: the same parts (for example headline and description lines) in the same order and of about the same length each. Do not add headings, sections or extra lines.',
    noun: 'a paid ad, not a web page',
  },
  {
    key: 'other',
    label: 'Other',
    hint: 'marketing copy that is none of these, or when you cannot tell',
    scoring: '',
    writing: '',
    noun: '',
  },
];

/** What is known about the kind of a text: the key, and for "Other" what the user typed. */
export interface TextKindChoice {
  key?: string | null;
  other?: string | null;
}

/** The kind with this key, or null: for a missing key, or a key from a newer version. */
export function getTextKind(key: string | null | undefined): TextKind | null {
  return (key && TEXT_KINDS.find(kind => kind.key === key)) || null;
}

/**
 * What the user typed for "Other", made safe to stand inside an instruction:
 * one line, no double quotation marks, no colon, no full stop at the end, at
 * most TEXT_KIND_OTHER_MAX_CHARS characters (counted as characters, so an
 * emoji is never cut in half).
 */
export function cleanTextKindOther(value: string | null | undefined): string {
  const oneLine = (value || '')
    .replace(/["“”„«»`:\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return Array.from(oneLine)
    .slice(0, TEXT_KIND_OTHER_MAX_CHARS)
    .join('')
    .replace(/[.\s]+$/, '');
}

function otherText(choice: TextKindChoice | null | undefined): string {
  return choice?.key === 'other' ? cleanTextKindOther(choice.other) : '';
}

/**
 * What stands after "Judged as:". Null when the result has no kind (saved
 * before kinds existed): the caller then keeps the label it had.
 */
export function textKindLabel(choice: TextKindChoice | null | undefined): string | null {
  const kind = getTextKind(choice?.key);
  if (!kind) return null;
  if (kind.key !== 'other') return kind.label;
  const other = otherText(choice);
  return other ? `Other: ${other}` : 'General marketing copy';
}

const CLOSING =
  'Where this note and the goal context disagree about what the copy must contain, this note decides. The four dimensions, the 0-25 range and the calibration scale stay as they are: generic or weak copy of this kind still scores low.';

/** The note added to the scorer's instructions, starting with two line breaks. Empty when the kind adds none. */
export function textKindScoringGuidance(choice: TextKindChoice | null | undefined): string {
  const kind = getTextKind(choice?.key);
  if (!kind) return '';
  const other = otherText(choice);
  if (other) {
    return `\n\nKIND OF TEXT, as stated by the user: "${other}". Judge the copy as that kind of text. What is normal for that kind is not a fault, and do not take points off for elements that kind of text does not have. ${CLOSING}`;
  }
  if (!kind.scoring) return '';
  return `\n\nKIND OF TEXT — ${kind.label.toUpperCase()}: ${kind.scoring} ${CLOSING}`;
}

/** What the writer is told about the kind. Empty when the kind adds nothing. */
export function textKindWritingNote(choice: TextKindChoice | null | undefined): string {
  const kind = getTextKind(choice?.key);
  if (!kind) return '';
  const other = otherText(choice);
  if (other) {
    return `The user says this text is: ${other}. Keep it that kind of text, in the same form and of about the same length as the original.`;
  }
  return kind.writing;
}

/**
 * What the rewrite step is told when a version is changed by request
 * ("shorter", "warmer"). That step was built for pages. The request comes
 * first: "add a call to action" on a slogan is the user's decision.
 */
export function textKindChangeNote(choice: TextKindChoice | null | undefined): string {
  const kind = getTextKind(choice?.key);
  if (!kind) return '';
  const other = otherText(choice);
  if (other) {
    return `The user says this text is: ${other}. Keep it that kind of text and in the same form, unless the request asks for something else.`;
  }
  if (!kind.noun) return '';
  return `This text is ${kind.noun}. Keep it that kind of text and in the same form, and do not add section headings, unless the request asks for something else.`;
}

/** In the comparison step's context line. Null: that step keeps its own wording. */
export function textKindContextLabel(choice: TextKindChoice | null | undefined): string | null {
  const kind = getTextKind(choice?.key);
  if (!kind) return null;
  const other = otherText(choice);
  if (other) return other;
  return kind.scoring ? kind.label : null;
}

/** One short text that is the same for two choices exactly when they are judged the same way. */
export function textKindId(choice: TextKindChoice | null | undefined): string {
  const kind = getTextKind(choice?.key);
  if (!kind) return '';
  const other = otherText(choice);
  if (other) return `other:${other}`;
  return kind.scoring ? kind.key : '';
}
