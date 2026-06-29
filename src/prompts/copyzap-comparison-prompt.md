**You will receive a `.md` evaluation file from CopyZap and optionally the original page HTML. Produce the report on screen in English. Do not generate the `.docx` until approved.**

---

**IMPORTANT — score sources**

This report uses three types of scores. Always label each score clearly with its source:

- **CopyZap Session Score** — extracted from the `.md` file (Section B). Relative ranking between versions in this session (0–100). Changes if new versions are added.
- **Claude Session Score** — your own independent relative evaluation (0–100), produced blind in Phase 1 before reading Section B.
- **Claude Absolute Score** — your own 4-dimension evaluation (0–25 per dimension, total 0–100). Produced blind. CopyZap does not generate this score. Normal variance: ±3–5 pts between sessions. Calibration: 75–85 = strong professional copy, 90+ = exceptional.

Never present the Absolute Score as a CopyZap score. Never show a CopyZap Absolute Score column — CopyZap does not produce one.

---

**PHASE 1 — blind evaluation**

Read ONLY the copy between `<START_COPY>` and `<END_COPY>` markers. Do not read Section B yet.

For each version produce:

- **Claude Session Score** (0–100): relative quality vs. other versions in this set
- **Claude Absolute Score** (0–100): four dimensions, 0–25 each:
    - Clarity and Readability
    - Persuasion and Conversion
    - Audience Fit
    - Structure and Flow
- One-sentence note per dimension explaining the score

---

**REPORT SECTIONS** (produce all in English, in this order)

**1. Header** — project URL (from HTML if available, otherwise infer from context), date, and 2–3 sentence description of what the copy is selling and who it targets.

**2. What is this report about?** — brief explanation of CopyZap, what versions were evaluated, and that three scoring types are used: CopyZap session scoring (relative, from the app), Claude session scoring (blind, relative), and Claude Absolute Score (blind, 4 dimensions, Claude-only — CopyZap does not produce this).

**3. Claude's Blind Evaluation** — Phase 1 results. Table with: version, Claude session score, and the 4 Absolute Score dimensions (C&R / P&C / A.Fit / S&F / Total). Label all columns as Claude. Below the table: dimension notes for the winning version.
Before generating, verify that every table's column widths sum to exactly 12,960 DXA. If a table has a "notes" or "divergence" column, give it the remaining width after fixed columns are set.

**4. Comparison Table** — now read Section B (CopyZap scores). Table sorted by CopyZap session score descending. Columns: version · CopyZap session · Claude session · Δ session · Claude Absolute Score · divergence explanation (2–3 sentences). Label CopyZap and Claude columns explicitly with source tags. Flag rows where Δ session exceeds 10 points.
Before generating, verify that every table's column widths sum to exactly 12,960 DXA. If a table has a "notes" or "divergence" column, give it the remaining width after fixed columns are set.

**5. Absolute Score Analysis** — for each of the 4 dimensions, describe the pattern across all versions. Flag any version where a single dimension score is more than 4 points lower than the version's own average across dimensions — explain why and state what it reveals.

**6. Winning Version** — which version wins, why, who it's for, what audience stage (awareness / consideration / decision), and a specific list of what to fix before publishing.

**7. Concrete Improvements — Winning Version** — three types of improvements applied to the winning version only:

- **Line Rewrites** — identify the 2–3 weakest sentences or CTAs and show the exact before/after rewrite. Not advice — actual replacement copy, in the same language as the original copy being evaluated.
- **Structural Conversion Gaps** — identify 1–2 structural problems that no line edit will fix (e.g. missing social proof block, no urgency mechanism, CTA placement). For each: name the problem, explain why it limits conversion, and give a specific structural recommendation.
- **Impact Prioritization** — rank all suggested improvements (line rewrites + structural gaps) as High / Medium / Low impact on conversion. One sentence explaining each rating. The client must know where to spend their time first.

**8. Shared Strengths and Weaknesses** — what all versions do well, what they all lack, and one single priority fix.

**9. Strategic Executive Summary** — plain language, no jargon. Structure:

- One-sentence "so what"
- Situation (2–3 sentences)
- Findings (3–5 bullets, each: finding → implication → action)
- What the Absolute Score reveals that session scoring doesn't
- Risk of inaction
- Next steps (max 3, verb-first, with owner)

**10. Note on Objectivity** — one paragraph: scores are perspectives, not verdicts. Absolute Scores vary ±3–5 points between sessions — focus on patterns and gaps, not exact numbers. CopyZap session scores are relative to the versions evaluated and shift when new versions are added. All findings are suggestions — review with your team before acting.

---

**BEFORE EXPORTING**

Show the complete report as a visual preview in the sidebar.

Then ask: _"Do you approve, and should I generate the .docx?"_

Wait for confirmation before generating any file.

---

**OUTPUT FILE** (only after confirmation)
Before generating the .docx, verify: (1) all table column widths sum to 12,960 DXA, (2) no column is wider than its content requires, (3) margins are set to 1,440 DXA on all four sides.
Generate a single landscape `.docx` file:

- Black, white, and gray only — no color
- Arial font throughout
- Alternating light gray rows in all tables
- Dimension breakdowns as side-by-side tables
- Winning version clearly marked
- Footer on every page: project name · date · "Generated by CopyZap + Claude"

US Letter landscape (11" × 8.5"). Margins: 1 inch on all sides. All table column widths must sum to exactly 12,960 DXA (content width after margins).

Name the file using the exact name of the `.md` file provided, with `CLAUDE-REPORT-` added at the start.

Example: if the file is `llm-COMPARE_Neural_2026-06-11.md`, name the output file `CLAUDE-REPORT-llm-COMPARE_Neural_2026-06-11.docx`.
