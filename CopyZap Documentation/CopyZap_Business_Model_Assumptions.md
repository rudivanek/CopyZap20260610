# CopyZap — Business Model Assumptions

**Document Version:** 1.0
**Status:** Strategic Modeling Input — Pre-Testing Freeze
**Last Updated:** 2026-02-24
**Maintained By:** Documentation Owner
**Derived From:** `02_CopyZap_Strategic_Positioning.md`, `01_CopyZap_Operating_Manual_v1.0.md`, `CopyZap_Ideal_Customer_Profile.md`

All figures in this document are **strategic modeling assumptions**. None represent confirmed pricing, confirmed cost data, or confirmed unit economics. Every assumption is explicitly labeled **[ASSUMPTION]**. This document exists to support feasibility modeling, investor preparation, and pricing strategy discussion — not to make binding commercial commitments.

---

## 1. Monetization Model

**Model:** Monthly SaaS subscription with credit-based usage enforcement.

**Structure:**
- Access is gated by subscription tier.
- Usage within a tier is governed by a credit allocation system tracked in the database (`creditsRemaining`, `creditsAllowed` per user record).
- Credits are consumed per AI operation (generation, scoring, comparison, transformation). Credit cost per operation is deterministic and stored in the `llm_billing_rules` table.
- Users who exhaust credits before renewal enter an enforcement state. Enforcement behavior (hard block vs. grace period) is configurable.

**This model is confirmed in the Operating Manual (Section 7 — Token and Credit System).** The pricing tiers below are strategic assumptions built on top of this confirmed architecture.

---

## 2. Target Pricing Assumptions

**[ASSUMPTION — Strategic Modeling Input. Not final pricing. Subject to validation.]**

| Tier | Name | Monthly Price | Credit Allocation | Target Segment |
|---|---|---|---|---|
| 1 | Starter | $49/month | **[ASSUMPTION]** Sufficient for ~20–30 full Copy Maker sessions | Solo copywriter or small agency with 1–3 active clients |
| 2 | Agency | $99/month | **[ASSUMPTION]** Sufficient for ~60–80 full sessions | Small agency with 5–15 active clients |
| 3 | Pro Agency | $149/month | **[ASSUMPTION]** Sufficient for ~120–150 full sessions + advanced features | Mid-tier agency with 15–30 active clients |

**Pricing rationale:**
- Positioned below Jasper (enterprise-tier pricing typically $125–$250/month+) and above free-tier ChatGPT wrappers.
- Competitor benchmark: Copy.ai Pro at **[ASSUMPTION]** ~$49/month provides a floor reference for buyer psychology.
- At $99/month, the ROI break-even threshold is approximately 1–2 hours of saved copy revision time per month at a $75/hour blended agency rate.

**Free trial structure:**
- 30-day free trial with credit allocation — confirmed in Operating Manual (Section 7 — Free Trial System).
- Trial is sufficient to complete 3–5 full Copy Maker sessions including scoring and comparison.
- No credit card required at trial start: **[ASSUMPTION — TO BE VALIDATED against current implementation]**

---

## 3. Cost Structure Assumptions

**Primary cost driver: LLM token consumption**

All AI operations consume tokens billed through third-party model APIs (OpenAI, Anthropic, xAI/Grok). Token cost varies by model:

| Model Tier | Cost Characteristic | Typical Operations |
|---|---|---|
| Standard (GPT-4o, Claude Sonnet) | Mid-range per-token cost | Copy Maker generation, scoring, Quick Polish |
| Premium (o1, Claude Opus) | High per-token cost | Enhanced pipeline, deep analysis |
| Economy (GPT-4o mini, DeepSeek) | Low per-token cost | CopySnap operations, fast transformations |

**[ASSUMPTION]** Variable cost per active user is dominated by:
1. Copy Maker generation (primary volume driver)
2. Comprehensive scoring (secondary volume driver)
3. Deep analysis and comparison (high per-operation cost but lower frequency)

