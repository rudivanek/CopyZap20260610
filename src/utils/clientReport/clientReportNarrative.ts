import { FormState, GeneratedContentItem, VersionDeepAnalysis } from '../../types';
import { ComparisonResult } from '../../services/api/comprehensiveScoring';
import { makeStreamingReportRequest } from '../../services/api/utils';
import { getAdminClaudeModel } from '../../constants';
import {
  buildClientReportInputMarkdown,
  ClientReportNarrative,
  ClientReportFinding,
} from './buildClientReportData';

const SYSTEM_PROMPT = `Eres un estratega de copy senior de un estudio de branding. Escribes en español de España neutro, profesional y directo, sin jerga de marketing ni superlativos vacíos. Tu lector es el dueño o responsable de marketing de la empresa analizada: no te conoce, es escéptico, y va a decidir en treinta segundos si este documento merece su atención.

Reglas:
- Nunca inventes datos, cifras ni hechos que no estén en el material proporcionado.
- Nunca afirmes que algo es falso; di que no está respaldado o que no se puede verificar.
- Sé específico. Cita el texto real del sitio cuando refuerce el argumento.
- Frases cortas. Cero relleno. Cero "en el mundo actual".
- Devuelve únicamente JSON válido con la estructura solicitada.`;

const USER_PROMPT_HEADER = `A continuación recibirás el material de un análisis de copy realizado sobre el sitio de una empresa. Tu tarea es producir los textos en español que irán en un reporte ejecutivo dirigido al cliente.

Devuelve EXCLUSIVAMENTE un objeto JSON con esta forma exacta (sin texto fuera del JSON, sin markdown, sin \`\`\`json):

{
  "companyName": "Nombre real de la empresa (no la URL)",
  "executiveSummary": ["<párrafo 1>", "<párrafo 2>", "<párrafo 3>"],
  "findings": [
    { "category": "Credibilidad|Prueba social|Lenguaje|Conversión|Claridad|Estructura|SEO", "title": "Título sin punto final", "bodyHtml": "1–2 frases; cita el sitio con <q>...</q>" }
  ],
  "headToHead": { "originalNote": "1–2 frases", "winnerNote": "1–2 frases" },
  "versionLabels": [
    { "versionId": "id de la versión", "displayName": "Propuesta A · Enfoque directo", "roleLine": "Afirmación primero, prueba inmediata después · 445 palabras" }
  ]
}

REGLLAS DETALLADAS:

1. companyName: el nombre real de la empresa, preferido de og:site_name o <title>. Nunca la URL desnuda.

2. executiveSummary: exactamente TRES párrafos, en este orden:
   - Párrafo 1: qué ya funciona (sé genuinamente justo; esto compra el derecho a criticar).
   - Párrafo 2: el mayor problema único.
   - Párrafo 3: la segunda oportunidad.
   Cada párrafo 2–4 frases. Envuelve la frase clave de cada párrafo en <strong>...</strong>.

3. findings: exactamente CUATRO hallazgos, ordenados por impacto. Categorías permitidas: Credibilidad, Prueba social, Lenguaje, Conversión, Claridad, Estructura, SEO.
   - title: una línea, sin punto final.
   - bodyHtml: 1–2 frases. Si citas el sitio, usa <q>...</q>.
   - NUNCA acuses al sitio de mentir. Marcos correctos: "cifras sin fuente citada", "afirmación no verificable", "superlativo antes de la prueba".
   - Descarta cualquier hallazgo cuyo contenido numérico sea cero (patrones +0, 0 %, +0%, 0.0). No lo reemplaces; simplemente no lo incluyas.

4. headToHead:
   - originalNote: 1–2 frases sobre por qué el titular actual rinde menos.
   - winnerNote: 1–2 frases sobre por qué el titular propuesto funciona.

5. versionLabels: una entrada por cada versión generada (NO la original). El versionId debe coincidir exactamente con el id de la versión tal como aparece en el material.
   - displayName: "Propuesta A · <ángulo>", "Propuesta B · <ángulo>", "Propuesta C · <ángulo>". El ángulo se deriva del texto real.
   - roleLine: una línea corta que describe el enfoque + " · NNN palabras".
   - Si dos versiones son casi idénticas (>85% de solapamiento), la posterior se etiqueta como variante: "Propuesta C · Directo refinado", roleLine "Variante de la propuesta A con cierre reforzado".

Material del análisis:

`;

export async function generateClientReportNarrative(
  formState: FormState,
  generatedOutputCards: GeneratedContentItem[],
  comparisonResult: ComparisonResult | null | undefined,
  versionDeepAnalysis: Record<string, VersionDeepAnalysis> | null | undefined,
): Promise<ClientReportNarrative | null> {
  const inputMarkdown = buildClientReportInputMarkdown(
    formState,
    generatedOutputCards,
    comparisonResult,
    versionDeepAnalysis,
  );

  const userContent = USER_PROMPT_HEADER + inputMarkdown;

  let raw: string;
  try {
    raw = await makeStreamingReportRequest(
      getAdminClaudeModel(),
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      0.3,
      4000,
      'client_report_narrative',
      formState.sessionId,
    );
  } catch (err) {
    console.warn('[clientReport] Narrative AI call failed; using fallback.', err);
    return null;
  }

  const parsed = safeParseNarrative(raw);
  if (!parsed) {
    console.warn('[clientReport] Narrative AI returned invalid JSON; using fallback.');
    return null;
  }
  return parsed;
}

function safeParseNarrative(raw: string): ClientReportNarrative | null {
  if (!raw || !raw.trim()) return null;
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) text = fenceMatch[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const jsonSlice = text.slice(start, end + 1);
  let obj: any;
  try {
    obj = JSON.parse(jsonSlice);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== 'object') return null;

  const findings: ClientReportFinding[] = Array.isArray(obj.findings)
    ? obj.findings
        .filter((f: any) => f && typeof f === 'object')
        .slice(0, 4)
        .map((f: any) => ({
          category: String(f.category || 'Conversión'),
          title: String(f.title || '').replace(/[.:]$/, ''),
          bodyHtml: String(f.bodyHtml || ''),
        }))
    : [];

  return {
    companyName: typeof obj.companyName === 'string' ? obj.companyName : '',
    executiveSummary: Array.isArray(obj.executiveSummary)
      ? obj.executiveSummary.filter((p: any) => typeof p === 'string').slice(0, 3)
      : [],
    findings,
    headToHead: {
      originalNote: obj.headToHead?.originalNote ? String(obj.headToHead.originalNote) : '',
      winnerNote: obj.headToHead?.winnerNote ? String(obj.headToHead.winnerNote) : '',
    },
    versionLabels: Array.isArray(obj.versionLabels)
      ? obj.versionLabels
          .filter((v: any) => v && typeof v === 'object' && v.versionId)
          .map((v: any) => ({
            versionId: String(v.versionId),
            displayName: String(v.displayName || ''),
            roleLine: String(v.roleLine || ''),
          }))
      : [],
  };
}
