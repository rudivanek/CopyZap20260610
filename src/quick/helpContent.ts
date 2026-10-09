/**
 * The words of the help: the three steps shown on a first visit, and the
 * sections of the help page. Kept apart from the components so both show the
 * same text.
 */
import { QUICK_MAX_VERSIONS, QUICK_CHANGE_MAX_CHARS } from '../engine/changeQuickVersion';
import { QUICK_MAX_INPUT_WORDS, QUICK_MAX_WORDS, QUICK_MIN_WORDS } from '../engine/buildQuickFormState';
import { QUICK_LANGUAGES } from '../engine/inferQuickBrief';
import { QUICK_SCORE_MARGIN, QUICK_SCORE_SAMPLES } from '../engine/runQuickPipeline';

export interface HelpStep {
  title: string;
  text: string;
}

export const HELP_STEPS: HelpStep[] = [
  {
    title: 'Bring your copy',
    text: 'Paste it, or type the address of the page and let CopyZap fetch it.',
  },
  {
    title: 'Check what CopyZap understood',
    text:
      'Correct what you sell, who it is for and the tone. Then decide for each part of the page: improve it, keep it as it is, or leave it out. Testimonials are kept as they are unless you choose otherwise.',
  },
  {
    title: 'Get three versions, scored',
    text:
      'The best one is on top, with the reasons for its score and what to check before you publish. From there you can ask for a change, edit it yourself, or export a report.',
  },
];

/** One entry of a help section: a term with its explanation, or a plain paragraph. */
export interface HelpItem {
  term?: string;
  text: string;
}

export interface HelpSection {
  id: string;
  title: string;
  intro?: string;
  items: HelpItem[];
}

