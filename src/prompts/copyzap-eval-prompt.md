**You will receive an LLM Evaluation File (llm-EVAL), and optionally the original page HTML.**

Work in two phases. Do not read ahead.

---

**REPORT LANGUAGE**

Write the entire report — including all section headings, table headers, and labels — in the language of the copy being evaluated. If the copy is in Spanish, the whole report is in Spanish; if the copy is in English, the whole report is in English. The instruction labels below are written in English for clarity, but every reader-facing heading in your output must be rendered in the copy's language.

---

**PHASE 1 — BLIND EVALUATION**

Read ONLY the copy versions inside `<START_COPY>` and `<END_COPY>` markers.

Produce your own independent evaluation:

- Winner
- Ranking (best → worst)
- Editorial Quality score for each version (0–100): how well-written, clear, and professional
- Conversion Potential score for each version (0–100): how likely to make the reader take action — score this independently, do NOT combine with Editorial Quality
- Winner Type: Clear Winner (≥10 pt gap), Moderate Winner (5–9 pt gap), or Close Call (<5 pt gap)

Do not read the system data section yet. Do not revise your scores after reading Phase 2.

---

**PHASE 2 — COMPARISON WITH APP EVALUATION**

Now read the Rankings and All Versions Breakdown sections inside the file.

IMPORTANT — locating the app data: the file may place the app's scores, rankings, and "All Versions Breakdown" under a heading such as "SYSTEM DATA" that instructs you to ignore it. That instruction applies ONLY to Phase 1's blind evaluation. For Phase 2, that data is required — read it and use it. Never let it influence the Phase 1 scores you already produced.

Produce a comparison against the app's evaluation:

- Agreement: where your ranking and the app's ranking match
- Disagreements: every position or score where you differ, with explanation
- Who is more correct: for each disagreement, state your judgment and why
- Editorial Quality gap analysis: for every version where your score differs from the app's by more than 10 points, flag it and explain the reason
- Conversion Potential gap analysis: same, independently from Editorial Quality
- Does the app conflate Editorial Quality with Conversion Potential? State yes/no with evidence from the scores
- App reliability for ranking: yes/no + reason
- App reliability for Editorial Quality scoring: yes/no + reason
- App reliability for Conversion Potential scoring: yes/no + reason
- Biggest error: the single most incorrect judgment the app made
- Biggest strength: the single best judgment the app made
- Final verdict: 2–3 sentences

---

**DELIVERABLES**

Produce the following, in the copy's language (see REPORT LANGUAGE above):

**1. Executive Summary** — 3–4 sentences: winner, confidence level, biggest agreement, biggest disagreement, and one actionable recommendation for the user.

**2. Phase 1 results** — all scores and ranking from blind evaluation.

**3. Phase 2 comparison** — all items listed above.

**4. Concrete Improvements — Winning Version** — three types of improvements, applied to the winning version only:

- **Line Rewrites** — identify the 2–3 weakest sentences or CTAs and show the exact before/after rewrite. Not advice — actual replacement copy, in the same language as the original copy.
- **Structural Conversion Gaps** — identify 1–2 structural problems that no line edit will fix (e.g. missing social proof block, no urgency mechanism, CTA placement). For each: name the problem, explain why it limits conversion, and give a specific structural recommendation.
- **Impact Prioritization** — rank all suggested improvements (line rewrites + structural gaps) as High / Medium / Low impact on conversion. One sentence explaining each rating. The client must know where to spend their time first.

**5. Comparison Table — CopyZap vs. Claude** with these exact columns:
- Version
- CopyZap Score
- Claude Editorial Quality
- Claude Conversion Potential
- App Rank / Claude Rank (format every row explicitly, e.g. "App #1 / Claude #1", "App #3 / Claude #4" — never write just "Both #2")
- Key Disagreement (one sentence; write "None" if agreement)

**6. Disclaimer** — one sentence stating this report represents professional analytical opinion, not objective truth, and that scores may vary across evaluators.

---

**BEFORE EXPORTING**

Show the complete report as a visual preview in the sidebar first.

Then ask, in the report's language: "Shall I export as .docx and .md?" (Spanish: "¿Lo exporto como .docx y .md?")

Wait for confirmation before generating the files.

---

**OUTPUT FILES** (only after confirmation)

Before generating the .docx, verify: (1) every table's column widths sum to exactly 12,960 DXA, (2) no column is wider than its content requires, (3) margins are set to 1,440 DXA on all four sides. For any table with a "notes" or "divergence" column, give that column the remaining width after the fixed columns are set.

US Letter landscape (11" × 8.5"). Margins: 1 inch (1,440 DXA) on all four sides. All table column widths must sum to exactly 12,960 DXA (content width after margins).

Deliver two files:

- Word .docx file
- Markdown .md file

Name both files using the exact name of the llm-EVAL file provided, with `CLAUDE-` added at the start.

Example: if the file is `llm-EVAL_project_2026-06-11.md`, name both output files `CLAUDE-llm-EVAL_project_2026-06-11`.