**Infrastructure costs (secondary):**
- Supabase database (managed)
- Netlify or equivalent hosting (static frontend)
- Edge function compute (relatively low given serverless architecture)

**[ASSUMPTION] Gross margin target:** 70%+ consistent with SaaS benchmark. Achievable only if per-user LLM cost is kept below 30% of subscription revenue. This requires credit allocation limits to be set conservatively relative to raw API costs.

---

## 4. Unit Economics Assumptions

All figures below are **[ASSUMPTION — Modeling Inputs Only]**. Replace with confirmed data when available.

| Metric | Assumption | Notes |
|---|---|---|
| Average LLM cost per active user per month | $10–$25 | Dependent on usage intensity and model tier distribution |
| Target markup multiplier over raw LLM cost | 4–10x | Required to reach 70%+ gross margin across all tiers |
| Target ARPU (Average Revenue Per User) | $90–$110/month blended | Assumes mix of Starter, Agency, Pro Agency tier distribution skewed toward mid-tier |
| Target monthly churn | 3–6% | Consistent with SMB SaaS benchmarks; agencies have higher retention if tool is embedded in delivery workflow |
| CAC (Customer Acquisition Cost) | Placeholder — not modeled | Requires marketing channel data. No assumption made. |
| LTV (Lifetime Value) at 4% monthly churn | ~25 months average customer life | LTV = ARPU × (1 / churn rate) |
| LTV:CAC ratio target | 3:1 or higher | Standard SaaS benchmark; not calculable without CAC data |

**Note on churn:** Agency churn is lower when the tool is embedded in client delivery processes (version comparison, scoring evidence shown to clients). Tools that become client-facing evidence generators have structural retention advantage.

---

## 5. Expansion Potential

The following represent future optional expansion paths. **None are current capabilities.** All are labeled as future options.

| Expansion Path | Description | Status |
|---|---|---|
| **Team seats** | Multiple users per workspace, shared sessions, team-level credit pool | **[FUTURE — not currently implemented]** |
| **Enterprise plans** | Custom credit allocations, admin audit trails, SSO, dedicated support | **[FUTURE — not currently implemented]** |
| **API access** | Programmatic access to CopyZap's generation, scoring, and comparison pipeline for integration into agency client workflows | **[FUTURE — not currently implemented]** |
| **White-label** | Branded version of CopyZap deployed under agency or partner brand | **[FUTURE — not currently implemented]** |
| **Workflow marketplace** | Shareable public workflow templates authored by agencies and power users | **[POTENTIAL — partial infrastructure exists via public workflow flag; full marketplace not implemented]** |

**Expansion readiness note:** The credit system architecture (user-level credit tracking, operation-level billing rules in database, configurable enforcement mode) is designed to support tiered and team-based billing expansion without architectural changes to the core usage tracking layer.

---

## 6. Revenue Modeling Inputs

**[ASSUMPTION — Modeling Inputs Only. Not projections.]**

These inputs are provided for feasibility modeling only. They are not forecasts.

| Input | Value | Basis |
|---|---|---|
| Target paying users at initial launch | 50–200 | **[ASSUMPTION]** Small initial cohort from agency network |
| Revenue at 100 paying users (blended ARPU $95) | ~$9,500/month | Modeling input |
| Revenue at 500 paying users (blended ARPU $95) | ~$47,500/month | Modeling input |
| Revenue at 1,000 paying users (blended ARPU $95) | ~$95,000/month | Modeling input |
| Break-even user count at assumed cost structure | **[ASSUMPTION]** 150–300 users | Dependent on confirmed infrastructure and LLM cost baseline |

**Note:** These inputs are intentionally conservative and have not been validated against actual cost data. They exist to test the viability of the model under worst-case assumptions, not to project future revenue.

---

*This document reflects business model assumptions as of v1.0. All pricing, cost, and unit economics figures are modeling inputs only. No commitments are implied. Update required when pricing is finalized, cost data is confirmed, or investor modeling inputs are validated.*