const languages = `${QUICK_LANGUAGES.slice(0, -1).join(', ')} and ${QUICK_LANGUAGES[QUICK_LANGUAGES.length - 1]}`;
const words = (n: number) => n.toLocaleString('en-US');

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'copy',
    title: 'Bringing your copy',
    items: [
      {
        term: 'Paste or fetch',
        text:
          'Paste the text, or type the address of a page and press "Fetch page". When a page is fetched, CopyZap leaves out what is not copy: menus, rows of links, cookie notices, and the second copy a slider keeps of its slides. The line under the box says how many lines were left out. Read the text once and trim what does not belong.',
      },
      {
        term: 'Length',
        text: `CopyZap works on ${words(QUICK_MIN_WORDS)} to ${words(QUICK_MAX_WORDS)} words at a time. A longer page, up to ${words(QUICK_MAX_INPUT_WORDS)} words, can be brought in when it has headings: on the check screen you leave out parts until ${words(QUICK_MAX_WORDS)} words or fewer are in use. A long text without headings has to be shortened first.`,
      },
      {
        term: 'Goal',
        text:
          'What the copy is for: to convert, nurture, inform, educate, or build the brand. The goal decides how the versions are judged. A page that should convert is judged hard on its call to action; a page that should inform is not.',
      },
    ],
  },
  {
    id: 'check',
    title: 'Checking what CopyZap understood',
    intro: 'Before anything is written, CopyZap shows what it read out of your copy. Correct it there: it steers the writing.',
    items: [
      { term: 'Selling, For, Tone', text: 'What you sell, who it is for, and how it should sound.' },
      {
        term: 'Language',
        text: `The versions are written in the language you choose: ${languages}. This screen and the report are always in English.`,
      },
      {
        term: 'Improve',
        text: 'The part is rewritten. This is the starting choice for most parts.',
      },
      {
        term: 'Keep as is',
        text: 'The part goes into the new page unchanged, word for word, in its place. Use it for legal text, prices, or anything that must not change.',
      },
      {
        term: 'Leave out',
        text: 'The part is dropped from the new page. Use it for things that are not copy, such as a list of blog articles.',
      },
      {
        term: 'Testimonials',
        text:
          'What your customers said should not be reworded. Testimonials that CopyZap finds get a row of their own, set to "Keep as is". You can change that choice like any other.',
      },
    ],
  },
  {
    id: 'score',
    title: 'Reading the score',
    items: [
      {
        term: 'Quality score',
        text:
          'A number out of 100. It is the sum of four parts, each out of 25: Clarity, Persuasion, Audience fit and Structure. Your original is scored the same way, so "+15 points" means fifteen more than your original got.',
      },
      {
        term: 'Why this version',
        text: 'One reason for each of the four parts, in the scorer\'s own words. Read them: they say what is strong and what is still weak.',
      },
      {
        term: 'About the same',
        text: `Every version is scored ${QUICK_SCORE_SAMPLES} times and the middle result counts. Even so, a score is not exact. Versions within ${QUICK_SCORE_MARGIN} points of each other are marked "About the same as the best": choose between them by reading, not by the number.`,
      },
      {
        term: 'Comparison & rankings',
        text: 'The table at the bottom of a result lists every version with its gain against your original, its four parts, and its own points to check.',
      },
      {
        term: 'Set aside',
        text: 'A version that repeats a paragraph or is cut short is set aside. It is still listed, but it cannot be the best version.',
      },
    ],
  },
  {
    id: 'check-before-publishing',
    title: 'Check before publishing',
    intro: 'CopyZap does not know your business beyond the copy you gave it. These points are yours to check.',
    items: [
      {
        term: 'Claims to verify',
        text: 'Figures and statements the scorer could not confirm, such as "more than 90 companies" or "the only partner in Mexico". Make sure each one is true and that you can prove it.',
      },
      {
        term: 'Brand voice and tone to review',
        text: 'Wording that may not sound like you: figures of speech, or a tone that is stronger than your original.',
      },
      {
        term: 'Numbers not in your original',
        text: 'Figures a version contains that your copy does not: a price, a percentage, a year, a count. CopyZap compares the numbers itself, in every version. Check each one, or change it back.',
      },
      {
        term: 'Numbers from your original that are missing',
        text: 'Figures your copy has that a version leaves out, such as a price or a delivery time. Decide whether they should come back.',
      },
      {
        term: 'Quoted words not in your original',
        text: 'Words in quotation marks that do not appear in your copy. Remove them, or replace them with the exact words the person said.',
      },
    ],
  },
  {
    id: 'after',
    title: 'Working on a result',
    items: [
      { term: 'Copy', text: 'Copies the best version. Every other version has its own Copy button when you open it.' },
      {
        term: 'Change it',
        text: `Say in your own words what should change, in up to ${QUICK_CHANGE_MAX_CHARS} characters, or use one click: Shorter, More formal, Warmer, Stronger call to action. CopyZap rewrites the best version, scores the new one, and shows whichever scores higher on top. Parts you kept stay kept.`,
      },
      {
        term: 'Edit it myself',
        text: 'Opens the best version as text. Change what you want and press "Score my edit". Nothing is rewritten for you. A line in [[double brackets]] stands for a part that is kept as it is: leave that line where the part belongs.',
      },
      { term: 'Export report', text: 'Opens a report of the whole result that you can save or send to a client. It is in English.' },
      {
        term: 'History',
        text: `Every result is saved by itself. Under History you can open, rename or delete it. A result holds up to ${QUICK_MAX_VERSIONS} versions; after that, start a new one.`,
      },
    ],
  },
  {
    id: 'credits',
    title: 'Credits',
    items: [
      { text: 'The top bar shows the credits you have left.' },
      {
        term: 'What uses them',
        text: 'Writing and scoring. A full run on a page of about 1,000 words uses roughly 60 credits and takes two to three minutes. A page of 5,000 words uses roughly 160 to 200 credits and takes eight to ten minutes. A change, or scoring your own edit, uses less.',
      },
      { term: 'What does not', text: 'Opening results, History, copying and exporting.' },
    ],
  },
  {
    id: 'limits',
    title: 'What CopyZap does not do',
    items: [
      { text: 'It improves copy you already have. It does not write a page from nothing.' },
      { text: `It does not work on more than ${words(QUICK_MAX_WORDS)} words in one run. For a longer page, leave parts out on the check screen and run them separately.` },
      {
        text: 'It cannot fetch a page that is behind a login or that refuses automated visits. Numbers that a page only shows through an animation arrive empty: type them in before you continue.',
      },
      { text: 'It does not check facts. See "Check before publishing".' },
    ],
  },
  {
    id: 'trouble',
    title: 'If something goes wrong',
    items: [
      { term: 'A page cannot be fetched', text: 'Open the page yourself, copy its text, and paste it.' },
      {
        term: 'A version could not be scored',
        text: 'Press "Score again" on the result. The versions are kept; only the scoring is repeated.',
      },
      {
        term: 'The copy is in another language',
        text: `CopyZap writes in ${languages}. For other languages, choose the closest one on the check screen or translate first.`,
      },
      { term: 'Anything else', text: 'Write to hi@copyzap.app and say what you did and what you saw.' },
    ],
  },
];
