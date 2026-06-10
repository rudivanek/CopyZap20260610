import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  ChevronRight,
  BarChart2,
  Trophy,
  Eye,
  Layers,
  Shield,
  TrendingUp,
  FileText,
  Users,
  Zap,
  Target,
  Search,
  Globe,
  Menu,
  X
} from 'lucide-react';
import SocialShare from './SocialShare';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

// ─── MOCK VISUAL: Score Card ─────────────────────────────────────────────────

const ScoreBadge: React.FC<{ score: number; winner?: boolean }> = ({ score, winner }) => (
  <span
    className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold tabular-nums
      ${winner
        ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400'
        : score >= 70
        ? 'bg-gray-100 text-gray-700'
        : 'bg-red-50 text-red-600'
      }`}
  >
    {score}
  </span>
);

const HeroVisual: React.FC = () => (
  <div className="relative mx-auto max-w-xl">
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <span className="text-xs text-gray-500 font-medium ml-2">Comparison — 3 versions evaluated</span>
      </div>

      <div className="p-5 space-y-3">
        {[
          { label: 'Version A', score: 61, dims: [62, 58, 64] },
          { label: 'Version B', score: 74, dims: [76, 71, 75] },
          { label: 'Version C — Winner', score: 88, dims: [91, 85, 89], winner: true }
        ].map((v) => (
          <div
            key={v.label}
            className={`rounded-xl p-3.5 border transition-all
              ${v.winner
                ? 'border-emerald-300 bg-emerald-50/60'
                : 'border-gray-100 bg-gray-50/60'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ScoreBadge score={v.score} winner={v.winner} />
                <div>
                  <p className={`text-sm font-semibold ${v.winner ? 'text-emerald-800' : 'text-gray-800'}`}>
                    {v.label}
                  </p>
                  {v.winner && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium mt-0.5">
                      <Trophy size={10} />
                      Recommended for publish
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {['Clarity', 'Trust', 'Conv.'].map((dim, i) => (
                  <span key={dim} className="flex flex-col items-center">
                    <span className="font-semibold text-gray-700">{v.dims[i]}</span>
                    <span>{dim}</span>
                  </span>
                ))}
              </div>
            </div>
            {v.winner && (
              <div className="mt-2.5 pt-2.5 border-t border-emerald-200">
                <p className="text-xs text-emerald-700 leading-relaxed">
                  <span className="font-semibold">Why it wins:</span> Highest trust signal density, stronger call-to-action clarity, and direct benefit framing in the first sentence — absent in A and B.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    <div className="absolute -top-3 -right-3 bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs font-medium text-gray-700">
      3 versions · scored automatically
    </div>
  </div>
);

// ─── NAV ─────────────────────────────────────────────────────────────────────

const Nav: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="/copyzap.png" alt="CopyZap" className="h-8 w-auto" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/help" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Help</Link>
          <Link to="/copy-maker" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Login</Link>
          <Link
            to="/create-account"
            className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Get started free
          </Link>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-gray-600">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 flex flex-col gap-4">
          <Link to="/help" className="text-sm text-gray-700" onClick={() => setOpen(false)}>Help</Link>
          <Link to="/copy-maker" className="text-sm text-gray-700" onClick={() => setOpen(false)}>Login</Link>
          <Link to="/create-account" onClick={() => setOpen(false)} className="bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg">
            Get started free
          </Link>
        </div>
      )}
    </nav>
  );
};

// ─── SECTION WRAPPER ─────────────────────────────────────────────────────────

const Section: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({
  children, className = '', id
}) => (
  <motion.section
    id={id}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-80px' }}
    variants={fadeIn}
    className={`py-20 lg:py-28 ${className}`}
  >
    {children}
  </motion.section>
);

const Container: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`max-w-6xl mx-auto px-4 sm:px-6 ${className}`}>{children}</div>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-orange-500 mb-4">{children}</p>
);

// ─── 1. HERO ──────────────────────────────────────────────────────────────────

