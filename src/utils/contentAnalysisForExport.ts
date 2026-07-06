/**
 * ON-THE-FLY CONTENT ANALYSIS FOR EXPORTS
 *
 * Generates Key Strengths and Suggested Improvements during export
 * without requiring deep analysis to have been triggered in the app.
 */

import { calculateMultiScoreDisplay } from './multiScoreDisplay';

export interface ExportAnalysisResult {
  keyStrengths: string[];
  suggestedImprovements: string[];
}

export type AnalysisLangCode = 'en' | 'es';

/**
 * Analyze content and generate Key Strengths and Suggested Improvements.
 * Dispatches to the appropriate language-specific implementation.
 */
export function generateExportAnalysis(content: string, langCode: AnalysisLangCode = 'en'): ExportAnalysisResult {
  if (!content || content.trim().length === 0) {
    return { keyStrengths: [], suggestedImprovements: [] };
  }
  return langCode === 'es' ? generateExportAnalysisEs(content) : generateExportAnalysisEn(content);
}

function generateExportAnalysisEn(content: string): ExportAnalysisResult {
  const contentLower = content.toLowerCase();
  const keyStrengths: string[] = [];
  const suggestedImprovements: string[] = [];

  const scores = calculateMultiScoreDisplay(content);

  // === KEY STRENGTHS ===

  if (contentLower.includes('help') || contentLower.includes('benefit') ||
      contentLower.includes('solution') || contentLower.includes('service')) {
    keyStrengths.push('Communicates clear value proposition and service offering');
  }

  if (contentLower.includes('experience') || contentLower.includes('expert') ||
      contentLower.includes('professional') || contentLower.includes('years') ||
      contentLower.includes('proven') || contentLower.includes('trusted')) {
    keyStrengths.push('Establishes credibility through expertise and experience references');
  }

  if (contentLower.match(/\b(local|community|region|area|city|country)\b/)) {
    keyStrengths.push('Emphasizes local presence or geographic specificity');
  }

  if (contentLower.match(/\b(contact|call|email|visit|schedule|book|request|get|start|try)\b/)) {
    keyStrengths.push('Includes clear call-to-action to guide next steps');
  }

  if (contentLower.includes('you') || contentLower.includes('your') ||
      contentLower.includes('customer') || contentLower.includes('client')) {
    keyStrengths.push('Uses customer-focused language and perspective');
  }

  if (contentLower.match(/\b(result|outcome|achieve|deliver|success|grow|increase)\b/)) {
    keyStrengths.push('Focuses on concrete outcomes and results');
  }

  if (scores.risk === 'Low') {
    keyStrengths.push('Maintains professional tone appropriate for business communication');
  }

  // === SUGGESTED IMPROVEMENTS ===

  if (scores.conversion < 50) {
    suggestedImprovements.push('Strengthen urgency and motivators to drive action');
    suggestedImprovements.push('Add more compelling value statements or unique differentiators');
  } else if (scores.conversion < 70) {
    suggestedImprovements.push('Consider adding urgency elements or time-sensitive offers');
  }

  if (scores.trust < 50) {
    suggestedImprovements.push('Add supporting evidence, testimonials, or case studies to build trust');
    suggestedImprovements.push('Soften claims or provide more specific proof points');
  } else if (scores.trust < 70) {
    suggestedImprovements.push('Consider adding social proof or credibility indicators');
  }

  if (!contentLower.match(/\b(\d+%|\d+ years?|\d+ clients?|\d+ customers?)\b/)) {
    suggestedImprovements.push('Include specific numbers, metrics, or timeframes to add credibility');
  }

  if (contentLower.includes('best') || contentLower.includes('leading') ||
      contentLower.includes('top') || contentLower.includes('amazing')) {
    suggestedImprovements.push('Replace superlatives with specific, verifiable statements');
  }

  if (contentLower.includes('solutions') || contentLower.includes('services')) {
    if (!contentLower.match(/\b(such as|including|like|for example)\b/)) {
      suggestedImprovements.push('Provide specific examples of solutions or services offered');
    }
  }

  if (!contentLower.match(/\b(save|grow|increase|improve|reduce|enhance|boost)\b/)) {
    suggestedImprovements.push('Clarify tangible benefits customers will receive');
  }

  if (scores.conversion < 60 && contentLower.match(/\b(contact|learn more)\b/)) {
    suggestedImprovements.push('Use more action-oriented CTA language (e.g., "Get started", "Schedule now")');
  }

  if (scores.risk === 'High') {
    suggestedImprovements.push('Review language for potential spam triggers or compliance issues');
  } else if (scores.risk === 'Medium') {
    suggestedImprovements.push('Consider softening aggressive or potentially problematic phrasing');
  }

  if (keyStrengths.length === 0) keyStrengths.push('Content presents core offering in accessible language');
  if (keyStrengths.length === 1) keyStrengths.push('Message structure supports reader comprehension');
  if (suggestedImprovements.length === 0) suggestedImprovements.push('Consider adding more specific details or examples');
  if (suggestedImprovements.length === 1) suggestedImprovements.push('Explore opportunities to strengthen unique value proposition');

  return {
    keyStrengths: keyStrengths.slice(0, 8),
    suggestedImprovements: suggestedImprovements.slice(0, 8),
  };
}

