// Single source of truth for the CopyZap HTML report design system (Preview 2 style).
// Edit this file to change colors, fonts, spacing, or component styles across all future report exports.

export interface ThemeVars {
  ink: string;
  inkSoft: string;
  muted: string;
  line: string;
  lineSoft: string;
  paper: string;
  white: string;
  accent: string;
  accentSoft: string;
  gain: string;
  gainSoft: string;
  warn: string;
  warnSoft: string;
  serif: string;
  sans: string;
  fwHeading: number;
  fwBody: number;
  fsDisplay: number;
  fsH2: number;
  fsH3: number;
  fsHero: number;
  fsScoreLg: number;
  fsScoreMd: number;
  fsBody: number;
  fsLabel: number;
  fsSmall: number;
}

// Current default values — match the visual sizes already used in the stylesheet below.
export const DEFAULT_THEME_VARS: ThemeVars = {
  ink: '#12151C',
  inkSoft: '#3A414F',
  muted: '#6B7386',
  line: '#E2DED6',
  lineSoft: '#EDEAE3',
  paper: '#F7F5F1',
  white: '#FFFFFF',
  accent: '#D7452C',
  accentSoft: '#FBE9E5',
  gain: '#1C7A5B',
  gainSoft: '#E4F1EC',
  warn: '#A8720E',
  warnSoft: '#FBF0DA',
  serif: '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif',
  sans: '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,"Helvetica Neue",Arial,sans-serif',
  fwHeading: 600,
  fwBody: 400,
  fsDisplay: 54,
  fsH2: 32,
  fsH3: 22,
  fsHero: 24,
  fsScoreLg: 34,
  fsScoreMd: 24,
  fsBody: 15.5,
  fsLabel: 10.5,
  fsSmall: 13,
};

const MONO_STACK = 'ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace';

function rootVars(v: ThemeVars): string {
  return `:root{
  --ink:${v.ink}; --ink-soft:${v.inkSoft}; --muted:${v.muted}; --line:${v.line}; --line-soft:${v.lineSoft};
  --paper:${v.paper}; --white:${v.white}; --accent:${v.accent}; --accent-soft:${v.accentSoft};
  --gain:${v.gain}; --gain-soft:${v.gainSoft}; --warn:${v.warn}; --warn-soft:${v.warnSoft};
  --serif:${v.serif};
  --sans:${v.sans};
  --mono:${MONO_STACK};
  --fw-heading:${v.fwHeading}; --fw-body:${v.fwBody};
  --fs-display:${v.fsDisplay}px; --fs-h2:${v.fsH2}px; --fs-h3:${v.fsH3}px; --fs-hero:${v.fsHero}px;
  --fs-score-lg:${v.fsScoreLg}px; --fs-score-md:${v.fsScoreMd}px;
  --fs-body:${v.fsBody}px; --fs-label:${v.fsLabel}px; --fs-small:${v.fsSmall}px;
}`;
}

