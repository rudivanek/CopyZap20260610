/**
 * Quick — the short tips shown when the pointer rests on a choice or a
 * button, or when it is reached with the Tab key (see QuickTips.tsx).
 *
 * All tip texts are here, so they can be read and changed in one place. A tip
 * adds to what is on the screen; it never holds the only copy of something a
 * user must know, because phones and tablets have no pointer to rest.
 *
 * Controls whose name says it all (Continue, Cancel, Log out, the "Jump to"
 * links) have no tip.
 */

/** The goals on the start form, by goal key. */
export const GOAL_TIPS: Record<string, string> = {
  convert: 'Judged hardest on the call to action: a clear, specific next step scores high, a vague or missing one scores low.',
  nurture: 'For readers who already know you. Warmth and relevance count most; no hard sell needed.',
  inform: 'For news and updates. Clarity and order count most; no call to action needed.',
  educate: 'For teaching or onboarding. A clear, complete explanation counts most; jargon and gaps lose points.',
  brand: 'For trust and identity. A consistent, credible voice counts most; hype and pressure lose points.',
  custom: 'Say in a few words what the copy should achieve. The versions are scored by how well they do that.',
};

/** What to do with each part of a page, on the check screen. */
export const PART_TIPS: Record<string, string> = {
  improve: 'This part is rewritten.',
  keep: 'This part goes into the new versions word for word, in its place.',
  leave: 'This part is dropped. It is not rewritten and not scored.',
};

/** The changes that can be ticked on the result screen, by their label. */
export const CHANGE_TIPS: Record<string, string> = {
  Shorter:
    "Down to the number of words you set (a quarter fewer to start with). Keeps the headings and key facts; at a small number, less important detail is left out. Can't be ticked with Longer.",
  Longer:
    "Up to the number of words you set (a third more to start with): explains more fully what your text already says. Adds no new facts; for new content, write it in your own words. Can't be ticked with Shorter.",
  'Stronger call to action': "Makes the ask clearer and more specific. Adds no offers or deadlines your text doesn't have.",
  Warmer: 'Friendlier and closer to the reader, same facts.',
  'More formal': "More distance and polish, same facts. Can't be ticked with Less formal.",
  'Less formal': "More relaxed and conversational, same facts. Can't be ticked with More formal.",
};

export const TIPS = {
  // Top bar and History
  new: 'Start a new run. The current result stays in History.',
  history: 'Your earlier results.',
  open: 'Shows this result again. Nothing is rewritten or charged.',
  rename: 'Give this result a name of your own.',
  remove: 'Removes this result from History for good. You confirm first.',
  // Start form
  fetchPage: 'Reads the text of the page at this address and puts it in the box above. Uses credits.',
  // Check screen
  changeInput: 'Go back to your text and the goal.',
  product: 'What you sell. The new versions write about this.',
  audience: 'Who reads the copy. Tone and words are chosen for them.',
  tone: 'How the new versions should sound.',
  language: 'The language the new versions are written in.',
  kind: 'What the copy is, so it is written and judged as that: a page, a slogan, an email, a post, an ad.',
  generate: 'Writes three versions and scores them with your original. Uses credits.',
  back: "Back to your text and goal. Your corrections here stay as long as you don't change the text.",
  // Result screen
  copy: 'Copies this version as text, ready to paste.',
  exportReport: 'Saves a report of all versions, scores and reasons as a file you can open or send.',
  editMyself: 'Opens the best version as text. Change it and CopyZap scores your edit.',
  goToChange: 'Jump to "What should change?" below.',
  startOver: 'New copy, new run. This result stays in History.',
  lengthWords: 'How many words the best version should have afterwards. CopyZap gets close to it, usually within about 15%.',
  changeIt: 'Rewrites the best version once with everything you ticked and wrote, scores it, and keeps whichever is better. Uses credits.',
  scoreAgain: 'Scores the versions again. Uses credits.',
  saveAgain: 'Tries again to save this result to History.',
  scoreEdit: 'Scores your edited text and compares it with the best version. Uses credits.',
};
