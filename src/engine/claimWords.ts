/**
 * Quick — words that make a claim stronger than the original made it.
 *
 * The writer is told not to make a claim stronger (keepToOriginal.ts), but on
 * 2026-10-15, on a logoforo.com seminar page, the winning version turned
 * "psicóloga clínica y logoterapeuta" into "logoterapeuta certificada", a
 * "diploma … con carga académica de 46 horas" into "46 horas certificadas",
 * and called the Viktor Frankl Institute "la máxima autoridad mundial". None
 * of the existing checks saw it: 46 is a number of the original, and nothing
 * was in quotation marks. ChatGPT and Claude, asked to check the score, both
 * did.
 *
 * This finds such words by plain text (no model call, no cost): a word from a
 * group below in a version, when the original (with the user's facts) has no
 * word of the same group. "certificada" is fine when the original says
 * "certificación"; it is flagged when the original never speaks of certifying.
 *
 * The groups are kept short on purpose: words that state a credential, a
 * rank, a guarantee or a proof. Ordinary praise ("excelente", "great") is
 * not listed: it is tone, not a fact a reader could check. Nor is "the best":
 * "la mejor manera de aprender" (the best way to learn) is common wording,
 * not a claim about the business.
 *
 * Measured on 2026-10-15 on the last 60 Quick results: 15 findings, of which
 * three were "certificado SSL" (now left out) and the rest real upgrades
 * ("Learning Partner oficial de Odoo", "la mayor autoridad mundial", "same
 * day, guaranteed", "coaching que garantiza la adopción real"), plus a few
 * milder ones ("garantizando que cada decisión…") that are still claims the
 * original does not make.
 *
 * Languages: Spanish, English, German, French, Italian, Portuguese.
 */

/** A letter or digit next to the match means it is part of a longer word. */
const EDGE_BEFORE = '(?<![\\p{L}\\p{N}])';
const EDGE_AFTER = '(?![\\p{L}\\p{N}])';

interface ClaimGroup {
  key: string;
  /** What a version may not add. Whole words; matched without regard to case. */
  find: string;
  /** Any of these in the original allows the group: the same idea, in any form. */
  allow: string;
}

