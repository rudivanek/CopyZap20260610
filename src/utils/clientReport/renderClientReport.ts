import { ClientReportData, ClientReportVersion, CTA_CONTACT_URL } from './buildClientReportData';

// Ensure a URL is absolute for use in href. The visible text keeps the protocol
// stripped ("sharpen.studio"); the href must be absolute or the browser treats
// it as a relative path and the link goes nowhere.
function absoluteHref(url: string): string {
  const u = (url || '').trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
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

// For *Html fields: escape once, then re-enable ONLY <strong>, <b>, <q>, <em>.
// Everything else is stripped. Called exactly once per value.
function sanitizeInlineHtml(html: string | null | undefined): string {
  const escaped = escapeOnce(html);
  return escaped.replace(
    /&lt;(\/?)(strong|b|q|em)&gt;/gi,
    (_m, slash, tag) => `<${slash}${tag.toLowerCase()}>`,
  );
}

const CSS = `:root{
  --ink:#12151C; --ink-soft:#3A414F; --muted:#6B7386; --line:#E2DED6; --line-soft:#EDEAE3;
  --paper:#F7F5F1; --white:#FFFFFF; --accent:#D7452C; --accent-soft:#FBE9E5;
  --gain:#1C7A5B; --gain-soft:#E4F1EC; --warn:#A8720E; --warn-soft:#FBF0DA;
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,"Helvetica Neue",Arial,sans-serif;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.65;-webkit-font-smoothing:antialiased}
.wrap{max-width:940px;margin:0 auto;padding:0 28px}
section{padding:64px 0;border-top:1px solid var(--line)}
section:first-of-type{border-top:0}
h1,h2,h3,h4{font-family:var(--serif);font-weight:600;letter-spacing:-.015em;margin:0}
h1{font-size:clamp(34px,5.4vw,54px);line-height:1.08}
h2{font-size:clamp(26px,3.6vw,36px);line-height:1.15;margin-bottom:10px}
h3{font-size:22px;line-height:1.25}
p{margin:0 0 16px}
.eyebrow{font-family:var(--sans);font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:0 0 14px}
.eyebrow.accent{color:var(--accent)}
.lede{font-size:19px;line-height:1.6;color:var(--ink-soft);max-width:64ch}
.tnum{font-variant-numeric:tabular-nums}
.cover{background:var(--ink);color:#F2F0EC;padding:56px 0 64px;border:0}
.brandbar{display:flex;justify-content:space-between;align-items:center;gap:20px;padding-bottom:34px;margin-bottom:44px;border-bottom:1px solid rgba(255,255,255,.14);flex-wrap:wrap}
.logo{font-family:var(--serif);font-size:21px;letter-spacing:-.02em;color:#fff}
.logo span{color:var(--accent)}
.powered{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.5)}
.cover h1{color:#fff;max-width:20ch}
.cover .kicker{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:20px}
.cover .site{display:inline-block;font-family:var(--mono);font-size:14px;color:rgba(255,255,255,.82);margin-top:22px;word-break:break-all;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.25);padding-bottom:1px}
.cover .site:hover{color:#fff;border-bottom-color:#fff}
.cover .stamp{font-size:13px;color:rgba(255,255,255,.45);margin-top:6px}
.journey{margin-top:48px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.13);border-radius:4px;padding:34px 30px 30px}
.journey-head{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:26px}
.stops{display:flex;align-items:flex-end;gap:0}
.stop{flex:1;text-align:center;position:relative}
.stop .num{font-family:var(--serif);font-size:clamp(38px,7vw,60px);line-height:1;color:rgba(255,255,255,.42);font-variant-numeric:tabular-nums}
.stop .num small{font-size:.4em;color:rgba(255,255,255,.3);margin-left:2px}
.stop.now .num{color:#fff}
.stop.goal .num{color:var(--accent)}
.stop .lbl{font-size:12px;letter-spacing:.06em;color:rgba(255,255,255,.55);margin-top:10px}
.stop .lbl b{display:block;color:rgba(255,255,255,.85);font-weight:600;letter-spacing:0;font-size:13px}
.rail{height:2px;margin:26px 0 0;background:linear-gradient(90deg,rgba(255,255,255,.22) 0%,rgba(255,255,255,.5) 48%,var(--accent) 100%);position:relative}
.rail i{position:absolute;top:-4px;width:10px;height:10px;border-radius:50%;background:var(--ink);border:2px solid rgba(255,255,255,.55);transform:translateX(-50%)}
.rail i.a{left:16.6%} .rail i.b{left:50%;background:#fff;border-color:#fff} .rail i.c{left:83.3%;background:var(--accent);border-color:var(--accent)}
.journey-foot{margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,.12);font-size:14px;color:rgba(255,255,255,.7);line-height:1.6}
.journey-foot b{color:#fff;font-weight:600}
.summary p{font-size:18px;line-height:1.7;color:var(--ink-soft);max-width:68ch}
.summary p strong{color:var(--ink);font-weight:600}
.findings{display:grid;gap:14px;margin-top:30px}
.finding{background:var(--white);border:1px solid var(--line);border-left:3px solid var(--warn);border-radius:3px;padding:20px 22px}
.finding .tag{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--warn);background:var(--warn-soft);padding:3px 8px;border-radius:2px;margin-bottom:10px}
.finding h4{font-family:var(--sans);font-size:15px;font-weight:650;margin:0 0 6px;line-height:1.4}
.finding p{margin:0;font-size:14.5px;color:var(--muted);line-height:1.6}
.finding q{color:var(--ink-soft);font-style:italic}
.toc{background:var(--white);border:1px solid var(--line);border-radius:4px;overflow:hidden;margin-top:26px}
.toc a{display:flex;align-items:center;gap:16px;padding:16px 22px;border-bottom:1px solid var(--line-soft);text-decoration:none;color:var(--ink)}
.toc a:last-child{border-bottom:0}
.toc a:hover{background:var(--paper)}
.toc .idx{font-family:var(--mono);font-size:12px;color:var(--muted);width:18px;flex:none}
.toc .name{flex:1;font-size:15.5px;font-weight:550;line-height:1.35}
.toc .name em{font-style:normal;color:var(--muted);font-weight:400}
.toc .win{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gain);background:var(--gain-soft);padding:3px 7px;border-radius:2px;margin-left:8px;white-space:nowrap}
.toc .delta{font-size:13px;font-weight:600;color:var(--gain);width:112px;text-align:right;flex:none;font-variant-numeric:tabular-nums}
.toc .delta small{display:block;font-weight:400;color:var(--muted);font-size:11.5px}
.toc .sc{font-family:var(--serif);font-size:21px;width:70px;text-align:right;flex:none;font-variant-numeric:tabular-nums}
.toc .sc small{font-size:.55em;color:var(--muted)}
.toc a.is-win .sc{color:var(--gain)}
.toc a.base .delta{color:var(--muted)}
.versus{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:30px}
.vs-col{background:var(--white);border:1px solid var(--line);border-radius:4px;padding:26px 24px;display:flex;flex-direction:column}
.vs-col.win{border-color:var(--gain);box-shadow:0 1px 0 var(--gain)}
.vs-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft)}
.vs-head .who{font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)}
.vs-col.win .vs-head .who{color:var(--gain)}
.vs-head .sc{font-family:var(--serif);font-size:24px;font-variant-numeric:tabular-nums}
.vs-head .sc small{font-size:.5em;color:var(--muted)}
.vs-col blockquote{margin:0;font-family:var(--serif);font-size:21px;line-height:1.35;letter-spacing:-.01em;color:var(--ink)}
.vs-col .sub{margin:14px 0 0;font-size:14.5px;color:var(--muted);line-height:1.6}
.vs-note{margin-top:auto;padding-top:18px;font-size:13px;color:var(--muted);line-height:1.55}
.brief-tbl{margin-top:26px;background:var(--white);border:1px solid var(--line);border-radius:4px;overflow:hidden}
.brief-row{display:grid;grid-template-columns:200px 1fr;gap:14px;padding:14px 22px;border-bottom:1px solid var(--line-soft)}
.brief-row:last-child{border-bottom:0}
.brief-row .k{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.brief-row .v{font-size:15px;color:var(--ink-soft);line-height:1.55}
.version{background:var(--white);border:1px solid var(--line);border-radius:4px;margin-top:26px;overflow:hidden}
.v-head{padding:24px 28px;border-bottom:1px solid var(--line-soft);display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap}
.v-head .t{flex:1;min-width:220px}
.v-head h3{margin:0 0 4px}
.v-head .role{font-size:13.5px;color:var(--muted)}
.v-scores{display:flex;align-items:baseline;gap:18px;flex:none}
.v-scores .big{font-family:var(--serif);font-size:34px;line-height:1;font-variant-numeric:tabular-nums}
.v-scores .big small{font-size:.42em;color:var(--muted)}
.v-scores .gain{font-size:14px;font-weight:600;color:var(--gain);text-align:right;font-variant-numeric:tabular-nums}
.v-scores .gain small{display:block;font-weight:400;color:var(--muted);font-size:12px}
.v-body{padding:26px 28px 0}
.v-body .sec{margin-bottom:22px}
.v-body .sec-lbl{font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
.v-body .sec p{margin:0;font-size:15.5px;line-height:1.7;color:var(--ink-soft);white-space:pre-wrap}
.v-body .sec.hero p{font-family:var(--serif);font-size:22px;line-height:1.35;color:var(--ink)}
.fade{position:relative}
.fade:after{content:"";position:absolute;left:0;right:0;bottom:0;height:48px;background:linear-gradient(180deg,rgba(255,255,255,0),var(--white));pointer-events:none}
.paywall{margin:0;padding:22px 28px 26px;background:var(--paper);border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap}
.paywall .pw-t{font-size:14.5px;color:var(--ink-soft);line-height:1.5;flex:1;min-width:240px}
.paywall .pw-t b{color:var(--ink);font-weight:650}
.btn{display:inline-block;background:var(--ink);color:#fff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:.01em;padding:13px 24px;border-radius:3px;white-space:nowrap;border:1px solid var(--ink)}
.btn:hover{background:#000}
.btn.ghost{background:transparent;color:var(--ink)}
.btn.accent{background:var(--accent);border-color:var(--accent)}
.btn.accent:hover{background:#C13B24}
.split{display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid var(--line-soft)}
.split>div{padding:24px 28px}
.split>div+div{border-left:1px solid var(--line-soft)}
.split h5{font-family:var(--sans);font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;margin:0 0 14px}
.split .pos h5{color:var(--gain)} .split .neg h5{color:var(--accent)}
.split ul{margin:0;padding:0;list-style:none}
.split li{position:relative;padding-left:22px;margin-bottom:10px;font-size:14.5px;line-height:1.55;color:var(--ink-soft)}
.split li:before{position:absolute;left:0;top:0;font-weight:700}
.split .pos li:before{content:"\\2713";color:var(--gain)}
.split .neg li:before{content:"\\2192";color:var(--accent)}
.split .empty{font-size:13px;color:var(--muted);font-style:italic}
.rank{margin-top:28px;background:var(--white);border:1px solid var(--line);border-radius:4px;overflow:hidden}
.rank-row{display:grid;grid-template-columns:34px 1fr 96px 96px 88px 86px;gap:14px;align-items:center;padding:18px 22px;border-bottom:1px solid var(--line-soft)}
.rank-row:last-child{border-bottom:0}
.rank-row.head{background:var(--paper);padding:12px 22px;font-size:10.5px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:var(--muted)}
.rank-row.head .tot,.rank-row.head .dl{font-family:var(--sans);font-size:10.5px;font-weight:700;letter-spacing:.11em;color:var(--muted);text-align:right}
.rank-row.is-win{background:var(--gain-soft)}
.rank-row .pos{font-family:var(--serif);font-size:20px;color:var(--muted);font-variant-numeric:tabular-nums}
.rank-row.is-win .pos{color:var(--gain)}
.rank-row .nm{font-size:15px;font-weight:550;line-height:1.35}
.rank-row .nm small{display:block;font-weight:400;color:var(--muted);font-size:12.5px;margin-top:2px}
.rank-row .cell{font-size:14.5px;font-variant-numeric:tabular-nums;color:var(--ink-soft)}
.rank-row .cell small{display:block;font-size:11.5px;color:var(--muted)}
.rank-row .tot{font-family:var(--serif);font-size:24px;text-align:right;font-variant-numeric:tabular-nums}
.rank-row.is-win .tot{color:var(--gain)}
.rank-row .tot small{font-size:.5em;color:var(--muted)}
.rank-row .dl{font-size:14px;font-weight:600;color:var(--gain);text-align:right;font-variant-numeric:tabular-nums}
.rank-row .dl small{display:block;font-weight:400;color:var(--muted);font-size:11.5px}
.rank-row.base .dl{color:var(--muted);font-weight:400}
.methodo{margin-top:16px;font-size:13px;color:var(--muted);line-height:1.6;max-width:74ch}
.road{margin-top:28px;background:var(--white);border:1px solid var(--line);border-radius:4px}
.road-item{display:flex;gap:20px;padding:22px 26px;border-bottom:1px solid var(--line-soft)}
.road-item:last-of-type{border-bottom:0}
.road-item .pts{flex:none;width:56px;height:38px;border-radius:3px;background:var(--gain-soft);color:var(--gain);font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums}
.road-item .txt{font-size:15px;line-height:1.62;color:var(--ink-soft)}
.road-item .txt b{color:var(--ink);font-weight:650}
.road-total{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:22px 26px;background:var(--ink);color:#fff}
.road-total .lb{font-size:14.5px;color:rgba(255,255,255,.7)}
.road-total .lb b{color:#fff;font-weight:600}
.road-total .vv{font-family:var(--serif);font-size:34px;line-height:1;font-variant-numeric:tabular-nums}
.road-total .vv small{font-size:.42em;color:rgba(255,255,255,.5)}
.cta{background:var(--ink);color:#fff;border-radius:4px;padding:44px 40px;margin-top:36px}
.cta h2{color:#fff;max-width:22ch}
.cta p{color:rgba(255,255,255,.72);font-size:16.5px;max-width:60ch;margin-top:12px}
.cta .acts{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}
.cta .btn{border-color:transparent}
.cta .btn.ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.35)}
.cta .btn.ghost:hover{background:rgba(255,255,255,.08)}
.cta-mini{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;background:var(--accent-soft);border:1px solid #F2D3CC;border-radius:4px;padding:24px 26px;margin-top:30px}
.cta-mini .t{font-size:16px;line-height:1.55;color:var(--ink);flex:1;min-width:250px}
.cta-mini .t b{font-weight:650}
footer{background:var(--ink);color:rgba(255,255,255,.55);padding:44px 0;font-size:13px;line-height:1.7}
footer .wrap{display:block}
footer .fl{max-width:74ch}
footer strong{color:#fff;font-weight:600}
.disclaimer{margin-top:14px;font-size:12px;color:rgba(255,255,255,.38);line-height:1.6}
@media(max-width:760px){
  section{padding:44px 0}
  .wrap{padding:0 20px}
  .versus{grid-template-columns:1fr}
  .split{grid-template-columns:1fr}
  .split>div+div{border-left:0;border-top:1px solid var(--line-soft)}
  .brief-row{grid-template-columns:1fr;gap:4px}
  .toc .delta{width:auto;min-width:78px}
  .toc .sc{width:56px}
  .toc a{flex-wrap:wrap;gap:10px 14px}
  .rank-row{grid-template-columns:28px 1fr 84px;gap:10px}
  .rank-row .cell{display:none}
  .rank-row.head .cell{display:none}
  .rank-row .dl{grid-column:2;text-align:left}
  .rank-row .tot{grid-column:3;grid-row:1}
  .cta{padding:32px 24px}
  .stops{gap:4px;align-items:flex-start}
  .stop .num{font-size:clamp(28px,9vw,40px)}
  .stop .lbl{font-size:11px}
  .journey{padding:26px 18px 24px}
}
@media print{
  body{background:#fff}
  section{padding:26px 0;page-break-inside:avoid}
  .cover{background:var(--ink) !important}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .btn{display:none}
  .version,.rank,.road,.toc,.vs-col{page-break-inside:avoid}
  a[href]:after{content:""}
}`;

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
    <div class="stamp">Análisis del ${escapeOnce(data.company.analyzedAtLabel)} · ${escapeOnce(stampCount)} versiones evaluadas · Idioma: ${escapeOnce(data.company.language)}</div>

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
        (+${escapeOnce(data.journey.winnerDeltaPercent)}&nbsp;%)</b> sobre tu texto actual. Aplicando además las
        ${escapeOnce(data.roadmapCountWord)} mejoras detalladas al final de este reporte, la proyección llega a
        <b>${escapeOnce(data.journey.potential)}/100</b>.
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
        <h4>${escapeOnce(f.title)}</h4>
        <p>${sanitizeInlineHtml(f.bodyHtml)}</p>
      </div>`).join('\n');
  return `<section>
  <div class="wrap">
    <div class="eyebrow accent">Hallazgos prioritarios</div>
    <h2>${escapeOnce(data.findingsCountWord)} puntos que cuestan conversión hoy</h2>
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
      : `<span class="delta tnum">+${escapeOnce(v.deltaPoints)} pts
          <small>+${escapeOnce(v.deltaPercent)} % vs. actual</small></span>`;
    rows.push(`      <a href="#${escapeOnce(v.key)}" class="${cls}">
        <span class="idx">${escapeOnce(i + 2)}</span>
        <span class="name">${escapeOnce(v.displayName)}${winTag}</span>
        ${delta}<span class="sc tnum">${escapeOnce(v.score)}<small>/100</small></span></a>`);
  });
  rows.push(`      <a href="#ranking"><span class="idx">${escapeOnce(data.lastIndex)}</span>
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
  // Always render the split block so all versions read consistently (issue #5).
  // When a list is empty, state it in one line rather than dropping the block.
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
  const sectionsHtml = v.sections.map(s => {
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
    : `<div class="gain tnum">+${escapeOnce(v.deltaPoints)} pts<small>+${escapeOnce(v.deltaPercent)} % vs. actual</small></div>`;
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
      : `<div class="dl tnum">+${escapeOnce(v.deltaPoints)} pts
          <small>+${escapeOnce(v.deltaPercent)} %</small></div>`;
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
  const shownCount = data.versions.filter(v => v.isBaseline || v.isShownInFull).length - 1; // minus baseline
  const rankedCount = data.versionsByScore.filter(v => !v.isBaseline).length;
  const totalEvaluated = data.generatedProposalCount || data.journey.versionCount - 1;
  const notes: string[] = [];
  if (rankedCount < totalEvaluated) {
    notes.push(`Se evaluaron ${escapeOnce(totalEvaluated)} versiones en total; este reporte desarrolla las ${escapeOnce(Math.min(data.maxProposalsShown, rankedCount))} mejores.`);
  }
  if (data.unscoredProposalCount > 0) {
    notes.push(`${escapeOnce(data.unscoredProposalCount)} ${data.unscoredProposalCount === 1 ? 'versión adicional quedó sin evaluar comparativamente y no se incluye' : 'versiones adicionales quedaron sin evaluar comparativamente y no se incluyen'} en este reporte.`);
  }
  const noteHtml = notes.length
    ? `    <p class="methodo">${notes.join(' ')}</p>`
    : '';

  return `<section id="ranking">
  <div class="wrap">
    <div class="eyebrow">${escapeOnce(data.versions.length + 2)} · Comparación</div>
    <h2>Clasificación completa</h2>
    <p class="lede">Las ${escapeOnce(data.journey.versionCount)} versiones evaluadas con el mismo criterio, ordenadas por
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
    <h2>Las ${escapeOnce(data.roadmapCountWord)} mejoras que llevan la propuesta ganadora a ${escapeOnce(data.journey.potential)}</h2>
    <p class="lede">Cada una con su impacto estimado sobre la puntuación de ${escapeOnce(data.winnerDisplayName)}.</p>
    <div class="road">
${items}
      <div class="road-total">
        <div class="lb">Aplicando las ${escapeOnce(data.roadmapCountWord)} mejoras sobre la propuesta ganadora,
          <b>proyección estimada</b></div>
        <div class="vv tnum">${escapeOnce(data.journey.potential)}<small>/100</small></div>
      </div>
    </div>
    <div class="cta-mini">
      <div class="t"><b>Estas ${escapeOnce(data.roadmapCountWord)} mejoras ya están redactadas.</b> Forman parte de la
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
         ${escapeOnce(data.journey.proposalCount)} propuestas completas —con las ${escapeOnce(data.roadmapCountWord)} mejoras ya aplicadas,
         adaptadas a tu voz de marca y entregadas sección por sección para pasar directo a tu sitio— lo
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
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reporte de Copy — ${escapeOnce(data.company.name)} | ${escapeOnce(data.studio.name)}</title>
<style>
${CSS}
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
</body>
</html>`;
}