function generateExportAnalysisEs(content: string): ExportAnalysisResult {
  const contentLower = content.toLowerCase();
  const keyStrengths: string[] = [];
  const suggestedImprovements: string[] = [];

  const scores = calculateMultiScoreDisplay(content);

  // === PUNTOS FUERTES ===

  if (contentLower.includes('ayuda') || contentLower.includes('beneficio') ||
      contentLower.includes('solución') || contentLower.includes('solucion') ||
      contentLower.includes('servicio') || contentLower.includes('ofrece')) {
    keyStrengths.push('Comunica una propuesta de valor y una oferta de servicio claras');
  }

  if (contentLower.includes('experiencia') || contentLower.includes('experto') ||
      contentLower.includes('profesional') || contentLower.includes('años') ||
      contentLower.includes('probado') || contentLower.includes('confianza') ||
      contentLower.includes('especialización') || contentLower.includes('especializacion')) {
    keyStrengths.push('Genera credibilidad mediante referencias a experiencia y especialización');
  }

  if (contentLower.match(/\b(local|comunidad|región|region|área|area|ciudad|país|pais)\b/)) {
    keyStrengths.push('Destaca la presencia local o la especificidad geográfica');
  }

  if (contentLower.match(/\b(contacta|llama|escribe|visita|agenda|reserva|solicita|empieza|prueba|comienza)\b/)) {
    keyStrengths.push('Incluye una llamada a la acción clara para orientar los próximos pasos');
  }

  if (contentLower.includes('tú') || contentLower.includes('tu ') || contentLower.includes('tu,') ||
      contentLower.includes('usted') || contentLower.includes('cliente') || contentLower.includes('clientes')) {
    keyStrengths.push('Utiliza un lenguaje y una perspectiva centrados en el cliente');
  }

  if (contentLower.match(/\b(resultado|logro|conseguir|entregar|éxito|exito|crecer|aumentar)\b/)) {
    keyStrengths.push('Se enfoca en resultados concretos y beneficios tangibles');
  }

  if (scores.risk === 'Low') {
    keyStrengths.push('Mantiene un tono profesional adecuado para la comunicación empresarial');
  }

  // === MEJORAS SUGERIDAS ===

  if (scores.conversion < 50) {
    suggestedImprovements.push('Refuerza la urgencia y los motivadores para impulsar la acción');
    suggestedImprovements.push('Añade declaraciones de valor más convincentes o diferenciadores únicos');
  } else if (scores.conversion < 70) {
    suggestedImprovements.push('Considera agregar elementos de urgencia u ofertas con límite de tiempo');
  }

  if (scores.trust < 50) {
    suggestedImprovements.push('Añade evidencias, testimonios o casos de estudio para generar confianza');
    suggestedImprovements.push('Suaviza las afirmaciones o proporciona puntos de prueba más específicos');
  } else if (scores.trust < 70) {
    suggestedImprovements.push('Considera incluir prueba social o indicadores de credibilidad');
  }

  if (!contentLower.match(/\b(\d+%|\d+ años?|\d+ clientes?|\d+ usuarios?)\b/)) {
    suggestedImprovements.push('Incluye cifras, métricas o plazos específicos para añadir credibilidad');
  }

  if (contentLower.includes('mejor') || contentLower.includes('líder') || contentLower.includes('lider') ||
      contentLower.includes('top') || contentLower.includes('increíble') || contentLower.includes('increible')) {
    suggestedImprovements.push('Reemplaza los superlativos con declaraciones específicas y verificables');
  }

  if (contentLower.includes('soluciones') || contentLower.includes('servicios')) {
    if (!contentLower.match(/\b(como|incluyendo|por ejemplo|tales como)\b/)) {
      suggestedImprovements.push('Proporciona ejemplos específicos de las soluciones o servicios ofrecidos');
    }
  }

  if (!contentLower.match(/\b(ahorrar|crecer|aumentar|mejorar|reducir|potenciar|impulsar)\b/)) {
    suggestedImprovements.push('Clarifica los beneficios tangibles que recibirán los clientes');
  }

  if (scores.conversion < 60 && contentLower.match(/\b(contacta|más información)\b/)) {
    suggestedImprovements.push('Usa un lenguaje de CTA más orientado a la acción (p. ej., "Empieza ahora", "Agenda hoy")');
  }

  if (scores.risk === 'High') {
    suggestedImprovements.push('Revisa el lenguaje para detectar posibles detonadores de spam o problemas de cumplimiento');
  } else if (scores.risk === 'Medium') {
    suggestedImprovements.push('Considera suavizar las frases agresivas o potencialmente problemáticas');
  }

  if (keyStrengths.length === 0) keyStrengths.push('El contenido presenta la oferta principal en un lenguaje accesible');
  if (keyStrengths.length === 1) keyStrengths.push('La estructura del mensaje facilita la comprensión del lector');
  if (suggestedImprovements.length === 0) suggestedImprovements.push('Considera añadir más detalles o ejemplos específicos');
  if (suggestedImprovements.length === 1) suggestedImprovements.push('Explora oportunidades para reforzar la propuesta de valor única');

  return {
    keyStrengths: keyStrengths.slice(0, 8),
    suggestedImprovements: suggestedImprovements.slice(0, 8),
  };
}
