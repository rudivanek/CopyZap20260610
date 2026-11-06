/**
 * Promise words that are always listed as a claim to check when neither the
 * original nor the user's facts (answers, website) say them: offer terms,
 * guarantees, scarcity and response times. The claim check finds most of them,
 * but not every time (2026-11-06: "sin compromiso" in an ad and in a homepage,
 * "spots won't stay open forever" in a newsletter went unmarked). These are the
 * lines that get an agency in trouble with a client, so they are matched here
 * by their words as well, every time.
 */
import { standsIn } from './sourceClaims';

const RISKY_PATTERNS: RegExp[] = [
  // Spanish
  /sin compromiso/gi,
  /sin costo(?: alguno| adicional| extra)?/gi,
  /sin cargo(?: adicional| extra)?/gi,
  /\bgratis\b/gi,
  /\bgratuit[oa]s?\b/gi,
  /\bgarantizad[oa]s?\b/gi,
  /\bgarant[ií]a(?: de [a-záéíóúñ]+)?/gi,
  /(?:cupos?|lugares|plazas|vacantes) limitad[oa]s/gi,
  /(?:por|durante) tiempo limitado/gi,
  /oferta limitada/gi,
  /[uú]ltimos (?:lugares|cupos)/gi,
  /solo (?:por )?hoy/gi,
  /en menos de \d+ (?:horas|minutos|d[ií]as)/gi,
  /respuesta inmediata/gi,
  /devoluci[oó]n de (?:tu|su) dinero/gi,
  /reembolso/gi,
  // English
  /no[- ]obligation/gi,
  /no[- ]commitment/gi,
  /no strings attached/gi,
  /risk[- ]free/gi,
  /\bfree (?:trial|consultation|quote|estimate|session|class|week|month|shipping|delivery|assessment|audit)\b/gi,
  /\bfor free\b/gi,
  /free of charge/gi,
  /at no (?:extra |additional )?cost/gi,
  /\bguarantee[ds]?\b/gi,
  /money[- ]back/gi,
  /limited (?:spots|places|seats|availability|time|offer)/gi,
  /(?:won't|will not) (?:stay open|last)(?: forever| long)?/gi,
  /only \d+ (?:spots|places|seats)/gi,
  /within \d+ (?:hours|minutes|days)/gi,
  /same[- ]day/gi,
  /(?:details|more (?:info|information|news)) (?:are |is |will be )?coming soon/gi,
  /pr[oó]ximamente/gi,
  // French, German, Italian, Portuguese
  /sans engagement/gi,
  /\bgratuite?s?\b/gi,
  /\bgaranti(?:e|es|s)?\b/gi,
  /places limit[ée]es/gi,
  /\bunverbindlich\w*/gi,
  /\bkostenlos\w*/gi,
  /\bgarantiert\b/gi,
  /begrenzte (?:Plätze|Teilnehmerzahl)/gi,
  /senza impegno/gi,
  /\bgarantit[oaie]\b/gi,
  /posti limitati/gi,
  /sem compromisso/gi,
  /\bgr[aá]tis\b/gi,
  /\bgarantid[oa]s?\b/gi,
  /vagas limitadas/gi,
];

/** The promise words in the text that the allowed text (original, answers, website) does not have. */
export function riskyPhrasesNotIn(text: string, allowed: string): string[] {
  const found: string[] = [];
  for (const pattern of RISKY_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const phrase = match[0].trim();
      if (!phrase || standsIn(phrase, allowed)) continue;
      if (found.some(other => other.toLowerCase() === phrase.toLowerCase())) continue;
      found.push(phrase);
    }
  }
  return found;
}

/**
 * The claims the check found, with the promise words it missed added. A promise
 * word inside a claim already listed is not listed again. When the check itself
 * failed (null), the promise words alone are returned, or null when there are none.
 */
export function withRiskyPhrases(text: string, allowed: string, claims: string[] | null): string[] | null {
  const risky = riskyPhrasesNotIn(text, allowed).filter(
    phrase => !(claims ?? []).some(claim => standsIn(phrase, claim))
  );
  if (risky.length === 0) return claims;
  return [...(claims ?? []), ...risky];
}
