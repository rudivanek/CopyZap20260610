import { QuickPolishInput, QuickPolishResult } from './types';
import { INTENT_PRESETS } from './intents';
import { makeApiRequestWithFallback, cleanJsonResponse } from '../../services/api/utils';
import { Model } from '../../types';
import { validateNarrowServiceResult, buildNarrowRepairReminder } from '../../utils/copyMakerOutputValidation';

function detectLanguage(text: string): 'es' | 'en' {
  const spanishPatterns = /\b(el|la|los|las|un|una|de|en|para|por|con|que|es|son|como|más|pero|este|esta|estos|estas|muy|bien|hacer|puede|ejemplo|desde|hasta|también|solo)\b/i;
  const spanishChars = /[áéíóúñü¿¡]/i;

  if (spanishPatterns.test(text) || spanishChars.test(text)) {
    return 'es';
  }
  return 'en';
}

function buildPrompt(input: QuickPolishInput, language: 'en' | 'es'): string {
  const preset = INTENT_PRESETS.find(p => p.id === input.intentId);
  if (!preset) {
    throw new Error('Invalid intent selected');
  }

  const isHtml = input.contentType === 'html';
  const variantText = input.variantsCount === 1 ? 'variant' : `${input.variantsCount} variants`;

  let promptParts: string[] = [];

  if (language === 'es') {
    promptParts.push(`Eres un experto en copywriting. Tu tarea es pulir y mejorar el siguiente texto.`);
    promptParts.push(`\nTipo de contenido: ${preset.label}`);
    promptParts.push(`Descripción: ${preset.description}`);
  } else {
    promptParts.push(`You are an expert copywriter. Your task is to polish and improve the following text.`);
    promptParts.push(`\nContent Type: ${preset.label}`);
    promptParts.push(`Description: ${preset.description}`);
  }

  // Language Rule (Output Language Must Match Input Language)
  if (language === 'es') {
    promptParts.push(`\n═══ REGLA DE IDIOMA ═══`);
    promptParts.push(`CRÍTICO: Escribe el output en el MISMO IDIOMA que el texto de entrada del usuario.`);
    promptParts.push(`NO traduzcas a menos que se solicite explícitamente.`);
    promptParts.push(`NO cambies de idioma.`);
    promptParts.push(`Si el input está en inglés → output en inglés.`);
    promptParts.push(`Si el input está en español → output en español.`);
    promptParts.push(`Si el input está en alemán → output en alemán.`);
    promptParts.push(`Si el input está en francés → output en francés.`);
    promptParts.push(`Si el input está en cualquier otro idioma → output en ese mismo idioma.`);
    promptParts.push(`Si el input tiene idiomas mezclados → sigue el idioma dominante y preserva nombres propios, nombres de marca/producto, y frases extranjeras intencionadas.`);
    promptParts.push(`Determina el idioma del input automáticamente y produce todas las variantes en ese mismo idioma.`);
  } else {
    promptParts.push(`\n═══ LANGUAGE RULE ═══`);
    promptParts.push(`CRITICAL: Write the output in the SAME LANGUAGE as the user's input text.`);
    promptParts.push(`Do NOT translate unless explicitly requested.`);
    promptParts.push(`Do NOT switch languages.`);
    promptParts.push(`If input is English → output in English.`);
    promptParts.push(`If input is Spanish → output in Spanish.`);
    promptParts.push(`If input is German → output in German.`);
    promptParts.push(`If input is French → output in French.`);
    promptParts.push(`If input is any other language → output in that same language.`);
    promptParts.push(`If input has mixed languages → follow the dominant language and preserve proper nouns, brand/product names, and intentional foreign phrases.`);
    promptParts.push(`Determine the input language automatically and produce all variants in that same language.`);
  }

  if (input.audience) {
    promptParts.push(language === 'es' ? `\nAudiencia objetivo: ${input.audience}` : `\nTarget Audience: ${input.audience}`);
  }

  if (input.goal) {
    promptParts.push(language === 'es' ? `\nObjetivo/Resultado deseado: ${input.goal}` : `\nGoal/Desired Outcome: ${input.goal}`);
  }

  if (input.tone) {
    promptParts.push(language === 'es' ? `\nTono: ${input.tone}` : `\nTone: ${input.tone}`);
  }

  if (input.cta) {
    promptParts.push(language === 'es' ? `\nLlamada a la acción: ${input.cta}` : `\nCall to Action: ${input.cta}`);
  }

  if (input.specialInstructions) {
    promptParts.push(language === 'es' ? `\nInstrucciones Especiales: ${input.specialInstructions}` : `\nSpecial Instructions: ${input.specialInstructions}`);
  }

  if (isHtml) {
    if (language === 'es') {
      promptParts.push(`\nIMPORTANTE: El texto de entrada está en HTML. DEBES preservar todas las etiquetas HTML y la estructura. Solo reescribe el contenido de texto dentro de las etiquetas. No agregues scripts ni nuevas etiquetas a menos que sea necesario para la estructura existente.`);
    } else {
      promptParts.push(`\nIMPORTANT: The input text is HTML. You MUST preserve all HTML tags and structure. Only rewrite the text content within the tags. Do not add scripts or new tags unless needed for the existing structure.`);
    }
  }

  if (language === 'es') {
    promptParts.push(`\nReglas de pulido:`);
    promptParts.push(`- Preserva el significado original`);
    promptParts.push(`- Corrige errores gramaticales y mejora la claridad`);
    promptParts.push(`- Elimina palabrería innecesaria`);
    promptParts.push(`- Mantén todos los nombres de marca/producto sin cambios`);
    promptParts.push(`- Sé conciso pero impactante`);
  } else {
    promptParts.push(`\nPolishing Rules:`);
    promptParts.push(`- Preserve the original meaning`);
    promptParts.push(`- Fix grammar and improve clarity`);
    promptParts.push(`- Remove unnecessary fluff`);
    promptParts.push(`- Keep all brand/product names unchanged`);
    promptParts.push(`- Be concise but impactful`);
  }

  // Global Trust Rule (Prevent Over-Marketing Guardrail)
  // Define intent policy for marketing additions
  const allowsMarketingAdditions = ['cta', 'ad_short', 'product_desc_short', 'instagram_caption'].includes(input.intentId);

  if (language === 'es') {
    promptParts.push(`\n═══ REGLA DE CONFIANZA GLOBAL ═══`);
    promptParts.push(`NO introduzcas nuevas afirmaciones de marketing, promesas, garantías o llamadas a la acción a menos que estén explícitamente permitidas por el intent seleccionado.`);
    promptParts.push(`NO agregues beneficios, características o resultados que no estén presentes en el texto de entrada del usuario.`);
    promptParts.push(`Si debes mejorar la redacción de una afirmación existente, hazla MÁS CLARA sin hacerla MÁS FUERTE.`);
    promptParts.push(`\nCATEGORÍAS PROHIBIDAS (a menos que el intent lo permita explícitamente):`);
    promptParts.push(`- Nuevas afirmaciones de marketing: "el mejor", "#1", "garantizado", "probado", "de clase mundial", "sin igual", "líder de la industria"`);
    promptParts.push(`- Nuevas promesas o garantías: "aumentará los ingresos", "garantiza resultados", "resultados instantáneos"`);
    promptParts.push(`- Nuevas CTAs o lenguaje de urgencia: "Compra ahora", "Regístrate hoy", "Tiempo limitado", "No te lo pierdas"`);
    promptParts.push(`- Beneficios/características inventados no presentes en el input`);
    promptParts.push(`- Tono de exageración que agrega persuasión más allá del contenido del usuario`);
    promptParts.push(`\nMEJORAS PERMITIDAS (siempre):`);
    promptParts.push(`- Claridad, gramática, legibilidad, estructura`);
    promptParts.push(`- Reformular afirmaciones existentes en lenguaje más claro SIN aumentar su fuerza`);
    promptParts.push(`- Ajuste ligero de tono consistente con el Tono seleccionado`);
    promptParts.push(`- Mejor flujo y capacidad de escaneo`);
    promptParts.push(`- Reemplazar palabras de moda con lenguaje simple`);

    if (allowsMarketingAdditions) {
      promptParts.push(`\nPOLÍTICA PARA ESTE INTENT: Se permite lenguaje persuasivo moderado, pero AÚN DEBES:`);
      promptParts.push(`- NO inventar nuevos beneficios o características`);
      promptParts.push(`- NO crear promesas o garantías que no estén en el input original`);
      promptParts.push(`- Mantener la persuasión fundamentada en el contenido existente del usuario`);
    } else {
      promptParts.push(`\nPOLÍTICA PARA ESTE INTENT: MODO DE CONFIANZA ESTRICTO`);
      promptParts.push(`- NO se permiten CTAs a menos que se proporcionen explícitamente en el campo CTA`);
      promptParts.push(`- NO se permiten nuevas afirmaciones de marketing o promesas`);
      promptParts.push(`- Enfócate SOLO en claridad, legibilidad y corrección gramatical`);
    }
  } else {
    promptParts.push(`\n═══ GLOBAL TRUST RULE ═══`);
    promptParts.push(`Do NOT introduce new marketing claims, promises, guarantees, or calls-to-action unless explicitly allowed by the selected intent.`);
    promptParts.push(`Do NOT add benefits, features, or outcomes that are not present in the user's input text.`);
    promptParts.push(`If you must improve wording of an existing claim, make it CLEARER without making it STRONGER.`);
    promptParts.push(`\nFORBIDDEN ADDITIONS (unless intent explicitly allows):`);
    promptParts.push(`- New marketing claims: "best", "#1", "guaranteed", "proven", "world-class", "unmatched", "industry-leading"`);
    promptParts.push(`- New promises or guarantees: "will increase revenue", "guarantees results", "instant results"`);
    promptParts.push(`- New CTAs or urgency language: "Buy now", "Sign up today", "Limited time", "Don't miss out"`);
    promptParts.push(`- Invented benefits/features not present in input`);
    promptParts.push(`- Overhyping tone that adds persuasion beyond the user's content`);
    promptParts.push(`\nALLOWED IMPROVEMENTS (always):`);
    promptParts.push(`- Clarity, grammar, readability, structure`);
    promptParts.push(`- Rewording existing claims into clearer language WITHOUT increasing strength`);
    promptParts.push(`- Light tightening of tone consistent with selected Tone`);
    promptParts.push(`- Better flow and scannability`);
    promptParts.push(`- Replacing buzzwords with plain language`);

    if (allowsMarketingAdditions) {
      promptParts.push(`\nPOLICY FOR THIS INTENT: Modest persuasive language allowed, but you STILL MUST:`);
      promptParts.push(`- NOT invent new benefits or features`);
      promptParts.push(`- NOT create promises or guarantees not in the original input`);
      promptParts.push(`- Keep persuasion grounded in the user's existing content`);
    } else {
      promptParts.push(`\nPOLICY FOR THIS INTENT: STRICT TRUST MODE`);
      promptParts.push(`- NO CTAs allowed unless explicitly provided in CTA field`);
      promptParts.push(`- NO new marketing claims or promises`);
      promptParts.push(`- Focus ONLY on clarity, readability, and grammar`);
    }
  }

  // Intent-specific writing rules with soft length awareness
  if (input.intentId === 'hero_branding') {
    if (language === 'es') {
      promptParts.push(`\nReglas específicas para Hero Headline + Subheadline:`);
      promptParts.push(`- Perfil de longitud: CONCISO`);
      promptParts.push(`- Prefiere la brevedad`);
      promptParts.push(`- Evita oraciones largas`);
      promptParts.push(`- Mantén el impacto alto`);
      promptParts.push(`- No expliques de más`);
      promptParts.push(`- El titular y subtítulo deben permanecer ajustados y contundentes`);
    } else {
      promptParts.push(`\nSpecific Rules for Hero Headline + Subheadline:`);
      promptParts.push(`- Length profile: CONCISE`);
      promptParts.push(`- Prefer brevity`);
      promptParts.push(`- Avoid long sentences`);
      promptParts.push(`- Keep impact high`);
      promptParts.push(`- Do not over-explain`);
      promptParts.push(`- Headline and subheadline should remain tight and punchy`);
    }
  } else if (input.intentId === 'section_body') {
    if (language === 'es') {
      promptParts.push(`\nReglas específicas para Cuerpo de Sección:`);
      promptParts.push(`- Perfil de longitud: MODERADO`);
      promptParts.push(`- Permite el desarrollo natural de párrafos`);
      promptParts.push(`- Prioriza el flujo y la legibilidad`);
      promptParts.push(`- Usa oraciones cortas a medianas`);
      promptParts.push(`- Evita la expansión innecesaria`);
      promptParts.push(`- Apunta a la claridad, no a la compresión`);
      promptParts.push(`- Mejora claridad, flujo y legibilidad`);
      promptParts.push(`- Preserva significado y estructura original`);
      promptParts.push(`- Optimiza para escaneo: oraciones más cortas, saltos de párrafo lógicos`);
      promptParts.push(`- Tono neutral a persuasivo según selección`);
      promptParts.push(`- NO reescribas como un titular hero`);
      promptParts.push(`- NO agregues nuevas afirmaciones o ángulos de marketing`);
    } else {
      promptParts.push(`\nSpecific Rules for Section Body Copy:`);
      promptParts.push(`- Length profile: MODERATE`);
      promptParts.push(`- Allow natural paragraph development`);
      promptParts.push(`- Prioritize flow and readability`);
      promptParts.push(`- Use short-to-medium sentences`);
      promptParts.push(`- Avoid unnecessary expansion`);
      promptParts.push(`- Aim for clarity, not compression`);
      promptParts.push(`- Improve clarity, flow, and readability`);
      promptParts.push(`- Preserve original meaning and structure`);
      promptParts.push(`- Optimize for scannability: shorter sentences, logical paragraph breaks`);
      promptParts.push(`- Neutral to persuasive tone depending on user selection`);
      promptParts.push(`- Do NOT rewrite like a hero headline`);
      promptParts.push(`- Do NOT add new claims or marketing angles`);
    }
  } else if (input.intentId === 'about') {
    if (language === 'es') {
      promptParts.push(`\nReglas específicas para Sección Acerca de:`);
      promptParts.push(`- Perfil de longitud: MODERADO`);
      promptParts.push(`- Explicación equilibrada`);
      promptParts.push(`- Ni lacónico ni verboso`);
      promptParts.push(`- Preserva el flujo narrativo`);
      promptParts.push(`- Evita la palabrería de marketing`);
    } else {
      promptParts.push(`\nSpecific Rules for About Section:`);
      promptParts.push(`- Length profile: MODERATE`);
      promptParts.push(`- Balanced explanation`);
      promptParts.push(`- Neither terse nor verbose`);
      promptParts.push(`- Preserve narrative flow`);
      promptParts.push(`- Avoid marketing fluff`);
    }
  } else if (input.intentId === 'product_desc_short') {
    if (language === 'es') {
      promptParts.push(`\nReglas específicas para Descripción de Producto (Corta):`);
      promptParts.push(`- Perfil de longitud: COMPACTO`);
      promptParts.push(`- Estructura ajustada`);
      promptParts.push(`- Redacción enfocada en beneficios primero`);
      promptParts.push(`- Relleno mínimo`);
      promptParts.push(`- Sin explicaciones largas`);
      promptParts.push(`- Optimizado para escaneo rápido`);
      promptParts.push(`- Enfatiza valor sobre características`);
      promptParts.push(`- Evita lenguaje de marketing exagerado`);
      promptParts.push(`- Mantén el resultado compacto y escaneable`);
    } else {
      promptParts.push(`\nSpecific Rules for Product Description (Short):`);
      promptParts.push(`- Length profile: COMPACT`);
      promptParts.push(`- Tight structure`);
      promptParts.push(`- Benefit-first phrasing`);
      promptParts.push(`- Minimal filler`);
      promptParts.push(`- No long explanations`);
      promptParts.push(`- Optimized for skimmability`);
      promptParts.push(`- Emphasize value over features`);
      promptParts.push(`- Avoid fluff or exaggerated marketing language`);
      promptParts.push(`- Keep output compact and skimmable`);
    }
  } else if (input.intentId === 'cta') {
    if (language === 'es') {
      promptParts.push(`\nReglas específicas para Llamada a la Acción:`);
      promptParts.push(`- Perfil de longitud: MUY CORTO`);
      promptParts.push(`- Palabras mínimas`);
      promptParts.push(`- Verbos fuertes`);
      promptParts.push(`- Sin explicación`);
      promptParts.push(`- Sin párrafos de apoyo`);
    } else {
      promptParts.push(`\nSpecific Rules for Call to Action:`);
      promptParts.push(`- Length profile: VERY SHORT`);
      promptParts.push(`- Minimal words`);
      promptParts.push(`- Strong verbs`);
      promptParts.push(`- No explanation`);
      promptParts.push(`- No supporting paragraphs`);
    }
  } else if (input.intentId === 'seo_snippet') {
    if (language === 'es') {
      promptParts.push(`\nReglas específicas para Fragmento SEO:`);
      promptParts.push(`- Perfil de longitud: CORTO`);
      promptParts.push(`- Redacción concisa`);
      promptParts.push(`- Claridad frontal`);
      promptParts.push(`- Evita oraciones largas`);
      promptParts.push(`- Adecuado para contextos de vista previa de búsqueda`);
      promptParts.push(`- Sin expansión excesiva`);
    } else {
      promptParts.push(`\nSpecific Rules for SEO Snippet:`);
      promptParts.push(`- Length profile: SHORT`);
      promptParts.push(`- Concise phrasing`);
      promptParts.push(`- Front-loaded clarity`);
      promptParts.push(`- Avoid long sentences`);
      promptParts.push(`- Suitable for search preview contexts`);
      promptParts.push(`- No over-expansion`);
    }
  } else if (input.intentId === 'email_intro') {
    if (language === 'es') {
      promptParts.push(`\nReglas específicas para Apertura de Email:`);
      promptParts.push(`- Perfil de longitud: CORTO A MODERADO`);
      promptParts.push(`- Apertura conversacional`);
      promptParts.push(`- Un párrafo corto`);
      promptParts.push(`- Sin preparación larga`);
      promptParts.push(`- Invita a leer sin sobrecargar`);
    } else {
      promptParts.push(`\nSpecific Rules for Email Opening:`);
      promptParts.push(`- Length profile: SHORT TO MODERATE`);
      promptParts.push(`- Conversational opening`);
      promptParts.push(`- One short paragraph`);
      promptParts.push(`- No long setup`);
      promptParts.push(`- Invite reading without overloading`);
    }
  } else if (input.intentId === 'instagram_caption') {
    if (language === 'es') {
      promptParts.push(`\nReglas específicas para Caption de Instagram:`);
      promptParts.push(`- Perfil de longitud: CORTO`);
      promptParts.push(`- Nítido, atractivo`);
      promptParts.push(`- Evita bloques largos`);
      promptParts.push(`- Permite saltos de línea, pero mantén la longitud general limitada`);
    } else {
      promptParts.push(`\nSpecific Rules for Instagram Caption:`);
      promptParts.push(`- Length profile: SHORT`);
      promptParts.push(`- Crisp, engaging`);
      promptParts.push(`- Avoid long blocks`);
      promptParts.push(`- Allow line breaks, but keep overall length restrained`);
    }
  } else if (input.intentId === 'ad_short') {
    if (language === 'es') {
      promptParts.push(`\nReglas específicas para Anuncio Corto:`);
      promptParts.push(`- Perfil de longitud: MUY COMPACTO`);
      promptParts.push(`- Contundente`);
      promptParts.push(`- Palabras mínimas`);
      promptParts.push(`- Alta señal, bajo ruido`);
    } else {
      promptParts.push(`\nSpecific Rules for Short Ad Copy:`);
      promptParts.push(`- Length profile: VERY COMPACT`);
      promptParts.push(`- Punchy`);
      promptParts.push(`- Minimal words`);
      promptParts.push(`- High signal, low noise`);
    }
  } else if (input.intentId === 'value_prop') {
    if (language === 'es') {
      promptParts.push(`\nReglas específicas para Propuesta de Valor:`);
      promptParts.push(`- Perfil de longitud: COMPACTO`);
      promptParts.push(`- Claro y destilado`);
      promptParts.push(`- Una idea enfocada`);
      promptParts.push(`- Sin elaboración más allá del valor central`);
    } else {
      promptParts.push(`\nSpecific Rules for Value Proposition:`);
      promptParts.push(`- Length profile: COMPACT`);
      promptParts.push(`- Clear and distilled`);
      promptParts.push(`- One focused idea`);
      promptParts.push(`- No elaboration beyond core value`);
    }
  } else if (input.intentId === 'problem_pain') {
    if (language === 'es') {
      promptParts.push(`\nReglas específicas para Declaración de Problema/Dolor:`);
      promptParts.push(`- Perfil de longitud: AGUDO`);
      promptParts.push(`- Directo`);
      promptParts.push(`- Enfocado`);
      promptParts.push(`- Sin lenguaje de solución`);
      promptParts.push(`- Sin explicación extendida`);
      promptParts.push(`- Haz el dolor claro rápidamente`);
      promptParts.push(`- Aumenta claridad y precisión`);
      promptParts.push(`- Haz el dolor explícito pero no exagerado`);
      promptParts.push(`- Mantén lenguaje fundamentado y relatable`);
      promptParts.push(`- SIN enmarque de solución`);
      promptParts.push(`- SIN llamada a la acción`);
      promptParts.push(`- SIN lenguaje de propuesta de valor`);
    } else {
      promptParts.push(`\nSpecific Rules for Problem / Pain Statement:`);
      promptParts.push(`- Length profile: SHARP`);
      promptParts.push(`- Direct`);
      promptParts.push(`- Focused`);
      promptParts.push(`- No solution language`);
      promptParts.push(`- No extended explanation`);
      promptParts.push(`- Make the pain clear quickly`);
      promptParts.push(`- Increase clarity and sharpness`);
      promptParts.push(`- Make the pain explicit but not exaggerated`);
      promptParts.push(`- Keep language grounded and relatable`);
      promptParts.push(`- No solution framing`);
      promptParts.push(`- No CTA`);
      promptParts.push(`- No value proposition language`);
    }
  }

  // Special Instructions Guardrails
  if (input.specialInstructions) {
    if (language === 'es') {
      promptParts.push(`\nREGLAS DE GUARDARRAÍL PARA INSTRUCCIONES ESPECIALES:`);
      promptParts.push(`1) El Intent es SIEMPRE primario. Si las Instrucciones Especiales entran en conflicto con el intent seleccionado, IGNORA las partes conflictivas.`);
      promptParts.push(`2) Las Instrucciones Especiales pueden SOLO restringir el pulido, NO cambiar la tarea.`);
      promptParts.push(`   Permitido: conteo de palabras, legibilidad, refinamiento de tono, palabras a evitar, restricciones de formato, mantener frases específicas.`);
      promptParts.push(`   NO permitido: cambiar tipo de contenido, cambiar intent, agregar nuevas secciones, inventar ofertas/características, cambiar canal, agregar CTAs a menos que el intent ya admita CTA.`);
      promptParts.push(`3) Si las Instrucciones Especiales solicitan expansión (ej., 40 palabras → 80 palabras), la expansión está permitida SOLO al aclarar/elaborar lo que ya está presente.`);
      promptParts.push(`   NO introduzcas nuevas afirmaciones, características o beneficios.`);
      promptParts.push(`4) Si las Instrucciones Especiales solicitan afirmaciones más fuertes (ej., "hazlo sonar como el mejor del mercado"), NO cumplas a menos que el input original ya contenga afirmaciones comparables. Incluso entonces, no escales más allá de la fuerza original.`);
      promptParts.push(`5) REGLA DE CONFIANZA GLOBAL siempre prevalece: Si las Instrucciones Especiales solicitan agregar CTAs, promesas o garantías que violan la política del intent, IGNORA esas solicitudes.`);
      promptParts.push(`6) REGLA DE IDIOMA siempre prevalece: Si las Instrucciones Especiales solicitan "escribir en inglés" (o cualquier otro idioma) pero el usuario NO solicitó explícitamente traducción, IGNORA esa solicitud y escribe en el idioma del input. Solo permite traducción si el usuario explícitamente solicita "traducir a [idioma]".`);
    } else {
      promptParts.push(`\nGUARDRAIL RULES FOR SPECIAL INSTRUCTIONS:`);
      promptParts.push(`1) Intent is ALWAYS primary. If Special Instructions conflicts with the selected intent, IGNORE the conflicting parts.`);
      promptParts.push(`2) Special Instructions may ONLY constrain polishing, NOT change the task.`);
      promptParts.push(`   Allowed: word count, readability, tone refinement, words to avoid, formatting constraints, keep specific phrases.`);
      promptParts.push(`   Not allowed: changing content type, changing intent, adding new sections, inventing offers/features, switching channel, adding CTAs unless the selected intent already supports CTA.`);
      promptParts.push(`3) If Special Instructions requests expansion (e.g., 40 words → 80 words), expansion is allowed ONLY by clarifying/elaborating what is already present.`);
      promptParts.push(`   Do NOT introduce new claims, features, or benefits.`);
      promptParts.push(`4) If Special Instructions requests stronger claims (e.g., "make it sound like the best in the market"), do NOT comply unless the original input already contains comparable claims. Even then, do not escalate beyond the original strength.`);
      promptParts.push(`5) GLOBAL TRUST RULE always prevails: If Special Instructions requests adding CTAs, promises, or guarantees that violate the intent policy, IGNORE those requests.`);
      promptParts.push(`6) LANGUAGE RULE always prevails: If Special Instructions requests "write in English" (or any other language) but the user did NOT explicitly request translation, IGNORE that request and write in the input language. Only allow translation if the user explicitly requests "translate to [language]".`);
    }
  }

  if (input.variantsCount > 1) {
    if (language === 'es') {
      promptParts.push(`\nGenera ${input.variantsCount} variantes distintas. Cada variante debe tener el mismo significado pero diferente redacción.`);
    } else {
      promptParts.push(`\nGenerate ${input.variantsCount} distinct variants. Each variant should have the same meaning but different wording.`);
    }
  }

  if (language === 'es') {
    promptParts.push(`\nTexto de entrada:`);
  } else {
    promptParts.push(`\nInput Text:`);
  }

  promptParts.push(`\n${input.inputText}`);

  if (language === 'es') {
    promptParts.push(`\nResponde SOLO con JSON válido en este formato exacto:`);
  } else {
    promptParts.push(`\nRespond ONLY with valid JSON in this exact format:`);
  }

  // Generate example variants array based on requested count
  const exampleVariants = Array.from(
    { length: input.variantsCount },
    (_, i) => `polished text variant ${i + 1}`
  );
  const exampleJson = JSON.stringify({ variants: exampleVariants }, null, 2);
  promptParts.push(`\n${exampleJson}`);

  if (language === 'es') {
    promptParts.push(`\nIMPORTANTE: El array "variants" debe contener EXACTAMENTE ${input.variantsCount} ${input.variantsCount === 1 ? 'cadena' : 'cadenas'} de texto plana(s), NO objetos. Cada variante debe ser el texto pulido completo como una sola cadena.`);
    promptParts.push(`\nNo incluyas bloques de código markdown, no agregues comentarios. Solo JSON puro.`);
  } else {
    promptParts.push(`\nIMPORTANT: The "variants" array must contain EXACTLY ${input.variantsCount} plain text string${input.variantsCount > 1 ? 's' : ''}, NOT objects. Each variant should be the complete polished text as a single string.`);
    promptParts.push(`\nNo markdown code blocks, no extra commentary. Just pure JSON.`);
  }

  return promptParts.join('');
}