const GROUPS: ClaimGroup[] = [
  {
    key: 'certified',
    // Not "certificado SSL" (an SSL certificate is a technical part, not a credential).
    find: '(certificad[oa]s?|certificat[oaie]|certified|certifi[ée]e?s?|zertifiziert\\p{L}*)(?!\\s+(SSL|TLS)(?![\\p{L}\\p{N}]))',
    allow: '(certific|certifi[ée]|zertifi)',
  },
  {
    key: 'accredited',
    find: '(acreditad[oa]s?|accredited|akkreditiert\\p{L}*|accr[ée]dit[ée]e?s?|accreditat[oaie])',
    allow: '(acredit|accredit|akkredit|accr[ée]dit)',
  },
  {
    key: 'official',
    find: '(oficial(es)?|official|offiziell\\p{L}*|officiel(le)?s?|ufficial[ei])',
    allow: '(oficial|official|offiziell|officiel|ufficial)',
  },
  {
    key: 'authority',
    find:
      '((m[áa]xima|mayor|principal) autoridad|autoridad (mundial|internacional|l[íi]der)|' +
      "(world|leading|global|top|foremost)[\\s-]+(authority|expert)|world'?s (leading|top|foremost)|" +
      'l[íi]der(es)? (mundial(es)?|del mercado|en (el|la|su))|world[\\s-]+leader|market[\\s-]+leader|industry[\\s-]+leader|' +
      'weltweit f[üu]hrend\\p{L}*|marktf[üu]hrer\\p{L}*|leader (mondial|du march[ée]|nel)|' +
      'n[úu]mero (uno|1)|number (one|1)|nº ?1|no\\. ?1|#1)',
    allow: '(autoridad|authority|l[íi]der|leader|leading|f[üu]hrend|marktf[üu]hrer|n[úu]mero (uno|1)|number (one|1)|nº ?1|#1)',
  },
  {
    key: 'guaranteed',
    find: '(garantiz\\p{L}*|garant[íi]as?|guarantee[ds]?|guaranteeing|garantiert\\p{L}*|garanti[est]?|garantito|garantid[oa]s?)',
    allow: '(garant|guarant)',
  },
  {
    key: 'award',
    find: '(premiad[oa]s?|galardonad[oa]s?|award[\\s-]+winning|preisgekr[öo]nt\\p{L}*|prim[ée]e?s?|premiat[oaie])',
    allow: '(premi|galard|award|preis|prim[ée])',
  },
  {
    key: 'recognised',
    find:
      '(reconocid[oa]s? (internacional|mundial)mente|(internacional|mundial)mente reconocid[oa]s?|' +
      'internationally[\\s-]+recogni[sz]ed|international anerkannt\\p{L}*|reconnue? (internationalement|mondialement)|' +
      'riconosciut[oaie] (a livello )?internazional\\p{L}*|reconhecid[oa]s? internacionalmente)',
    allow: '(reconoc|recogni|anerkannt|reconnu|riconosc|reconhec)',
  },
  {
    key: 'proven',
    find:
      '((cient[íi]fica|cl[íi]nica)mente (comprobad|probad|demostrad)[oa]s?|(scientifically|clinically)[\\s-]+proven|' +
      'wissenschaftlich (belegt|bewiesen|erwiesen)|(scientifiquement|cliniquement) prouv[ée]e?s?|' +
      '(scientificamente|clinicamente) (provat|dimostrat)[oaie]|(cientifica|clinica)mente comprovad[oa]s?)',
    allow: '(comprob|probad|demostrad|proven|belegt|bewiesen|erwiesen|prouv|provat|dimostrat|comprovad)',
  },
];

const compiled = GROUPS.map(group => ({
  key: group.key,
  find: new RegExp(`${EDGE_BEFORE}${group.find}${EDGE_AFTER}`, 'giu'),
  allow: new RegExp(group.allow, 'iu'),
}));

export interface UpgradedClaim {
  /** The words as written in the version, e.g. "certificada". */
  words: string;
  /** The sentence they stand in. */
  context: string;
}

/** The sentence around a position: from the last sentence end before it to the next one after it. */
function sentenceAround(text: string, start: number, end: number): string {
  const before = text.slice(0, start);
  const from = Math.max(before.lastIndexOf('. '), before.lastIndexOf('\n'), before.lastIndexOf('! '), before.lastIndexOf('? '));
  const after = text.slice(end);
  const stops = ['. ', '\n', '! ', '? '].map(stop => after.indexOf(stop)).filter(at => at >= 0);
  const to = stops.length > 0 ? end + Math.min(...stops) + 1 : text.length;
  return text
    .slice(from + 1, to)
    .replace(/[*_#>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The words in `text` that make a claim stronger than `allowed` (the original
 * and the user's facts) makes it. One finding per place; the same words in
 * the same sentence are listed once.
 */
export function findUpgradedClaims(text: string, allowed: string): UpgradedClaim[] {
  const source = text || '';
  const reference = allowed || '';
  const found: UpgradedClaim[] = [];
  const seen = new Set<string>();
  for (const group of compiled) {
    if (group.allow.test(reference)) continue;
    group.find.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = group.find.exec(source)) !== null) {
      const words = match[0];
      // Inside a marker line ([[TESTIMONIALS-1]]) or a kept quotation: not the writer's words.
      const lineStart = source.lastIndexOf('\n', match.index) + 1;
      const lineEnd = source.indexOf('\n', match.index);
      const line = source.slice(lineStart, lineEnd < 0 ? source.length : lineEnd);
      if (/\[\[[^\]]*\]\]/.test(line)) continue;
      const context = sentenceAround(source, match.index, match.index + words.length);
      const key = `${words.toLowerCase()}|${context}`;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({ words, context });
    }
  }
  return found;
}