const BODY_STYLES = `
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:var(--fs-body);line-height:1.65;-webkit-font-smoothing:antialiased}
.wrap{max-width:940px;margin:0 auto;padding:0 28px}
section{padding:64px 0;border-top:1px solid var(--line)}
section:first-of-type{border-top:0}
h1,h2,h3,h4{font-family:var(--serif);font-weight:var(--fw-heading);letter-spacing:-.015em;margin:0}
h1{font-size:clamp(34px,5.4vw,var(--fs-display));line-height:1.08}
h2{font-size:clamp(26px,3.6vw,var(--fs-h2));line-height:1.15;margin-bottom:10px}
h3{font-size:var(--fs-h3);line-height:1.25}
p{margin:0 0 16px}
a{color:var(--ink);text-decoration:none}
a:hover{text-decoration:underline}
code,pre{font-family:var(--mono)}
.eyebrow{font-family:var(--sans);font-size:var(--fs-label);font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:0 0 14px}
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
.cover .stamp{font-size:var(--fs-small);color:rgba(255,255,255,.45);margin-top:6px}
.journey{margin-top:48px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.13);border-radius:4px;padding:34px 30px 30px}
.journey-head{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:26px}
.stops{display:flex;align-items:flex-end;gap:0;justify-content:space-around}
.stop{flex:1;text-align:center;position:relative}
.stop .num{font-family:var(--serif);font-size:clamp(38px,7vw,60px);line-height:1;color:rgba(255,255,255,.42);font-variant-numeric:tabular-nums}
.stop .num small{font-size:.4em;color:rgba(255,255,255,.3);margin-left:2px}
.stop.now .num{color:#fff}
.stop.goal .num{color:var(--accent)}
.stop .lbl{font-size:12px;letter-spacing:.06em;color:rgba(255,255,255,.55);margin-top:10px}
.stop .lbl b{display:block;color:rgba(255,255,255,.85);font-weight:600;letter-spacing:0;font-size:13px}
.rail{height:2px;margin:26px 0 0;background:linear-gradient(90deg,rgba(255,255,255,.22) 0%,var(--accent) 100%);position:relative}
.rail i{position:absolute;top:-4px;width:10px;height:10px;border-radius:50%;background:var(--ink);border:2px solid rgba(255,255,255,.55);transform:translateX(-50%)}
.rail i.a{left:25%} .rail i.b{left:75%;background:var(--accent);border-color:var(--accent)}
.journey-foot{margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,.12);font-size:14px;color:rgba(255,255,255,.7);line-height:1.6}
.journey-foot b{color:#fff;font-weight:600}
.toc{background:var(--white);border:1px solid var(--line);border-radius:4px;overflow:hidden;margin-top:26px}
.toc a{display:flex;align-items:center;gap:16px;padding:16px 22px;border-bottom:1px solid var(--line-soft);text-decoration:none;color:var(--ink)}
.toc a:last-child{border-bottom:0}
.toc a:hover{background:var(--paper)}
.toc .idx{font-family:var(--mono);font-size:12px;color:var(--muted);width:18px;flex:none}
.toc .name{flex:1;font-size:var(--fs-body);font-weight:550;line-height:1.35}
.toc .win{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gain);background:var(--gain-soft);padding:3px 7px;border-radius:2px;margin-left:8px;white-space:nowrap}
.toc .sc{font-family:var(--serif);font-size:var(--fs-score-md);width:70px;text-align:right;flex:none;font-variant-numeric:tabular-nums}
.toc .sc small{font-size:.55em;color:var(--muted)}
.toc a.is-win .sc{color:var(--gain)}
.brief-tbl{margin-top:26px;background:var(--white);border:1px solid var(--line);border-radius:4px;overflow:hidden}
.brief-row{display:grid;grid-template-columns:200px 1fr;gap:14px;padding:14px 22px;border-bottom:1px solid var(--line-soft)}
.brief-row:last-child{border-bottom:0}
.brief-row .k{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.brief-row .v{font-size:15px;color:var(--ink-soft);line-height:1.55}
.preview-box{margin-top:26px;background:var(--white);border:1px solid var(--line);border-radius:4px;padding:24px 26px}
.preview-box .sec-lbl{font-size:var(--fs-label);font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:12px}
.preview-box .preview-text{font-size:14.5px;line-height:1.6;color:var(--ink-soft)}
.preview-box .preview-text p{margin:0 0 11px}
.preview-box .preview-text p:last-child{margin-bottom:0}
.version{background:var(--white);border:1px solid var(--line);border-radius:4px;margin-top:26px;overflow:hidden}
.v-head{padding:24px 28px;border-bottom:1px solid var(--line-soft);display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap}
.v-head .t{flex:1;min-width:220px}
.v-head h3{margin:0 0 4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:var(--fs-h3)}
.v-head .role{font-size:13.5px;color:var(--muted)}
.v-head .win{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gain);background:var(--gain-soft);padding:3px 7px;border-radius:2px;white-space:nowrap}
.v-scores{display:flex;align-items:baseline;gap:18px;flex:none}
.v-scores .big{font-family:var(--serif);font-size:var(--fs-score-lg);line-height:1;font-variant-numeric:tabular-nums}
.v-scores .big small{font-size:.42em;color:var(--muted)}
.v-scores .gain{font-size:14px;font-weight:600;color:var(--gain);text-align:right;font-variant-numeric:tabular-nums}
.v-scores .gain small{display:block;font-weight:400;color:var(--muted);font-size:12px}
.v-body{padding:26px 28px 0}
.v-body .sec{margin-bottom:22px}
.v-body .sec-lbl{font-size:var(--fs-label);font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
.v-body .sec p{margin:0 0 10px;font-size:var(--fs-body);line-height:1.7;color:var(--ink-soft)}
.v-body .sec p:last-child{margin-bottom:0}
/* Hero typography applies to the FIRST paragraph only. The hero section is
   whatever the splitter returned first, which for some sites is the entire
   proposal — Sales Boost put 27 paragraphs there and every one of them
   rendered as display type, so the whole proposal read as one huge headline.
   Capping it at the first paragraph bounds the damage regardless of how the
   scrape happens to be segmented. */
.v-body .sec.hero p{font-size:var(--fs-body);line-height:1.7;color:var(--ink-soft);font-weight:var(--fw-body)}
.v-body .sec.hero p:first-of-type{font-family:var(--serif);font-size:var(--fs-hero);line-height:1.35;color:var(--ink);font-weight:var(--fw-heading)}
.v-body .sec ul{margin:0 0 10px;padding-left:22px;color:var(--ink-soft);font-size:15px;line-height:1.65}
.v-body .sec li{margin-bottom:6px}
.v-body .sec .md-h1{font-family:var(--serif);font-size:22px;font-weight:600;color:var(--ink);margin:28px 0 12px;padding-bottom:10px;border-bottom:1px solid var(--line-soft)}
.v-body .sec .md-h1:first-child{margin-top:0}
.v-body .sec .md-h2{font-family:var(--sans);font-size:var(--fs-label);font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:22px 0 8px}
.v-body .sec .md-h3{font-family:var(--sans);font-size:13px;font-weight:700;color:var(--ink-soft);margin:18px 0 8px}
.v-body .sec .md-hr{border:0;border-top:1px solid var(--line-soft);margin:22px 0}
.v-body .sec .md-p{font-size:var(--fs-body);line-height:1.7;color:var(--ink-soft);margin:0 0 10px}
.v-body .sec .md-ul{margin:0 0 10px;padding-left:22px;color:var(--ink-soft);font-size:15px;line-height:1.65}
.v-body .sec .md-li{margin-bottom:6px}
.v-body .sec table{width:100%;border-collapse:collapse;margin:10px 0;border:1px solid var(--line)}
.v-body .sec table th,.v-body .sec table td{border:1px solid var(--line);padding:10px 12px;font-size:14px;text-align:left;color:var(--ink-soft)}
.v-body .sec table th{background:var(--paper);color:var(--ink);font-weight:700}
.split{display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid var(--line-soft)}
.split>div{padding:24px 28px}
.split>div+div{border-left:1px solid var(--line-soft)}
.split h5{font-family:var(--sans);font-size:var(--fs-label);font-weight:700;letter-spacing:.14em;text-transform:uppercase;margin:0 0 14px}
.split .pos h5{color:var(--gain)} .split .neg h5{color:var(--accent)}
.split ul{margin:0;padding:0;list-style:none}
.split li{position:relative;padding-left:22px;margin-bottom:10px;font-size:14.5px;line-height:1.55;color:var(--ink-soft)}
.split li:before{position:absolute;left:0;top:0;font-weight:700}
.split .pos li:before{content:"\\2713";color:var(--gain)}
.split .neg li:before{content:"\\2192";color:var(--accent)}
.split .empty{font-size:13px;color:var(--muted);font-style:italic}
.rank{margin-top:28px;background:var(--white);border:1px solid var(--line);border-radius:4px;overflow:hidden}
.rank-row{display:grid;grid-template-columns:34px 1fr 108px 96px;gap:14px;align-items:center;padding:18px 22px;border-bottom:1px solid var(--line-soft)}
.rank-row:last-child{border-bottom:0}
.rank-row.head{background:var(--paper);padding:12px 22px;font-size:var(--fs-label);font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:var(--muted)}
.rank-row.is-win{background:var(--gain-soft)}
.rank-row .pos{font-family:var(--serif);font-size:20px;color:var(--muted);font-variant-numeric:tabular-nums}
.rank-row.is-win .pos{color:var(--gain)}
.rank-row .nm{font-size:var(--fs-body);font-weight:550;line-height:1.35}
.rank-row .nm small{display:block;font-weight:400;color:var(--muted);font-size:12.5px;margin-top:2px}
.rank-row .tot{font-family:var(--serif);font-size:var(--fs-score-md);text-align:right;font-variant-numeric:tabular-nums}
.rank-row.is-win .tot{color:var(--gain)}
.rank-row .tot small{font-size:.5em;color:var(--muted)}
.rank-row .dl{font-size:14px;font-weight:600;color:var(--gain);text-align:right;font-variant-numeric:tabular-nums}
.rank-row .dl small{display:block;font-weight:400;color:var(--muted);font-size:11.5px}
.rank-row.base .dl{color:var(--muted);font-weight:400}
.methodo{margin-top:16px;font-size:13px;color:var(--muted);line-height:1.6;max-width:74ch}
.road{overflow:hidden;margin-top:28px;background:var(--white);border:1px solid var(--line);border-radius:4px}
.road-item{display:flex;gap:20px;padding:22px 26px;border-bottom:1px solid var(--line-soft)}
.road-item:last-of-type{border-bottom:0}
.road-item .pts{flex:none;width:56px;height:38px;border-radius:3px;background:var(--gain-soft);color:var(--gain);font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums}
.road-item .txt{font-size:15px;line-height:1.62;color:var(--ink-soft)}
.road-item .txt b{color:var(--ink);font-weight:650}
.cta-mini{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;background:var(--accent-soft);border:1px solid #F2D3CC;border-radius:4px;padding:24px 26px;margin-top:30px}
footer{background:var(--ink);color:rgba(255,255,255,.55);padding:44px 0;font-size:13px;line-height:1.7}
footer strong{color:#fff;font-weight:600}
.disclaimer{margin-top:14px;font-size:12px;color:rgba(255,255,255,.38);line-height:1.6}
.breadcrumb-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--paper);
  border-top: 1px solid var(--line);
  padding: 8px 24px;
  display: flex;
  align-items: center;
  gap: 0;
  flex-wrap: nowrap;
  overflow: hidden;
  z-index: 100;
  font-size: 12px;
  color: var(--muted);
}
.breadcrumb-nav a {
  color: var(--ink-soft);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  display: inline-block;
}
.breadcrumb-nav a:hover { color: var(--ink); text-decoration: underline; }
.breadcrumb-nav .bc-sep { margin: 0 6px; color: var(--line); flex-shrink: 0; }
.breadcrumb-nav .bc-label { margin-right: 10px; font-weight: 600; color: var(--muted); flex-shrink: 0; }
@media print {
  body { background: var(--white); }
  .no-print { display: none !important; }
  section { page-break-before: always; }
  #doc-header, #toc, #input-summary { page-break-before: auto; }
  .score-block, .geo-block, .seo-block, .version, .rank { page-break-inside: avoid; }
}
@media(max-width:760px){
  section{padding:44px 0} .wrap{padding:0 20px}
  .split{grid-template-columns:1fr}
  .split>div+div{border-left:0;border-top:1px solid var(--line-soft)}
  .brief-row{grid-template-columns:1fr;gap:4px}
  .rank-row{grid-template-columns:28px 1fr 84px;gap:10px}
  .rank-row .dl{grid-column:2;text-align:left} .rank-row .tot{grid-column:3;grid-row:1}
  .stops{gap:4px;align-items:flex-start} .stop .num{font-size:clamp(28px,9vw,40px)} .stop .lbl{font-size:11px}
  .journey{padding:26px 18px 24px}
}
`;