export async function polishContent(input: QuickPolishInput): Promise<QuickPolishResult & {
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    reasoning_tokens?: number;
    total_tokens?: number;
  };
  modelUsed: string;
}> {
  const language = detectLanguage(input.inputText);
  const prompt = buildPrompt(input, language);

  const model: Model = 'claude-sonnet-4-5';

  try {
    const response = await makeApiRequestWithFallback(
      model,
      [
        {
          role: 'user',
          content: prompt
        }
      ],
      0.7,
      4000
    );

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from AI');
    }

    const cleanedJson = cleanJsonResponse(content);
    const result = JSON.parse(cleanedJson) as QuickPolishResult;

    if (!result.variants || !Array.isArray(result.variants) || result.variants.length === 0) {
      throw new Error('Invalid response format from AI');
    }

    const narrowValidation = validateNarrowServiceResult(
      result,
      input.variantsCount,
      input.specialInstructions
    );

    if (!narrowValidation.valid) {
      const reminder = buildNarrowRepairReminder(
        narrowValidation.errors,
        input.variantsCount,
        input.specialInstructions
      );

      try {
        const retryResponse = await makeApiRequestWithFallback(
          model,
          [
            { role: 'user', content: prompt },
            { role: 'assistant', content: content },
            { role: 'user', content: reminder }
          ],
          0.5,
          4000
        );

        const retryContent = retryResponse.choices[0]?.message?.content;
        if (retryContent) {
          const retryJson = cleanJsonResponse(retryContent);
          const retryResult = JSON.parse(retryJson) as QuickPolishResult;
          if (retryResult.variants && Array.isArray(retryResult.variants) && retryResult.variants.length > 0) {
            return {
              ...retryResult,
              usage: retryResponse.usage,
              modelUsed: retryResponse.model_used
            };
          }
        }
      } catch {
        // Retry failed — fall through and return original result
      }
    }

    return {
      ...result,
      usage: response.usage,
      modelUsed: response.model_used
    };
  } catch (error) {
    console.error('Quick Polish error:', error);
    throw error;
  }
}