const Hero: React.FC = () => (
  <Section className="bg-white pt-8 lg:pt-14 pb-16 lg:pb-24">
    <Container>
      <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.div variants={fadeUp}>
            <SectionLabel>Copy intelligence platform</SectionLabel>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="font-sans text-[3.625rem] sm:text-[4.75rem] lg:text-[5.75rem] xl:text-[6.5rem] font-bold text-gray-950 leading-[0.97] tracking-[-0.045em] mb-8"
          >
            AI can generate copy.<br />
            <span className="text-orange-500">It cannot tell you<br />what to publish.</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="font-sans text-[1.0625rem] sm:text-[1.125rem] text-gray-500 leading-[1.6] mb-8 max-w-[56ch]"
          >
            CopyZap evaluates, compares, and scores your copy so you know which version actually works — before you ship it.
          </motion.p>

          <motion.ul variants={stagger} className="space-y-3 mb-10">
            {[
              'See which version performs best',
              'Understand exactly why it wins',
              'Publish with evidence, not instinct'
            ].map((item) => (
              <motion.li key={item} variants={fadeUp} className="flex items-center gap-3 text-gray-700">
                <CheckCircle size={17} className="text-emerald-500 shrink-0" />
                <span className="text-base font-medium">{item}</span>
              </motion.li>
            ))}
          </motion.ul>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/create-account"
              className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-semibold px-6 py-3.5 rounded-lg transition-colors text-sm"
            >
              See your copy scored
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/copy-maker"
              className="inline-flex items-center justify-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-6 py-3.5 rounded-lg transition-colors text-sm"
            >
              View example
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <HeroVisual />
        </motion.div>
      </div>
    </Container>
  </Section>
);

// ─── 2. PROBLEM REFRAME ───────────────────────────────────────────────────────

const ProblemReframe: React.FC = () => (
  <Section className="bg-gray-50 border-y border-gray-200">
    <Container>
      <div className="max-w-3xl mx-auto text-center">
        <SectionLabel>The real bottleneck</SectionLabel>
        <motion.h2
          variants={fadeUp}
          className="font-sans text-[2.125rem] sm:text-[2.75rem] lg:text-[3.25rem] font-bold text-gray-900 leading-[1.08] tracking-[-0.03em] mb-10"
        >
          If AI can generate ten versions… why is choosing still hard?
        </motion.h2>
        <motion.p variants={fadeUp} className="text-lg text-gray-600 leading-[1.7] mb-7 max-w-[65ch] mx-auto">
          Every AI writing tool has solved the same problem: producing a first draft. Generate a headline, a landing page, an email — the blank page problem is gone.
        </motion.p>
        <motion.p variants={fadeUp} className="text-lg text-gray-600 leading-[1.7] mb-7 max-w-[65ch] mx-auto">
          But the hard part was never the blank page. The hard part is what comes after — deciding which version is worth publishing, understanding why it is better than the others, and being able to explain that decision to a client or stakeholder who will push back.
        </motion.p>
        <motion.p variants={fadeUp} className="text-lg text-gray-600 leading-[1.7] mb-12 max-w-[65ch] mx-auto">
          That decision is handed back to you, unanswered, every time. By every tool. Without exception.
        </motion.p>
        <motion.div
          variants={fadeUp}
          className="inline-block bg-white border border-orange-200 rounded-xl px-8 py-5 shadow-sm"
        >
          <p className="font-sans text-[1.375rem] font-bold text-gray-900 leading-snug tracking-[-0.02em]">
            You are not missing skill.
            <br />
            <span className="text-orange-500">The system is missing a layer.</span>
          </p>
        </motion.div>
      </div>
    </Container>
  </Section>
);

// ─── 3. WHY OTHER TOOLS FAIL ──────────────────────────────────────────────────

