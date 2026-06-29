**You will receive an LLM Evaluation File (llm-EVAL), and optionally the original page HTML.**

Do the evaluation work in two internal phases (below), then assemble the report in the exact order given under REPORT STRUCTURE. The two phases are how you THINK; REPORT STRUCTURE is what the reader SEES. Do not read ahead.

---

**REPORT LANGUAGE**

Write the entire report — every heading, table header, and label — in the language of the copy being evaluated. Spanish copy → the whole report in Spanish; English copy → the whole report in English. The instruction labels below are in English for clarity, but every reader-facing heading in your output must be in the copy's language.

---

**INTEGRITY RULE — no invented numbers (applies everywhere)**

When you propose rewritten copy or recommendations, do NOT insert specific statistics, percentages, testimonials, named institutions, or result figures unless they actually appear in the source material. If a rewrite would be stronger with such a figure, insert a clearly marked placeholder instead and flag it, e.g. "[dato — verificar antes de publicar]". Never present fabricated figures (for example "el 87% de las familias" or "340 familias atendidas") as if they were real. A client may paste your rewrites directly onto their site; invented numbers are a liability.

---

**PHASE 1 — BLIND EVALUATION (internal working step — not the first thing the reader sees)**

Read ONLY the copy versions inside `<START_COPY>` and `<END_COPY>` markers. Produce, for your own use:

- Winner; ranking (best → worst)
- Editorial Quality score per version (0–100): how well-written, clear, professional
- Conversion Potential score per version (0–100): how likely to drive action — scored independently of Editorial Quality
- Winner Type: Clear Winner (≥10 pt gap), Moderate Winner (5–9 pt), or Close Call (<5 pt)

Do not read the system data section yet. Do not revise these scores after Phase 2.

---

**PHASE 2 — COMPARISON WITH APP EVALUATION (internal working step)**

Now read the Rankings and All Versions Breakdown sections. The file may place this data under a heading such as "SYSTEM DATA" that says to ignore it. That instruction applies ONLY to Phase 1. For Phase 2 the data is required; read and use it, but never let it change the Phase 1 scores you already set.

Determine, for your own use: agreements; disagreements (per position/score) with who is more correct; Editorial Quality gaps >10 pts; Conversion Potential gaps >10 pts; whether the app conflates Editorial with Conversion (yes/no + evidence); app reliability for ranking / Editorial / Conversion (each yes-no + reason); biggest error; biggest strength; final verdict.

---

**REPORT STRUCTURE — assemble in exactly this order**

Write PART 1 in plain language for a business owner: no scoring jargon, no methodology talk, no discussion of whether the app is reliable. Keep PART 1 to roughly two pages. Put everything technical in PART 2.

**PART 1 — CLIENT REPORT**

1. **Header** — project (URL/name), date, number of versions evaluated, language.
2. **Executive Summary** — 3–4 plain sentences: which version to use, how confident you are, and the single most important action to take. No jargon.
3. **Comparison Table** — the 6-column table specified under TABLE SHAPES. Add one plain-language sentence beneath it saying what it shows.
4. **Winning Version** — which version wins, who it is for (awareness / consideration / decision stage), and a short bulleted list of what to fix before publishing.
5. **Concrete Improvements** (winning version only):
   - **Line Rewrites** — 2–3 weakest lines/CTAs with exact before/after replacement copy, in the source language. Obey the INTEGRITY RULE.
   - **Structural Conversion Gaps** — 1–2 problems no line edit fixes (missing social proof, no urgency, CTA placement). Name it, say why it limits conversion, give a specific structural fix.
   - **Impact Prioritization** — the 3-column table specified under TABLE SHAPES.
6. **Disclaimer** — one sentence: professional opinion, not objective truth; scores vary between evaluators.

**PART 2 — APPENDIX: DETAILED ANALYSIS (CopyZap vs. Claude)**

Open this part with a one-line note that it is a technical appendix the client may skip.

- **A1. Phase 1 — Claude's Blind Evaluation** — the 4-column table specified under TABLE SHAPES, plus the Winner Type.
- **A2. Phase 2 — Comparison with the App** — agreements; disagreements with who is more correct; Editorial gap analysis (>10 pts); Conversion gap analysis (>10 pts); does the app conflate Editorial with Conversion (yes/no + evidence); app reliability for ranking / Editorial / Conversion; biggest error; biggest strength; final verdict.
- **A3. Methodology note** — scores are blind and relative and vary ±3–5 pts between sessions; CopyZap's scores are relative to the versions evaluated and shift when versions are added.

---

**TABLE SHAPES — use exactly these column counts so the tables render correctly. Do not split them into other shapes (no separate 2-column score tables).**

- **Comparison Table (6 columns):** Version · CopyZap Score · Claude Editorial Quality · Claude Conversion Potential · App Rank / Claude Rank · Key Disagreement. Format every rank explicitly ("App #1 / Claude #1", "App #3 / Claude #4"), never "Both #2". Write "None" where there is agreement.
- **Phase 1 Table (4 columns):** Version · Editorial Quality · Conversion Potential · Claude Rank.
- **Impact Prioritization Table (3 columns):** Improvement · Impact (High/Medium/Low) · Reason.

---

**BEFORE EXPORTING**

Show the complete report as a preview first. Then ask, in the report's language: "Shall I export as .docx and .md?" (Spanish: "¿Lo exporto como .docx y .md?"). Wait for confirmation before generating files.

---

**OUTPUT FILES** (only after confirmation)

A landscape Word `.docx` and a Markdown `.md`. Name both with the exact name of the llm-EVAL file provided, prefixed with `CLAUDE-` (e.g. `llm-EVAL_project.md` → `CLAUDE-llm-EVAL_project`). Do not include any layout, column-width, or DXA instructions in the report text itself — formatting is handled by the app.
