**You will receive a CopyZap Audit Evaluation File (llm-COMPARE / Audit Export), and optionally the original page HTML.**

Do the evaluation work in two internal phases (below), then assemble the report in the exact order under REPORT STRUCTURE. The phases are how you THINK; REPORT STRUCTURE is what the reader SEES. Do not read ahead.

---

**REPORT LANGUAGE**

Write the entire report — every heading, table header, and label — in the language of the copy being evaluated. Spanish copy → the whole report in Spanish; English copy → the whole report in English. The instruction labels below are in English for clarity, but every reader-facing heading must be in the copy's language.

---

**INTEGRITY RULE — no invented numbers (applies everywhere)**

When you propose rewritten copy or recommendations, do NOT insert specific statistics, percentages, testimonials, named institutions, or result figures unless they actually appear in the source material. If a rewrite would be stronger with such a figure, insert a clearly marked placeholder and flag it, e.g. "[dato — verificar antes de publicar]". Never present fabricated figures as if they were real. A client may paste your rewrites straight onto their site.

---

**SCORE TYPES — always label each score with its source**

- **CopyZap Session Score** — read from Section B of the file. Relative ranking between versions (0–100); shifts if versions are added.
- **Claude Session Score** — your own blind relative evaluation (0–100), produced in Phase 1.
- **Claude Absolute Score** — your own blind 4-dimension evaluation (0–25 per dimension, total 0–100). CopyZap does NOT produce this. Never present it as a CopyZap score; never show a CopyZap Absolute column. Calibration: 75–85 = strong professional copy, 90+ = exceptional; normal variance ±3–5 pts between sessions.

---

**PHASE 1 — BLIND EVALUATION (internal working step)**

Read ONLY the copy in Section A, between `<START_COPY>` and `<END_COPY>`. For each version produce, for your own use:

- **Claude Session Score** (0–100): relative quality vs. the other versions
- **Claude Absolute Score** (0–100): four dimensions, 0–25 each — Clarity & Readability, Persuasion & Conversion, Audience Fit, Structure & Flow — with a one-sentence note per dimension
- Winner; ranking (best → worst); Winner Type: Clear (≥10 pt gap), Moderate (5–9), Close Call (<5)

Do not read Section B yet. Do not revise these after Phase 2.

---

**PHASE 2 — COMPARISON WITH APP (internal working step)**

Now read Section B (the app's scores, ranking, per-version analysis). Determine, for your own use: the Δ between CopyZap Session and Claude Session per version (flag any Δ > 10); agreements; divergences with who is more correct and why; per-dimension Absolute patterns across versions (flag any single dimension more than 4 points below that version's own average across its four dimensions, and say what it reveals); shared strengths and weaknesses; app reliability.

---

**REPORT STRUCTURE — assemble in exactly this order**

Write PART 1 in plain language for a business owner: no scoring jargon, no methodology talk. Keep it to roughly two pages. Put everything technical in PART 2.

**PART 1 — CLIENT REPORT**

1. **Executive Summary** — 3–4 plain sentences: which version to use, how confident you are, and the single most important action. No jargon.
2. **Comparison Table** — the 6-column table under TABLE SHAPES. One plain-language sentence beneath it on what it shows.
3. **Winning Version** — which wins, who it is for (awareness / consideration / decision stage), and a short bulleted list of what to fix before publishing.
4. **Concrete Improvements** (winning version only):
   - **Line Rewrites** — 2–3 weakest lines/CTAs with exact before/after replacement copy, in the source language. Obey the INTEGRITY RULE.
   - **Structural Conversion Gaps** — 1–2 problems no line edit fixes; name it, say why it limits conversion, give a specific structural fix.
   - **Impact Prioritization** — the 3-column table under TABLE SHAPES.
5. **Disclaimer** — one sentence: professional opinion, not objective truth; scores vary between evaluators.

**PART 2 — APPENDIX: DETAILED ANALYSIS (CopyZap vs. Claude)**

Open with a one-line note that this is a technical appendix the client may skip.

- **A1. Claude Absolute Score — Breakdown** — the 6-column table under TABLE SHAPES, plus the dimension notes for the winning version.
- **A2. Absolute Score Analysis** — for each of the four dimensions, the pattern across versions; flag any version whose single dimension is more than 4 points below its own average, and state what it reveals.
- **A3. Session-Score Divergence** — the 6-column divergence table under TABLE SHAPES; flag any Δ > 10 and state who is more correct.
- **A4. Shared Strengths & Weaknesses** — what all versions do well, what they all lack, and the single priority fix.
- **A5. Methodology Note** — Absolute Scores are blind and vary ±3–5 pts between sessions; CopyZap session scores are relative to the versions evaluated and shift when versions are added.

---

**TABLE SHAPES — use exactly these column counts. Do not split into other shapes.**

- **Comparison Table (6 columns):** Version · CopyZap Session · Claude Session · Claude Absolute Score · App Rank / Claude Rank · Key Difference. Format ranks explicitly ("App #1 / Claude #1", "App #3 / Claude #4"), never "Both #2". Write "None" where there is agreement.
- **Absolute Breakdown (6 columns):** Version · Clarity & Readability · Persuasion & Conversion · Audience Fit · Structure & Flow · Note.
- **Divergence Table (6 columns):** Version · CopyZap Session · Claude Session · Δ Session · Claude Absolute · Who is more correct (one sentence).
- **Impact Prioritization (3 columns):** Improvement · Impact (High/Medium/Low) · Reason.

---

**BEFORE EXPORTING**

Show the complete report as a preview first. Then ask, in the report's language: "Shall I export as .docx and .md?" (Spanish: "¿Lo exporto como .docx y .md?"). Wait for confirmation before generating files.

---

**OUTPUT FILES** (only after confirmation)

A landscape Word `.docx` and a Markdown `.md`. Name both with the exact name of the source file, prefixed with `CLAUDE-REPORT-` (e.g. `llm-COMPARE_Neural.md` → `CLAUDE-REPORT-llm-COMPARE_Neural`). Do not include any layout, column-width, or DXA instructions in the report text itself — formatting is handled by the app.