export function buildReportStyles(overrides?: Partial<ThemeVars>): string {
  const v: ThemeVars = { ...DEFAULT_THEME_VARS, ...overrides };
  return rootVars(v) + BODY_STYLES;
}

// Maps a font family name (as it appears inside a --serif/--sans stack string)
// to its Google Fonts css2 "family=" parameter. Add an entry here whenever a
// new Google-hosted font is added to SERIF_PRESETS or SANS_PRESETS in
// ReportThemeEditor.tsx — anything not listed here is assumed to be a system
// font and won't trigger a web font fetch.
const GOOGLE_FONT_FAMILIES: Record<string, string> = {
  'Inter': 'Inter:wght@400;500;600;700;900',
  'Playfair Display': 'Playfair+Display:wght@400;500;600;700;800;900',
  'DM Serif Display': 'DM+Serif+Display:ital,wght@0,400;1,400',
  'Lora': 'Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600',
  'Merriweather': 'Merriweather:wght@300;400;700;900',
  'Cormorant Garamond': 'Cormorant+Garamond:wght@400;500;600;700',
  'Roboto': 'Roboto:wght@400;500;600;700;900',
  'Work Sans': 'Work+Sans:wght@400;500;600;700;800',
  'Source Sans 3': 'Source+Sans+3:wght@400;500;600;700;900',
  'Manrope': 'Manrope:wght@400;500;600;700;800',
};

// Returns the <link> tag(s) needed to load every Google-hosted font
// referenced in the theme's --serif and --sans stacks, as a single request.
// "Inter" is always included since it's the default body font's primary
// web-font fallback. System-only stacks (Georgia, Times New Roman, Helvetica,
// Segoe UI, Iowan/Palatino/Georgia) contribute nothing beyond Inter.
export function getGoogleFontLinkTag(serifStack: string, sansStack: string): string {
  const families = new Set<string>(['Inter']);
  for (const name of Object.keys(GOOGLE_FONT_FAMILIES)) {
    if (serifStack.includes(name) || sansStack.includes(name)) families.add(name);
  }
  const familyParams = [...families].map(name => `family=${GOOGLE_FONT_FAMILIES[name]}`).join('&');
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?${familyParams}&display=swap" rel="stylesheet">`;
}

// Backward compatibility: the original static export, identical to buildReportStyles() with no overrides.
export const EXPORT_REPORT_STYLES = buildReportStyles();