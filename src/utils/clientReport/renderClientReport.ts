import { ClientReportData, ClientReportVersion, CTA_CONTACT_URL, esCount } from './buildClientReportData';
import { buildReportStyles, getGoogleFontLinkTag, DEFAULT_THEME_VARS } from '../exportReportTheme';
import { getCachedReportTheme } from '../../services/supabaseClient';

// Ensure a URL is absolute for use in href. The visible text keeps the protocol
// stripped ("sharpen.studio"); the href must be absolute or the browser treats
// it as a relative path and the link goes nowhere.
function absoluteHref(url: string): string {
  const u = (url || '').trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

// Render a delta with its own sign. deltaPoints is no longer clamped at 0, so a
// proposal scoring below the baseline must read "-8 pts", not "+-8 pts" (the old
// hardcoded "+" prefix) and not "+0 pts" (the old clamp).
function signed(n: number | null | undefined): string {
  if (n === null || n === undefined) return '';
  return n > 0 ? `+${n}` : String(n);
}

// Escape ONCE, at render time only (spec 7). Values stored in the data model are raw.
function escapeOnce(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Spanish lowercase number words for the ranking-note count ("tres mejores").
// Kept here rather than in the data builder so the note's wording stays
// colocated with the note itself.
const SPANISH_NUM_WORDS: Record<number, string> = {
  0: 'cero', 1: 'una', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco',
  6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'diez',
};
function spanishNumWord(n: number): string {
  return SPANISH_NUM_WORDS[n] ?? String(n);
}

// For *Html fields: escape once, then re-enable ONLY <strong>, <b>, <q>, <em>.
// Everything else is stripped. Called exactly once per value.
function sanitizeInlineHtml(html: string | null | undefined): string {
  const escaped = escapeOnce(html);
  return escaped.replace(
    /&lt;(\/?)(strong|b|q|em)&gt;/gi,
    (_m, slash, tag) => `<${slash}${tag.toLowerCase()}>`,
  );
}

function renderBreadcrumbNav(data: ClientReportData): string {
  const items: { href: string; label: string }[] = [
    { href: '#entrada', label: 'Inputs' },
  ];
  data.versions
    .filter(v => v.isBaseline || v.isShownInFull)
    .forEach(v => items.push({ href: `#${v.key}`, label: v.displayName || v.key }));
  items.push({ href: '#ranking', label: 'Rankings' });

  const links = items
    .map((item, i) => `${i > 0 ? '<span class="bc-sep">/</span>\n' : ''}<a href="${item.href}">${escapeOnce(item.label)}</a>`)
    .join('\n');

  return `<nav class="breadcrumb-nav no-print">
<span class="bc-label">Jump to:</span>
${links}
</nav>`;
}

function renderCover(data: ClientReportData): string {
  const siteLine = data.company.hasUrl
    ? `    <a class="site" href="${escapeOnce(absoluteHref(data.company.url))}" target="_blank" rel="noopener noreferrer">${escapeOnce(data.company.url)}</a>`
    : '';
  // Cover stamp reports the true count of generated copy versions in the
  // session, not the number that happen to have comparison rows (issue #2).
  const stampCount = data.generatedProposalCount || data.journey.versionCount;
  return `<div class="cover">
  <div class="wrap">
    <div class="brandbar">
      <div class="logo">${data.studio.nameWithAccentDot}</div>
      <div class="powered">Análisis realizado con CopyZap · Software propio de Sharpen.Studio</div>
    </div>
    <div class="kicker">Diagnóstico de copy · Sitio web</div>
    <h1>El copy de ${escapeOnce(data.company.name)} puede rendir un ${escapeOnce(data.journey.winnerDeltaPercent)}&nbsp;% más.</h1>
${siteLine}
    <div class="stamp">Análisis del ${escapeOnce(data.company.analyzedAtLabel)} · ${escapeOnce(stampCount)} propuestas evaluadas · Idioma: ${escapeOnce(data.company.language)}</div>

    <div class="journey">
      <div class="journey-head">Recorrido de puntuación</div>
      <div class="stops">
        <div class="stop"><div class="num tnum">${escapeOnce(data.journey.baseline)}<small>/100</small></div>
          <div class="lbl"><b>Tu copy actual</b>línea base</div></div>
        <div class="stop now"><div class="num tnum">${escapeOnce(data.journey.winner)}<small>/100</small></div>
          <div class="lbl"><b>Mejor propuesta</b>reescritura completa</div></div>
        <div class="stop goal"><div class="num tnum">${escapeOnce(data.journey.potential)}<small>/100</small></div>
          <div class="lbl"><b>Potencial</b>con todas las mejoras</div></div>
      </div>
      <div class="rail"><i class="a"></i><i class="b"></i><i class="c"></i></div>
      <div class="journey-foot">
        Reescribimos tu copy actual en <b>${escapeOnce(data.journey.proposalCount)} propuestas completas</b> y las evaluamos
        con el mismo criterio. La mejor sube <b>${escapeOnce(data.journey.winnerDeltaPoints)} puntos
        (+${escapeOnce(data.journey.winnerDeltaPercent)}&nbsp;%)</b> sobre tu texto actual.${data.roadmapCount === 0 ? '' : ` Aplicando además ${escapeOnce(esCount(
          data.roadmapCount,
          'la mejora detallada',
          `las ${data.roadmapCountWord} mejoras detalladas`,
        ))} al final de este reporte, la proyección llega a
        <b>${escapeOnce(data.journey.potential)}/100</b>.`}
      </div>
    </div>
  </div>
</div>`;
}

function renderSummary(data: ClientReportData): string {
  if (!data.executiveSummary.length) return '';
  const paras = data.executiveSummary.map(p => `    <p>${sanitizeInlineHtml(p)}</p>`).join('\n');
  return `<section class="summary">
  <div class="wrap">
    <div class="eyebrow">Resumen ejecutivo</div>
    <h2>Qué encontramos</h2>
${paras}
  </div>
</section>`;
}

function renderFindings(data: ClientReportData): string {
  if (!data.findings.length) return '';
  const items = data.findings.map(f => `      <div class="finding">
        <span class="tag">${escapeOnce(f.category)}</span>
        <h4>${escapeOnce(f.title)}</h4>${f.bodyHtml.trim() ? `
        <p>${sanitizeInlineHtml(f.bodyHtml)}</p>` : ''}
      </div>`).join('\n');
  return `<section>
  <div class="wrap">
    <div class="eyebrow accent">Hallazgos prioritarios</div>
    <h2>${escapeOnce(esCount(
      data.findingsCount,
      'Un punto que cuesta conversión hoy',
      `${data.findingsCountWord} puntos que cuestan conversión hoy`,
    ))}</h2>
    <p class="lede">Detectados automáticamente sobre el texto publicado en tu sitio, ordenados por impacto estimado.</p>
    <div class="findings">
${items}
    </div>
  </div>
</section>`;
}

function renderToc(data: ClientReportData): string {
  const rows: string[] = [];
  rows.push(`      <a href="#entrada"><span class="idx">1</span>
        <span class="name">Resumen de entrada <em>— qué leímos de tu sitio</em></span>
        <span class="delta"></span><span class="sc"></span></a>`);
  // Table of contents lists only the proposals developed in full (issue #1):
  // winner + next highest-scoring up to MAX_PROPOSALS_SHOWN, plus the baseline.
  const tocVersions = data.versions.filter(v => v.isBaseline || v.isShownInFull);
  tocVersions.forEach((v, i) => {
    const cls = v.isBaseline ? 'base' : (v.isWinner ? 'is-win' : '');
    const winTag = v.isWinner ? `<span class="win">★ Ganadora</span>` : '';
    const delta = v.isBaseline
      ? `<span class="delta tnum">línea base</span>`
      : `<span class="delta tnum">${escapeOnce(signed(v.deltaPoints))} pts
          <small>${escapeOnce(signed(v.deltaPercent))} % vs. actual</small></span>`;
    rows.push(`      <a href="#${escapeOnce(v.key)}" class="${cls}">
        <span class="idx">${escapeOnce(i + 2)}</span>
        <span class="name">${escapeOnce(v.displayName)}${winTag}</span>
        ${delta}<span class="sc tnum">${escapeOnce(v.score)}<small>/100</small></span></a>`);
  });
  // Ranking index is derived from the entries actually shown in the table of
  // contents (entrada + shown versions), not from the total version count —
  // otherwise the index jumps when some proposals are not developed in full.
  const rankingIdx = tocVersions.length + 2;
  rows.push(`      <a href="#ranking"><span class="idx">${escapeOnce(rankingIdx)}</span>
        <span class="name">Comparación y clasificación <em>— tabla completa</em></span>
        <span class="delta"></span><span class="sc"></span></a>`);
  return `<section>
  <div class="wrap">
    <div class="eyebrow">Contenido del reporte</div>
    <h2>Versiones evaluadas</h2>
    <p class="lede">Cada versión se puntúa sobre los mismos seis criterios. La diferencia frente a tu copy
       actual se expresa en puntos y en porcentaje.</p>
    <nav class="toc">
${rows.join('\n')}
    </nav>
  </div>
</section>`;
}

function renderHeadToHead(data: ClientReportData): string {
  const originalNote = data.headToHead.originalNote
    ? `        <p class="vs-note">${sanitizeInlineHtml(data.headToHead.originalNote)}</p>`
    : '';
  const winnerNote = data.headToHead.winnerNote
    ? `        <p class="vs-note">${sanitizeInlineHtml(data.headToHead.winnerNote)}</p>`
    : '';
  return `<section>
  <div class="wrap">
    <div class="eyebrow">Cara a cara</div>
    <h2>Tu titular actual frente al propuesto</h2>
    <p class="lede">El encabezado es el 80&nbsp;% de la decisión de quedarse o irse. Esta es la comparación directa.</p>
    <div class="versus">
      <div class="vs-col">
        <div class="vs-head"><span class="who">Actual</span>
          <span class="sc tnum">${escapeOnce(data.journey.baseline)}<small>/100</small></span></div>
        <blockquote>${escapeOnce(data.headToHead.originalHeadline)}</blockquote>
        <p class="sub">${escapeOnce(data.headToHead.originalSub)}</p>
${originalNote}
      </div>
      <div class="vs-col win">
        <div class="vs-head"><span class="who">${escapeOnce(data.winnerDisplayName)} · ganadora</span>
          <span class="sc tnum">${escapeOnce(data.journey.winner)}<small>/100</small></span></div>
        <blockquote>${escapeOnce(data.headToHead.winnerHeadline)}</blockquote>
        <p class="sub">${escapeOnce(data.headToHead.winnerSub)}</p>
${winnerNote}
      </div>
    </div>
  </div>
</section>`;
}

function renderBrief(data: ClientReportData): string {
  const rows: [string, string][] = [];
  // The scanned URL is the first row of "Qué leímos de tu sitio" (spec change #4):
  // the section is titled "what we read from your site" but never stated which page.
  if (data.company.hasUrl) {
    rows.push(['URL analizada', data.company.url]);
  }
  rows.push(
    ['Público objetivo', data.brief.audience],
    ['Mensaje clave', data.brief.keyMessage],
    ['Llamada a la acción', data.brief.cta],
    ['Emoción buscada', data.brief.emotion],
    ['Valores de marca', data.brief.brandValues],
    ['Tono · extensión · idioma', data.brief.toneLine],
  );
  if (data.brief.keywords.length) rows.push(['Palabras clave', data.brief.keywords.join(', ')]);
  const rowsHtml = rows
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `      <div class="brief-row"><div class="k">${escapeOnce(k)}</div><div class="v">${escapeOnce(v)}</div></div>`)
    .join('\n');
  // Omit the excluded-sections sentence entirely when nothing was dropped (spec 4.7).
  const excludedLine = data.brief.excludedSectionsList
    ? `    <p class="methodo">Secciones excluidas del análisis: ${escapeOnce(data.brief.excludedSectionsList)}.</p>`
    : '';
  return `<section id="entrada">
  <div class="wrap">
    <div class="eyebrow">1 · Resumen de entrada</div>
    <h2>Qué leímos de tu sitio</h2>
    <p class="lede">Extraído automáticamente del contenido publicado. Todo el análisis posterior parte de
       aquí, así que vale la pena revisar que te represente.</p>
    <div class="brief-tbl">
${rowsHtml}
    </div>
${excludedLine}
  </div>
</section>`;
}

function renderSplitBlock(v: ClientReportVersion): string {
  // When both columns are empty, render one full-width sentence instead of
  // two side-by-side "Sin observaciones destacadas." lines (item: duplicate
  // empty note). When only one column is empty, keep the per-column note so
  // the layout stays balanced.
  const bothEmpty = v.strengths.length === 0 && v.improvements.length === 0;
  if (bothEmpty) {
    return `      <div class="split split-empty">
        <p class="empty-full">Sin observaciones destacadas.</p>
      </div>`;
  }
  const posItems = v.strengths.length
    ? v.strengths.map(s => `<li>${escapeOnce(s)}</li>`).join('')
    : '<li class="empty">Sin observaciones destacadas.</li>';
  const negItems = v.improvements.length
    ? v.improvements.map(s => `<li>${escapeOnce(s)}</li>`).join('')
    : '<li class="empty">Sin observaciones destacadas.</li>';
  return `      <div class="split">
        <div class="pos"><h5>${escapeOnce(v.strengthsHeading)}</h5>
          <ul>${posItems}</ul></div>
        <div class="neg"><h5>${escapeOnce(v.improvementsHeading)}</h5>
          <ul>${negItems}</ul></div>
      </div>`;
}

function renderVersion(v: ClientReportVersion, data: ClientReportData): string {
  // Drop sections whose body text is empty entirely (item: empty sections
  // rendered a label plus a blank <p></p>). The label alone adds nothing for
  // the reader and the empty paragraph is visible whitespace.
  const sectionsHtml = v.sections
    .filter(s => s.text && s.text.trim().length > 0)
    .map(s => {
      const cls = [s.isHero ? 'hero' : '', s.isFaded ? 'fade' : ''].filter(Boolean).join(' ');
      // Omit sec-lbl entirely when no real label exists (item 7).
      const lbl = s.label
        ? `          <div class="sec-lbl">${escapeOnce(s.label)}</div>\n`
        : '';
      return `        <div class="sec${cls ? ' ' + cls : ''}">
${lbl}          <p>${escapeOnce(s.text)}</p>
        </div>`;
    }).join('\n');

  const winTag = v.isWinner ? ` <span class="win">★ Ganadora</span>` : '';
  const gainBlock = v.isBaseline
    ? `<div class="gain tnum">línea base<small>punto de partida</small></div>`
    : `<div class="gain tnum">${escapeOnce(signed(v.deltaPoints))} pts<small>${escapeOnce(signed(v.deltaPercent))} % vs. actual</small></div>`;
  const paywall = v.isBaseline ? '' : `      <div class="paywall">
        <div class="pw-t"><b>Estás viendo el ${escapeOnce(v.keptPercent)}&nbsp;% de esta propuesta.</b>
          ${escapeOnce(v.paywallLine)}</div>
        <a class="btn${v.isWinner ? ' accent' : ''}" href="${escapeOnce(CTA_CONTACT_URL)}" target="_blank" rel="noopener noreferrer">Solicitar versión completa</a>
      </div>`;

  const split = renderSplitBlock(v);
  const eyebrowCls = v.isWinner ? ' accent' : '';

  return `<section id="${escapeOnce(v.key)}">
  <div class="wrap">
    <div class="eyebrow${eyebrowCls}">${escapeOnce(v.sectionNumber)} · ${escapeOnce(v.sectionKicker)}</div>
    <h2>${escapeOnce(v.displayName)}</h2>
    <div class="version">
      <div class="v-head">
        <div class="t">
          <h3>${escapeOnce(v.shortName)}${winTag}</h3>
          <div class="role">${escapeOnce(v.roleLine)}</div>
        </div>
        <div class="v-scores">
          ${gainBlock}
          <div class="big tnum">${escapeOnce(v.score)}<small>/100</small></div>
        </div>
      </div>
      <div class="v-body">
${sectionsHtml}
      </div>
${paywall}
${split}
    </div>
  </div>
</section>`;
}

function renderRanking(data: ClientReportData): string {
  const rows = data.versionsByScore.map((v, i) => {
    const cls = [v.isWinner ? 'is-win' : '', v.isBaseline ? 'base' : ''].filter(Boolean).join(' ');
    const dl = v.isBaseline
      ? `<div class="dl tnum">línea base</div>`
      : `<div class="dl tnum">${escapeOnce(signed(v.deltaPoints))} pts
          <small>${escapeOnce(signed(v.deltaPercent))} %</small></div>`;
    return `      <div class="rank-row${cls ? ' ' + cls : ''}">
        <div class="pos tnum">${escapeOnce(i + 1)}</div>
        <div class="nm">${escapeOnce(v.displayName)}<small>${escapeOnce(v.rankSubline)}</small></div>
        <div class="cell tnum">${escapeOnce(v.editorialQuality)}<small>de 100</small></div>
        <div class="cell tnum">${escapeOnce(v.conversionPotential)}<small>de 100</small></div>
        ${dl}
        <div class="tot tnum">${escapeOnce(v.score)}<small>/100</small></div>
      </div>`;
  }).join('\n');

  // When some proposals were not developed in full (issue #1) or were
  // excluded from the table for lack of a score (issue #2), say so in one
  // line rather than silently omitting them.
  const shownProposals = data.versions.filter(v => !v.isBaseline && v.isShownInFull).length;
  const totalEvaluated = data.generatedProposalCount || data.journey.versionCount - 1;
  const notes: string[] = [];
  // The explanatory note appears whenever some evaluated proposals are not
  // developed as full sections (the cap), so a reader is never left wondering
  // why the ranking table lists proposals that exist nowhere else in the doc.
  if (shownProposals < totalEvaluated) {
    notes.push(`Se evaluaron ${escapeOnce(totalEvaluated)} propuestas en total; este reporte desarrolla las ${escapeOnce(spanishNumWord(shownProposals))} mejores.`);
  }
  if (data.unscoredProposalCount > 0) {
    notes.push(`${escapeOnce(data.unscoredProposalCount)} ${data.unscoredProposalCount === 1 ? 'versión adicional quedó sin evaluar comparativamente y no se incluye' : 'versiones adicionales quedaron sin evaluar comparativamente y no se incluyen'} en este reporte.`);
  }
  const noteHtml = notes.length
    ? `    <p class="methodo">${notes.join(' ')}</p>`
    : '';

  return `<section id="ranking">
  <div class="wrap">
    <div class="eyebrow">${escapeOnce(data.versions.filter(v => v.isBaseline || v.isShownInFull).length + 2)} · Comparación</div>
    <h2>Clasificación completa</h2>
    <p class="lede">Las ${escapeOnce(totalEvaluated)} propuestas y tu copy actual, evaluadas con el mismo criterio, ordenadas por
       puntuación total.</p>
    <div class="rank">
      <div class="rank-row head"><div>#</div><div>Versión</div>
        <div class="cell">Calidad editorial</div><div class="cell">Potencial de conversión</div>
        <div class="dl">Mejora</div><div class="tot">Total</div></div>
${rows}
    </div>
${noteHtml}
    <p class="methodo"><b>Cómo se calcula.</b> Cada versión se evalúa sobre seis dimensiones —claridad,
      persuasión, engagement, calidad editorial, potencial de conversión y ajuste al público definido— con el
      mismo criterio y el mismo contexto de marca. Las puntuaciones son comparativas entre las versiones de
      este análisis: lo relevante es el orden y la magnitud de la diferencia, no el número absoluto.</p>
  </div>
</section>`;
}

function renderRoadmap(data: ClientReportData): string {
  if (!data.roadmap.length) return '';
  const items = data.roadmap.map(r => `      <div class="road-item"><div class="pts">+${escapeOnce(r.points)}</div>
        <div class="txt">${sanitizeInlineHtml(r.titleHtml)} ${sanitizeInlineHtml(r.bodyHtml)}</div></div>`).join('\n');
  return `<section>
  <div class="wrap">
    <div class="eyebrow accent">Hoja de ruta</div>
    <h2>${escapeOnce(esCount(
      data.roadmapCount,
      'La mejora que lleva',
      `Las ${data.roadmapCountWord} mejoras que llevan`,
    ))} la propuesta ganadora a ${escapeOnce(data.journey.potential)}</h2>
    <p class="lede">Cada una con su impacto estimado sobre la puntuación de ${escapeOnce(data.winnerDisplayName)}.</p>
    <div class="road">
${items}
      <div class="road-total">
        <div class="lb">Aplicando ${escapeOnce(esCount(
          data.roadmapCount,
          'la mejora',
          `las ${data.roadmapCountWord} mejoras`,
        ))} sobre la propuesta ganadora,
          <b>proyección estimada</b></div>
        <div class="vv tnum">${escapeOnce(data.journey.potential)}<small>/100</small></div>
      </div>
    </div>
    <div class="cta-mini">
      <div class="t"><b>${escapeOnce(esCount(
        data.roadmapCount,
        'Esta mejora ya está redactada.',
        `Estas ${data.roadmapCountWord} mejoras ya están redactadas.`,
      ))}</b> ${escapeOnce(esCount(data.roadmapCount, 'Forma', 'Forman'))} parte de la
        versión completa del copy, lista para pasar a tu sitio sin trabajo adicional de escritura.</div>
      <a class="btn accent" href="${escapeOnce(CTA_CONTACT_URL)}" target="_blank" rel="noopener noreferrer">Ver la versión completa</a>
    </div>
  </div>
</section>`;
}

function renderCta(data: ClientReportData): string {
  return `<section id="contacto">
  <div class="wrap">
    <div class="cta">
      <div class="eyebrow accent" style="margin-bottom:16px">Siguiente paso</div>
      <h2>¿Lo dejamos listo para publicar?</h2>
      <p>Este reporte es gratuito y tuyo, lo uses con nosotros o no. Si quieres las
         ${escapeOnce(data.journey.proposalCount)} propuestas completas —${data.roadmapCount === 0 ? '' : `con ${escapeOnce(esCount(
           data.roadmapCount,
           'la mejora ya aplicada',
           `las ${data.roadmapCountWord} mejoras ya aplicadas`,
         ))},
         `}adaptadas a tu voz de marca y entregadas sección por sección para pasar directo a tu sitio— lo
         resolvemos en una semana.</p>
      <div class="acts">
        <a class="btn accent" href="${escapeOnce(CTA_CONTACT_URL)}" target="_blank" rel="noopener noreferrer">Solicitar el copy completo</a>
      </div>
    </div>
  </div>
</section>`;
}

function renderFooter(data: ClientReportData): string {
  // When the URL is unavailable, rewrite the disclaimer so it reads correctly
  // without an empty hole (spec 4.2 / pitfall 5).
  const disclaimer = data.company.hasUrl
    ? `Este análisis refleja el contenido publicado en ${escapeOnce(data.company.url)} el ${escapeOnce(data.company.analyzedAtLabel)}; cambios posteriores en el sitio no están recogidos. Las propuestas de copy son generadas con asistencia de inteligencia artificial y deben revisarse antes de publicar: toda cifra, certificación o afirmación de resultados debe verificarse contra tus fuentes internas.`
    : `Este análisis refleja el contenido publicado en tu sitio el ${escapeOnce(data.company.analyzedAtLabel)}; cambios posteriores no están recogidos. Las propuestas de copy son generadas con asistencia de inteligencia artificial y deben revisarse antes de publicar: toda cifra, certificación o afirmación de resultados debe verificarse contra tus fuentes internas.`;
  return `<footer>
  <div class="wrap">
    <div class="fl">
      <strong>${escapeOnce(data.studio.name)}</strong> — branding, identidad gráfica y desarrollo web.<br>
      Análisis realizado con <strong>CopyZap</strong>, la herramienta de análisis y reescritura de copy que desarrollamos en Sharpen.Studio · ${escapeOnce(data.company.analyzedAtTimeLabel)}
      <div class="disclaimer">
        ${disclaimer}
      </div>
    </div>
  </div>
</footer>`;
}

export function renderClientReport(data: ClientReportData): string {
  // Render full version sections only for the shown set (issue #1): winner
  // plus next highest-scoring proposals up to MAX_PROPOSALS_SHOWN, plus the
  // baseline always. Unscored proposals beyond the cap are not developed in
  // full; they appear only as compact rows in the ranking table.
  const shownVersions = data.versions.filter(v => v.isBaseline || v.isShownInFull);
  const versionsHtml = shownVersions.map(v => renderVersion(v, data)).join('\n');
  const resolvedTheme = getCachedReportTheme() ?? undefined;
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reporte de Copy — ${escapeOnce(data.company.name)} | ${escapeOnce(data.studio.name)}</title>
${getGoogleFontLinkTag(resolvedTheme?.serif ?? DEFAULT_THEME_VARS.serif, resolvedTheme?.sans ?? DEFAULT_THEME_VARS.sans)}
<style>
${buildReportStyles(resolvedTheme)}
</style>
</head>
<body>

${renderCover(data)}

${renderSummary(data)}

${renderFindings(data)}

${renderToc(data)}

${renderHeadToHead(data)}

${renderBrief(data)}

${versionsHtml}

${renderRanking(data)}

${renderRoadmap(data)}

${renderCta(data)}

${renderFooter(data)}

${renderBreadcrumbNav(data)}
</body>
</html>`;
}