const WhyToolsFail: React.FC = () => (
  <Section className="bg-white">
    <Container>
      <div className="max-w-3xl mx-auto">
        <SectionLabel>The gap</SectionLabel>
        <motion.h2 variants={fadeUp} className="font-sans text-[2.125rem] sm:text-[2.75rem] lg:text-[3.25rem] font-bold text-gray-900 leading-[1.08] tracking-[-0.03em] mb-14">
          Every AI writing tool stops at generation
        </motion.h2>

        <motion.div variants={stagger} className="space-y-8 mb-14">
          <motion.div variants={fadeUp} className="flex gap-5">
            <div className="mt-1 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-sans text-[1.125rem] sm:text-[1.1875rem] font-semibold text-gray-900 mb-2">What they do well</p>
              <p className="text-base text-gray-600 leading-[1.7] max-w-[65ch]">
                Generate copy fast. From a prompt, a template, or a URL — most tools can produce a competent draft in under a minute. That is a genuine improvement over starting from nothing. The production problem is solved.
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="flex gap-5">
            <div className="mt-1 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <X size={16} className="text-red-500" />
            </div>
            <div>
              <p className="font-sans text-[1.125rem] sm:text-[1.1875rem] font-semibold text-gray-900 mb-2">What they miss</p>
              <p className="text-base text-gray-600 leading-[1.7] max-w-[65ch]">
                Evaluation. None of them score what they generate. None of them compare versions on a structured framework. None of them tell you which version is stronger and explain why. The output appears and control returns to you — with no tools to make the decision well.
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="flex gap-5">
            <div className="mt-1 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Target size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="font-sans text-[1.125rem] sm:text-[1.1875rem] font-semibold text-gray-900 mb-2">Why it matters</p>
              <p className="text-base text-gray-600 leading-[1.7] max-w-[65ch]">
                Publishing the wrong version is not a hypothetical risk. It is the default outcome when version selection happens without evidence. You produce more copy faster, but you are no more confident in what you ship.
              </p>
            </div>
          </motion.div>
        </motion.div>

        <motion.blockquote
          variants={fadeUp}
          className="border-l-4 border-orange-400 pl-6 mb-12"
        >
          <p className="text-xl text-gray-700 italic leading-[1.65]">
            "You publish and move on, never knowing if it was the best version available."
          </p>
        </motion.blockquote>

        <motion.div variants={fadeUp}>
          <Link
            to="/create-account"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3.5 rounded-lg transition-colors text-sm"
          >
            See your copy scored
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </Container>
  </Section>
);

// ─── 4. HOW IT WORKS ──────────────────────────────────────────────────────────

