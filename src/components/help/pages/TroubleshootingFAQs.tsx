import React from 'react';
import { Link } from 'react-router-dom';
import HelpLayout from '../HelpLayout';

const TroubleshootingFAQs: React.FC = () => {
  return (
    <HelpLayout
      title="Common Mistakes & Troubleshooting"
      breadcrumbs={[{ label: 'Troubleshooting' }]}
    >
      <div className="not-prose bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Quick Fixes</p>
        <p className="text-gray-700 dark:text-gray-300">Most problems come from overusing features or providing conflicting instructions. When in doubt: simplify, be specific, and generate alternatives.</p>
      </div>

      <h2>Common Mistake #1: Vague Business Description</h2>

      <div className="not-prose bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
        <p className="font-bold text-red-900 dark:text-red-100 mb-2">❌ Wrong:</p>
        <p className="text-gray-700 dark:text-gray-300">"We help businesses grow."</p>
      </div>

      <div className="not-prose bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
        <p className="font-bold text-green-900 dark:text-green-100 mb-2">✅ Right:</p>
        <p className="text-gray-700 dark:text-gray-300">"We help B2B SaaS companies reduce customer churn by 40% through automated onboarding workflows and proactive customer success alerts. Our platform integrates with Salesforce, HubSpot, and Intercom."</p>
      </div>

      <p><strong>Why this matters:</strong> AI needs context. Specific inputs = specific outputs. Generic inputs = generic outputs.</p>

      <p><strong>What to include:</strong></p>
      <ul>
        <li>Who you serve (be specific about industry, role, company size)</li>
        <li>What problem you solve (quantify if possible)</li>
        <li>How you solve it (your approach/method)</li>
        <li>What makes you different (key differentiators)</li>
      </ul>

      <h2>Common Mistake #2: Enabling All Optional Features</h2>

      <p>New users often enable every toggle thinking it improves results. It doesn't.</p>

      <div className="not-prose bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <p className="font-bold text-yellow-900 dark:text-yellow-100 mb-2">⚠️ What Happens:</p>
        <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
          <li><strong>Generate SEO Metadata:</strong> Adds extra processing time (use only when you need SEO elements)</li>
          <li><strong>Generate Scores:</strong> Adds extra API call (use sparingly for evaluation, not every generation)</li>
          <li><strong>Prioritize Word Count:</strong> Strict mode can sacrifice quality for precision (use only when exact length matters)</li>
          <li><strong>Force Keyword Integration:</strong> Can make copy feel unnatural if overused</li>
          <li><strong>Force Elaborations & Examples:</strong> Adds fluff to hit word count (use only for educational content)</li>
        </ul>
      </div>

      <p><strong>Solution:</strong> Start with no optional features. Generate. If output is good, you're done. Add features only when you need them.</p>

      <h2>Common Mistake #3: Conflicting Instructions</h2>

      <p>Telling the AI to do contradictory things produces confused output.</p>

      <div className="not-prose bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <p className="font-bold text-red-900 dark:text-red-100 mb-2">❌ Conflicting Example:</p>
        <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300">
          <li>Tone: "Professional"</li>
          <li>Language Style Constraints: "Avoid jargon, Simple vocabulary"</li>
          <li>Special Instructions: "Use industry-specific technical terminology"</li>
          <li>Word Count: Short (50-100 words)</li>
          <li>Force Elaborations & Examples: Enabled</li>
        </ul>
      </div>

      <p><strong>Why this fails:</strong> Can't be professional AND simple. Can't elaborate AND be short. Can't avoid jargon AND use technical terms.</p>

      <p><strong>Solution:</strong> Pick one direction and stick to it. If you want professional tone, don't force simple vocabulary.</p>

      <h2>Common Mistake #4: Not Using Target Audience</h2>

      <p>This single field has massive impact. Skipping it is the #1 missed opportunity.</p>

      <div className="not-prose bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
        <p className="font-bold text-green-900 dark:text-green-100 mb-2">Example Impact:</p>
        <p className="text-gray-700 dark:text-gray-300 mb-3"><strong>Without Target Audience:</strong> "Our software saves time and increases efficiency."</p>
        <p className="text-gray-700 dark:text-gray-300"><strong>With Target Audience = "busy CFOs at mid-market companies":</strong> "Free up 15 hours per month that you're currently spending on manual financial reporting. Get board-ready reports in minutes, not days."</p>
      </div>

      <p><strong>Be specific:</strong></p>
      <ul>
        <li>✅ "E-commerce founders doing $100K-$500K/month who struggle with inventory management"</li>
        <li>❌ "Business owners"</li>
      </ul>

      <h2>Common Mistake #5: Expecting First Output to Be Perfect</h2>

      <p>Copy Maker is a tool, not magic. Professional copywriters iterate. You should too.</p>

      <div className="not-prose bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <p className="font-bold text-blue-900 dark:text-blue-100 mb-2">Professional Workflow:</p>
        <ol className="list-decimal ml-6 text-gray-700 dark:text-gray-300 space-y-1">
          <li>Generate first version</li>
          <li>Read it critically</li>
          <li>Generate 2-3 alternatives</li>
          <li>Identify what works in each</li>
          <li>Use Compare & Blend to combine best parts</li>
          <li>Apply final polish</li>
        </ol>
      </div>

      <p><strong>Expectation calibration:</strong> Plan for 3-5 generations minimum for important copy.</p>

      <h2>Common Mistake #6: Skipping Key Fields for Complex Copy</h2>

      <p>For important projects, filling only the minimum required fields often produces generic output. The more context you provide, the better your results.</p>

      <div className="not-prose bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-700 dark:text-gray-300"><strong>Fields that most improve quality:</strong> Customer/Brand Voice, Target Audience, Pain Points, Industry/Niche, Output Structure</p>
        <p className="text-gray-700 dark:text-gray-300 mt-2"><strong>Result when skipped:</strong> Generic output without brand consistency or strategic positioning</p>
      </div>

      <p><strong>Solution:</strong> For important copy, fill in brand voice, target audience, and key message at minimum. Use the optional features section for SEO, scoring, and other enhancements.</p>

      <h2>Common Mistake #7: Not Saving Templates</h2>

      <p>Manually filling same fields repeatedly wastes time.</p>

      <p><strong>What to save as templates:</strong></p>
      <ul>
        <li>Product launch announcement (reuse for every launch)</li>
        <li>Newsletter format (reuse weekly)</li>
        <li>Landing page structure (reuse for new pages)</li>
        <li>Client-specific setup (Customer + Brand Voice + typical settings)</li>
      </ul>

      <p><strong>How:</strong> After successful generation, click "Save as Template", give it a name, select category. Next time, load template and only update content-specific fields.</p>

      <h2>Troubleshooting: Output Feels "Off"</h2>

      <div className="not-prose bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
        <h3 className="font-bold mb-4">If output is too generic:</h3>
        <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
          <li>→ Add Target Audience</li>
          <li>→ Be more specific in Business Description</li>
          <li>→ Add Target Audience Pain Points</li>
          <li>→ Include competitor differentiation</li>
        </ul>

        <h3 className="font-bold mb-4 mt-6">If output is too formal/stiff:</h3>
        <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
          <li>→ Change Tone to "Friendly" or "Creative"</li>
          <li>→ After generation, apply "Humanize" voice style</li>
          <li>→ Add to Special Instructions: "Write like you're talking to a friend"</li>
        </ul>

        <h3 className="font-bold mb-4 mt-6">If output is too casual:</h3>
        <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
          <li>→ Change Tone to "Professional"</li>
          <li>→ In Language Style Constraints, select "Avoid contractions"</li>
          <li>→ Apply "Professional Expert" voice style after generation</li>
        </ul>

        <h3 className="font-bold mb-4 mt-6">If output is wrong length:</h3>
        <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
          <li>→ System automatically revises if dramatically outside range</li>
          <li>→ Enable "Prioritize Word Count" for strict adherence</li>
          <li>→ If still off, use Modify Content with instruction "Make this exactly X words"</li>
        </ul>

        <h3 className="font-bold mb-4 mt-6">If output uses forbidden terms:</h3>
        <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
          <li>→ Add to Excluded Terms field</li>
          <li>→ If using Brand Voice, add to Forbidden Terms in brand voice settings</li>
          <li>→ Use Modify Content: "Remove all instances of [term] and replace with [alternative]"</li>
        </ul>
      </div>

      <h2>Troubleshooting: Technical Issues</h2>

      <h3>Generation Takes Too Long</h3>
      <ul>
        <li><strong>Cause:</strong> Optional features (SEO, Scores, GEO) add separate API calls</li>
        <li><strong>Solution:</strong> Disable features you don't need. Generate plain copy first, add extras on-demand later</li>
      </ul>

      <h3>Word Count Accuracy Low</h3>
      <ul>
        <li><strong>Understanding:</strong> ±30% tolerance by default (quality over precision)</li>
        <li><strong>If you need exact length:</strong> Enable "Prioritize Word Count" toggle</li>
        <li><strong>Limitation:</strong> AI cannot guarantee exact word count without compromising quality</li>
      </ul>

      <h3>Brand Voice Not Applied Consistently</h3>
      <ul>
        <li><strong>Remember:</strong> Form inputs override brand voice</li>
        <li><strong>Check:</strong> Are you setting conflicting Tone or Special Instructions?</li>
        <li><strong>Solution:</strong> Let brand voice do its job. Don't override unless necessary</li>
      </ul>

      <h3>Template Missing Fields After Load</h3>
      <ul>
        <li><strong>Cause:</strong> Some template fields may not be immediately visible depending on your current form view</li>
        <li><strong>Solution:</strong> Scroll through the form to check all sections — fields saved in a template are always loaded even if they are not immediately visible</li>
      </ul>

      <h2>Understanding Limitations</h2>

      <div className="not-prose bg-gray-50 dark:bg-gray-900 border-l-4 border-blue-600 p-6 mb-6">
        <h3 className="font-bold mb-3">What CopyZap Does:</h3>
        <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
          <li>Generates marketing copy based on structured inputs</li>
          <li>Maintains consistent brand voice and style</li>
          <li>Creates multiple variations for comparison</li>
          <li>Applies proven copywriting frameworks</li>
        </ul>

        <h3 className="font-bold mb-3 mt-4">What CopyZap Does NOT Do:</h3>
        <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
          <li>Guarantee factual accuracy (AI can make up facts - always verify)</li>
          <li>Replace human review and editing</li>
          <li>Predict conversion performance (scores are quality assessments, not conversion guarantees)</li>
          <li>Perfectly enforce constraints (excluded terms, character limits are instructed but not validated)</li>
          <li>Understand your business better than you (quality input = quality output)</li>
        </ul>
      </div>

      <h2>When to Contact Support</h2>

      <p>Contact us if you experience:</p>
      <ul>
        <li>Persistent generation failures (after trying different models)</li>
        <li>Missing features or broken functionality</li>
        <li>Credits tracking discrepancies</li>
        <li>Account or billing issues</li>
        <li>Feature requests or bug reports</li>
      </ul>

      <p><strong>Before contacting:</strong></p>
      <ol>
        <li>Try switching AI model (model availability varies)</li>
        <li>Simplify your inputs (disable optional features)</li>
        <li>Generate alternatives (first output may just be off)</li>
        <li>Check this troubleshooting guide</li>
      </ol>

      <p><Link to="/help/contact" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">→ Contact Support</Link></p>

      <hr className="my-8" />
      <p className="text-sm text-gray-600 dark:text-gray-400">Last updated: 2025-12-20</p>
    </HelpLayout>
  );
};

export default TroubleshootingFAQs;