const HowItWorks: React.FC = () => (
  <Section className="bg-gray-50 border-y border-gray-200">
    <Container>
      <div className="max-w-3xl mx-auto text-center mb-16">
        <SectionLabel>How it works</SectionLabel>
        <motion.h2 variants={fadeUp} className="font-sans text-[2.125rem] sm:text-[2.75rem] lg:text-[3.25rem] font-bold text-gray-900 leading-[1.08] tracking-[-0.03em]">
          Three steps. One clear answer.
        </motion.h2>
      </div>

      <motion.div variants={stagger} className="grid md:grid-cols-3 gap-8 relative">
        <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px bg-gray-200" />

        {[
          {
            step: '01',
            icon: FileText,
            title: 'Generate or import copy',
            body: 'Create copy from structured inputs, import your existing drafts, or pull context directly from a URL. Bring whatever you have.'
          },
          {
            step: '02',
            icon: Layers,
            title: 'Create multiple variations',
            body: 'Run multiple versions — different angles, tones, or structures. The system is built for comparison from the start, not as an afterthought.'
          },
          {
            step: '03',
            icon: BarChart2,
            title: 'Evaluate across key dimensions',
            body: 'Every version is scored on clarity, persuasion, trust, and conversion likelihood. Additional dimensions activate based on your stated goal.'
          }
        ].map(({ step, icon: Icon, title, body }) => (
          <motion.div
            key={step}
            variants={fadeUp}
            className="relative bg-white rounded-2xl border border-gray-200 p-7 shadow-sm"
          >
            <span className="text-xs font-bold text-orange-500 tracking-widest mb-4 block">{step}</span>
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <Icon size={19} className="text-gray-700" />
            </div>
            <h3 className="font-sans text-[1.0625rem] sm:text-[1.125rem] font-semibold text-gray-900 mb-3 tracking-[-0.02em]">{title}</h3>
            <p className="text-[0.9375rem] text-gray-600 leading-[1.7]">{body}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        variants={fadeUp}
        className="text-center text-[0.9375rem] text-gray-500 leading-[1.6] mt-10 max-w-xl mx-auto"
      >
        Each version is scored across multiple dimensions, plus additional dimensions that activate based on your stated goal.
      </motion.p>
    </Container>
  </Section>
);

// ─── 5. SCORING ───────────────────────────────────────────────────────────────

const scoringDimensions = [
  {
    icon: Eye,
    name: 'Clarity',
    description: 'Is the message immediately understood? No jargon, no ambiguity, no cognitive load.',
    conditional: false
  },
  {
    icon: TrendingUp,
    name: 'Persuasion',
    description: 'Does it move the reader toward the intended action? Evaluates argument structure and motivational logic.',
    conditional: false
  },
  {
    icon: Shield,
    name: 'Trust',
    description: 'Does the language build credibility and reduce resistance? Evaluates tone, specificity, and social proof signals.',
    conditional: false
  },
  {
    icon: Target,
    name: 'Conversion likelihood',
    description: 'How strongly does the copy drive a specific action? CTA quality, benefit clarity, urgency without pressure.',
    conditional: false
  },
  {
    icon: Search,
    name: 'SEO performance',
    description: 'Keyword integration quality, semantic relevance, and structure for search visibility. Activates when SEO is the stated goal.',
    conditional: true,
    tag: 'Activates for SEO goals'
  },
  {
    icon: Globe,
    name: 'GEO optimization',
    description: 'Evaluates discoverability by AI assistants: direct answers, quote-friendly sentences, authority signals. Activates for GEO goals.',
    conditional: true,
    tag: 'Activates for GEO goals'
  }
];

const ScoringSection: React.FC = () => (
  <Section className="bg-white">
    <Container>
      <div className="max-w-2xl mb-14">
        <SectionLabel>Evaluation framework</SectionLabel>
        <motion.h2 variants={fadeUp} className="font-sans text-[2.125rem] sm:text-[2.75rem] lg:text-[3.25rem] font-bold text-gray-900 leading-[1.08] tracking-[-0.03em] mb-6">
          What gets scored
        </motion.h2>
        <motion.p variants={fadeUp} className="text-base text-gray-600 leading-[1.7] max-w-[65ch]">
          Each version is scored across multiple dimensions, plus additional dimensions that activate based on your stated goal. Every score is grounded in the copy itself — not generic quality heuristics.
        </motion.p>
      </div>

      <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {scoringDimensions.map(({ icon: Icon, name, description, conditional, tag }) => (
          <motion.div
            key={name}
            variants={fadeUp}
            className={`rounded-2xl border p-6 ${
              conditional
                ? 'border-dashed border-gray-300 bg-gray-50'
                : 'border-gray-200 bg-white shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                <Icon size={16} className="text-gray-700" />
              </div>
              {tag && (
                <span className="text-[10px] font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              )}
            </div>
            <h3 className="font-sans text-[1.0625rem] sm:text-[1.125rem] font-semibold text-gray-900 mb-2 tracking-[-0.02em]">{name}</h3>
            <p className="text-[0.875rem] text-gray-500 leading-[1.65]">{description}</p>
          </motion.div>
        ))}
      </motion.div>
    </Container>
  </Section>
);

// ─── 6. USE CASES ─────────────────────────────────────────────────────────────

const useCases = [
  {
    icon: Zap,
    role: 'Founder',
    situation: 'You wrote the homepage yourself.',
    problem: 'Three rewrites in and it still does not convert. You cannot tell if the problem is the message or the structure.',
    outcome: 'Run five variants. The scoring system identifies which benefit framing scores highest on conversion likelihood and trust. You publish with evidence, not with a hunch.',
    summary: 'Stop guessing which version of your value prop actually lands.'
  },
  {
    icon: Users,
    role: 'In-house marketer',
    situation: 'You produce copy across channels, campaigns, and formats.',
    problem: 'Quality is inconsistent across team members. Revision cycles are long because feedback is preference-based with no shared objective standard.',
    outcome: 'Scored outputs give every revision request a documented basis. Brand voice profiles enforce consistency without a style guide policing session.',
    summary: 'Consistent quality across everyone on the team, every campaign.'
  },
  {
    icon: Layers,
    role: 'Agency copywriter',
    situation: 'You deliver copy to clients who revise based on taste.',
    problem: 'You spend more time defending creative choices than writing. Revision rounds are expensive and driven by whoever has the most authority in the room.',
    outcome: 'Export a scored comparison report showing every version, dimension scores, and the recommended winner with a written rationale. Creative decisions have evidence.',
    summary: 'Defend every recommendation with data. Not opinion.'
  },
  {
    icon: TrendingUp,
    role: 'Performance marketer',
    situation: 'You are running paid campaigns and need the strongest ad copy.',
    problem: 'You test copy in-platform by spending budget. Pre-launch evaluation does not exist. You ship and wait.',
    outcome: 'Compare five ad variants on persuasion, trust, and conversion likelihood before spending a dollar. Eliminate the bottom performers before the test begins.',
    summary: 'Pre-qualify copy before it sees a budget line.'
  },
  {
    icon: FileText,
    role: 'Freelancer',
    situation: 'You produce copy for multiple clients with different voices and standards.',
    problem: 'Each project rebuilds context from scratch. Client voice is re-interpreted each time. No reusable system means no leverage as volume grows.',
    outcome: 'Brand voice profiles, saved templates, and session history reduce per-project overhead. The knowledge you build for a client compounds across every future project.',
    summary: 'Build a system that gets faster with every client, not just experienced.'
  }
];

const UseCases: React.FC = () => (
  <Section className="bg-gray-50 border-y border-gray-200">
    <Container>
      <div className="max-w-2xl mb-14">
        <SectionLabel>Who it is for</SectionLabel>
        <motion.h2 variants={fadeUp} className="font-sans text-[2.125rem] sm:text-[2.75rem] lg:text-[3.25rem] font-bold text-gray-900 leading-[1.08] tracking-[-0.03em]">
          The same problem. Five different situations.
        </motion.h2>
      </div>

      <motion.div variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {useCases.map(({ icon: Icon, role, situation, problem, outcome, summary }) => (
          <motion.div
            key={role}
            variants={fadeUp}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                <Icon size={15} className="text-orange-500" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{role}</span>
            </div>
            <p className="font-sans text-[1rem] sm:text-[1.0625rem] font-semibold text-gray-900 mb-2 leading-snug tracking-[-0.015em]">{situation}</p>
            <p className="text-[0.875rem] text-gray-500 leading-[1.65] mb-3">{problem}</p>
            <p className="text-[0.875rem] text-gray-700 leading-[1.65] mb-4">{outcome}</p>
            <div className="mt-auto pt-3 border-t border-gray-100">
              <p className="text-[0.8125rem] font-semibold text-orange-600">{summary}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </Container>
  </Section>
);

// ─── 7. BENEFITS ──────────────────────────────────────────────────────────────

const benefits = [
  {
    before: 'Publishing the version that felt right',
    after: 'Publishing the version that scored highest on the criteria that matter'
  },
  {
    before: 'Evaluating copy with personal judgment',
    after: 'Evaluating copy against context-specific dimensions calibrated to your goal'
  },
  {
    before: 'Revision cycles driven by preference',
    after: 'Revision requests backed by a score, a rationale, and a documented recommendation'
  },
  {
    before: 'Shipping and hoping',
    after: 'Shipping with confirmation that the evaluation was run and the best version selected'
  },
  {
    before: 'Rebuilding context for every new project',
    after: 'Brand voices, templates, and session history that compound across every future project'
  },
  {
    before: 'Defending creative choices with enthusiasm',
    after: 'Defending creative choices with a scored comparison report and a written rationale'
  }
];

const Benefits: React.FC = () => (
  <Section className="bg-white">
    <Container>
      <div className="max-w-2xl mb-14">
        <SectionLabel>What changes</SectionLabel>
        <motion.h2 variants={fadeUp} className="font-sans text-[2.125rem] sm:text-[2.75rem] lg:text-[3.25rem] font-bold text-gray-900 leading-[1.08] tracking-[-0.03em]">
          Not better copy. Better decisions.
        </motion.h2>
      </div>

      <motion.div variants={stagger} className="space-y-4 max-w-3xl">
        {benefits.map(({ before, after }) => (
          <motion.div
            key={before}
            variants={fadeUp}
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 bg-gray-50 rounded-xl px-5 py-4 border border-gray-100"
          >
            <p className="text-[0.9375rem] text-gray-400 leading-snug line-through decoration-gray-300">{before}</p>
            <ChevronRight size={14} className="text-orange-400 shrink-0" />
            <p className="text-[0.9375rem] text-gray-800 font-medium leading-snug">{after}</p>
          </motion.div>
        ))}
      </motion.div>
    </Container>
  </Section>
);

// ─── 8. COMPARISON TABLE ─────────────────────────────────────────────────────

const comparisonRows = [
  {
    category: 'Core function',
    tools: 'Generate text based on prompts or templates',
    copyzap: 'Generate copy, then evaluate, compare, and select the version worth publishing'
  },
  {
    category: 'Evaluation',
    tools: 'None — quality assessment is the user\'s responsibility',
    copyzap: 'Built-in multi-dimensional scoring engine calibrated to use case and format'
  },
  {
    category: 'Version comparison',
    tools: 'Manual — user reads outputs and chooses by instinct',
    copyzap: 'Structured: all versions scored, ranked, compared with calculated deltas'
  },
  {
    category: 'Decision support',
    tools: 'None — user decides without data',
    copyzap: 'Winner declared with strategic rationale and evidence-anchored analysis'
  },
  {
    category: 'User responsibility',
    tools: 'Interpret the output and decide',
    copyzap: 'The system evaluates, ranks, and recommends the best version'
  },
  {
    category: 'Confidence at publish',
    tools: 'Intuition-based — no quality confirmation',
    copyzap: 'Evidence-based — score confirmed, comparison run, recommendation reviewed'
  },
  {
    category: 'Explainability',
    tools: 'Output produced — no explanation of what is strong or weak',
    copyzap: 'Named strengths, named weaknesses, anchored to specific content per version'
  },
  {
    category: 'Workflow outcome',
    tools: 'More copy, faster — decision quality unchanged',
    copyzap: 'More copy, faster, with structured evidence for every publish decision'
  }
];

const ComparisonTable: React.FC = () => (
  <Section className="bg-gray-50 border-y border-gray-200">
    <Container>
      <div className="max-w-2xl mb-14">
        <SectionLabel>Where it differs</SectionLabel>
        <motion.h2 variants={fadeUp} className="font-sans text-[2.125rem] sm:text-[2.75rem] lg:text-[3.25rem] font-bold text-gray-900 leading-[1.08] tracking-[-0.03em] mb-6">
          Where other tools stop — and where CopyZap begins
        </motion.h2>
        <motion.p variants={fadeUp} className="text-base text-gray-600 leading-[1.7]">
          Generation is solved. Deciding what to publish is not.
        </motion.p>
      </div>

      <motion.div variants={fadeUp} className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-[180px_1fr_1fr] bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider">
          <div className="px-5 py-4 border-r border-gray-700"></div>
          <div className="px-5 py-4 border-r border-gray-700 text-gray-400">Typical AI writing tools</div>
          <div className="px-5 py-4 text-orange-400">CopyZap</div>
        </div>

        {comparisonRows.map((row, i) => (
          <div
            key={row.category}
            className={`grid grid-cols-[180px_1fr_1fr] ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
          >
            <div className="px-5 py-4 border-r border-gray-200 font-semibold text-gray-600 text-[0.75rem] uppercase tracking-wide">
              {row.category}
            </div>
            <div className="px-5 py-4 border-r border-gray-200 text-[0.9375rem] text-gray-500 leading-[1.65]">
              {row.tools}
            </div>
            <div className="px-5 py-4 text-[0.9375rem] text-gray-800 leading-[1.65] font-medium">
              {row.copyzap}
            </div>
          </div>
        ))}
      </motion.div>

      <motion.p
        variants={fadeUp}
        className="text-center text-[0.9375rem] text-gray-500 leading-[1.6] mt-8"
      >
        This is not a better version of the same thing. It is a different category of tool.
      </motion.p>
    </Container>
  </Section>
);

// ─── 9. FINAL CTA ─────────────────────────────────────────────────────────────

const FinalCTA: React.FC = () => (
  <Section className="bg-gray-900">
    <Container>
      <div className="max-w-2xl mx-auto text-center">
        <motion.h2 variants={fadeUp} className="font-sans text-[2.125rem] sm:text-[2.75rem] lg:text-[3.25rem] font-bold text-white leading-[1.08] tracking-[-0.03em] mb-6">
          Stop guessing. Start knowing.
        </motion.h2>
        <motion.p variants={fadeUp} className="font-sans text-xl text-gray-400 mb-10 leading-[1.65]">
          See which version actually works before you publish.
        </motion.p>
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/create-account"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors"
          >
            Try CopyZap
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/copy-maker"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            Already have an account? Login
            <ChevronRight size={14} />
          </Link>
        </motion.div>
      </div>
    </Container>
  </Section>
);

// ─── FOOTER ───────────────────────────────────────────────────────────────────

const Footer: React.FC = () => (
  <footer className="bg-gray-900 border-t border-gray-800 py-10">
    <Container>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <Link to="/">
          <img src="/copyzap.png" alt="CopyZap" className="h-7 w-auto opacity-80" />
        </Link>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <Link to="/help" className="hover:text-gray-300 transition-colors">Help</Link>
          <Link to="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
          <span>© 2026 CopyZap</span>
        </div>
        <SocialShare className="justify-center" />
      </div>
      <div className="mt-6 pt-6 border-t border-gray-800 text-center">
        <p className="text-xs text-gray-600">
          Powered by{' '}
          <a href="https://sharpen.studio/en/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400 transition-colors">
            Sharpen.Studio
          </a>
        </p>
      </div>
    </Container>
  </footer>
);

// ─── PAGE ─────────────────────────────────────────────────────────────────────

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Nav />
      <main>
        <Hero />
        <ProblemReframe />
        <WhyToolsFail />
        <HowItWorks />
        <ScoringSection />
        <UseCases />
        <Benefits />
        <ComparisonTable />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
