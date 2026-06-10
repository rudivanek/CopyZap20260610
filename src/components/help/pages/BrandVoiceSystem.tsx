import React from 'react';
import HelpLayout from '../HelpLayout';
import { Users, Mic, Database, Wand2, Globe, FileCode, FileText, Settings } from 'lucide-react';

const BrandVoiceSystem: React.FC = () => {
  return (
    <HelpLayout
      title="Brand Voice System – Complete User Guide"
      breadcrumbs={[
        { label: 'Brand Voice System – Complete User Guide' }
      ]}
    >
      {/* Overview */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Overview
        </h2>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-6 mb-6">
          <p className="text-gray-900 dark:text-white font-semibold mb-2">
            What is the Brand Voice System?
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            The Brand Voice System allows you to <strong>define, store, and automatically apply a brand's unique writing style</strong> across all AI-generated content. It ensures consistency in tone, personality, vocabulary, sentence structure, punctuation rules, and call-to-action styles.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Why Use Brand Voices?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              <strong>Problem</strong>: Maintaining consistent brand voice manually is time-consuming and error-prone. Different team members might interpret brand guidelines differently.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Solution</strong>: The Brand Voice System acts as a centralized, AI-enforceable brand style guide that automatically injects brand rules into every AI generation request.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Key Capabilities</h4>
              <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>Manual entry of brand parameters</li>
                <li>AI generation from description</li>
                <li>AI analysis from pasted copy</li>
                <li>URL scanning to extract brand voice</li>
                <li>Pre-configured presets</li>
              </ul>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Granular Control</h4>
              <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>Personality traits & tone style</li>
                <li>Preferred vocabulary & forbidden terms</li>
                <li>CTA style preferences</li>
                <li>Punctuation rules (Oxford comma, contractions)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Management Foundation */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Users className="text-blue-600 dark:text-blue-400" size={28} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Step 1: Customer Management (Foundation)
          </h2>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4 mb-6">
          <p className="text-gray-900 dark:text-white font-semibold mb-1">⚠️ Important</p>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Before creating brand voices, you must first create a <strong>Customer</strong>. Each brand voice is tied to a specific customer/client.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Creating a Customer
            </h3>
            <ol className="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Navigate to <strong>Dashboard → Customers</strong></li>
              <li>Click <strong>"Add New Customer"</strong></li>
              <li>Enter customer name (required) and optional description</li>
              <li>Click <strong>"Save"</strong></li>
            </ol>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Customer Actions</h4>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Add</p>
                <p className="text-gray-600 dark:text-gray-400">Create new customer with name & description</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Edit</p>
                <p className="text-gray-600 dark:text-gray-400">Update customer name or description inline</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Delete</p>
                <p className="text-gray-600 dark:text-gray-400">Remove customer (cascades to brand voices)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Creating Brand Voices */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Mic className="text-purple-600 dark:text-purple-400" size={28} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Step 2: Creating Brand Voices
          </h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Method 1: Manual Entry
            </h3>
            <ol className="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
              <li>Go to <strong>Manage Customers → Select Customer → View Details</strong></li>
              <li>Click <strong>"Add Brand Voice"</strong></li>
              <li>Switch to <strong>"Manual"</strong> tab</li>
              <li>Fill in all fields:
                <ul className="list-disc ml-5 mt-1 space-y-1 text-sm">
                  <li><strong>Name</strong>: "Main Brand Voice"</li>
                  <li><strong>Description</strong>: Brief summary</li>
                  <li><strong>Personality Traits</strong>: friendly, professional, innovative</li>
                  <li><strong>Tone Style</strong>: conversational-warm</li>
                  <li><strong>Sentence Style</strong>: clear-concise</li>
                  <li><strong>Preferred Vocabulary</strong>: Words to use</li>
                  <li><strong>Forbidden Terms</strong>: Words to avoid</li>
                  <li><strong>CTA Style</strong>: direct-action, friendly-invitation, etc.</li>
                  <li><strong>Punctuation Rules</strong>: Oxford comma, contractions, max sentence length</li>
                </ul>
              </li>
              <li>Click <strong>"Save Brand Voice"</strong></li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Wand2 size={20} />
              Method 2: AI Generation from Description
            </h3>
            <ol className="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
              <li>Click <strong>"Add Brand Voice"</strong></li>
              <li>Stay on <strong>"AI Generate"</strong> tab</li>
              <li>Enter:
                <ul className="list-disc ml-5 mt-1 space-y-1 text-sm">
                  <li><strong>Brand Voice Name</strong> (e.g., "Tech Startup Voice")</li>
                  <li><strong>Brand Description</strong> (1-2 sentences about the brand)</li>
                  <li><strong>Sample Text</strong> (optional - helps AI understand style)</li>
                </ul>
              </li>
              <li>Click <strong>"Generate Brand Voice"</strong></li>
              <li>Review AI-generated fields (all populated automatically)</li>
              <li>Edit any field manually if needed</li>
              <li>Click <strong>"Save Brand Voice"</strong></li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FileText size={20} />
              Method 3: Paste Copy (AI Analysis From Text)
            </h3>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4 mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Note:</strong> You can also use the <strong>"Save as Brand Voice"</strong> button directly from generated copy output to automatically populate this field. See the <a href="#save-output-as-brand-voice" className="text-blue-600 dark:text-blue-400 underline">Save Output as Brand Voice</a> section below for the automated workflow.
              </p>
            </div>

            <ol className="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
              <li>Click <strong>"Add Brand Voice"</strong></li>
              <li>Stay on <strong>"AI Generate"</strong> tab</li>
              <li>Scroll to <strong>"Option 2: Paste Any Copy"</strong></li>
              <li>Manually paste text content from any source:
                <ul className="list-disc ml-5 mt-1 space-y-1 text-sm">
                  <li>Website paragraphs or blog posts</li>
                  <li>PDF documents or brochures</li>
                  <li>Email content</li>
                  <li>Social media captions or posts</li>
                  <li>Marketing materials</li>
                  <li>Any long-form content (minimum 100 characters)</li>
                </ul>
              </li>
              <li>Click <strong>"Analyze & Generate Brand Voice"</strong></li>
              <li>AI analyzes:
                <ul className="list-disc ml-5 mt-1 space-y-1 text-sm">
                  <li>Tone and personality traits</li>
                  <li>Vocabulary and word choice</li>
                  <li>Sentence structure and rhythm</li>
                  <li>Punctuation patterns</li>
                  <li>CTA style and approach</li>
                </ul>
              </li>
              <li>All fields auto-populate with analyzed values</li>
              <li>Review and edit if needed</li>
              <li>Click <strong>"Save Brand Voice"</strong></li>
            </ol>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4 mt-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                💡 Example Use Case
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Paste any text here and AI will automatically detect tone, style, vocabulary, CTA patterns, and writing rhythm.
              </p>
              <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded p-3 text-xs italic text-gray-700 dark:text-gray-300">
                "At EcoHome, we believe in sustainable living without compromise. Our handcrafted furniture pieces tell a story—each one made from reclaimed wood sourced from local mills. We don't just sell furniture; we create heirlooms that honor the planet while bringing warmth and character to your space."
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                AI will extract: warm tone, sustainable vocabulary, storytelling style, consultative CTA approach, and specific punctuation preferences.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4 mt-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>How Paste Copy Analysis Works:</strong>
              </p>
              <ul className="list-disc ml-5 mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <li>Accepts up to 10,000 characters (minimum 100 characters)</li>
                <li>No preprocessing needed—paste raw text directly</li>
                <li>Sends content to GPT-4o for deep brand voice analysis</li>
                <li>AI identifies writing patterns, personality, and style rules</li>
                <li>Returns structured JSON with all brand voice fields populated</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Globe size={20} />
              Method 4: URL Scanning (Website Analysis)
            </h3>
            <ol className="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
              <li>Click <strong>"Add Brand Voice"</strong></li>
              <li>Scroll to <strong>"Option 3: Scan Website for Brand Voice"</strong></li>
              <li>Enter <strong>Website URL</strong> (e.g., https://example.com)</li>
              <li>Click <strong>"Scan & Generate Brand Voice"</strong></li>
              <li>System fetches website content via Edge Function</li>
              <li>AI analyzes content and extracts brand voice parameters</li>
              <li>All fields auto-populate with extracted values</li>
              <li>Review and edit if needed</li>
              <li>Click <strong>"Save Brand Voice"</strong></li>
            </ol>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4 mt-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>How URL Scanning Works:</strong>
              </p>
              <ul className="list-disc ml-5 mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <li>Edge function fetches HTML from homepage and about page</li>
                <li>Removes scripts, styles, nav, footer</li>
                <li>Extracts clean text content (limited to 6000 chars)</li>
                <li>Sends to GPT-4o for brand voice analysis</li>
                <li>Returns structured JSON with all brand voice fields</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Method 5: Using Presets
            </h3>
            <ol className="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Click <strong>"Add Brand Voice"</strong></li>
              <li>Switch to <strong>"Use Preset"</strong> tab</li>
              <li>Select from 6 available presets:
                <ul className="list-disc ml-5 mt-1 space-y-1 text-sm">
                  <li><strong>Professional & Authoritative</strong> - For established businesses, B2B services, consulting firms</li>
                  <li><strong>Friendly & Conversational</strong> - For community-focused brands, service businesses</li>
                  <li><strong>Bold & Energetic</strong> - For SaaS companies, tech startups, innovation-focused brands</li>
                  <li><strong>Minimalist & Clear</strong> - For design-focused brands, tech products, modern services</li>
                  <li><strong>Creative & Playful</strong> - For creative agencies, lifestyle brands, youth-focused products</li>
                  <li><strong>Persuasive & Urgent</strong> - For e-commerce, online stores, product-focused businesses</li>
                </ul>
              </li>
              <li>All fields auto-populate with preset values</li>
              <li>Customize if needed</li>
              <li>Save</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Save Output as Brand Voice */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="text-orange-600 dark:text-orange-400" size={28} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ⭐ Save Output as Brand Voice (New Feature)
          </h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              What This Feature Does
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              This feature allows users to <strong>instantly create a new Brand Voice profile directly from any generated AI output</strong>. If the generated copy matches the ideal brand tone, the user can save it as a reusable Brand Voice linked to a customer.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              How It Works
            </h3>
            <ol className="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Generate copy using <strong>CopyMaker</strong> or <strong>Quick Prompt Wizard</strong></li>
              <li>Click <strong>"Save as Brand Voice"</strong> in the output toolbar</li>
              <li>The Brand Voice modal opens automatically</li>
              <li>User selects a <strong>customer</strong> (required)</li>
              <li>The <strong>"Paste Copy"</strong> field is automatically filled with the generated output</li>
              <li>User clicks <strong>"Analyze & Generate Brand Voice"</strong></li>
              <li>AI analyzes the text and extracts:
                <ul className="list-disc ml-5 mt-1 space-y-1 text-sm">
                  <li>Personality traits</li>
                  <li>Tone style</li>
                  <li>Sentence rhythm</li>
                  <li>Preferred vocabulary</li>
                  <li>Forbidden terms</li>
                  <li>CTA style</li>
                  <li>Punctuation rules</li>
                </ul>
              </li>
              <li>User reviews and optionally edits the generated fields</li>
              <li>User saves → Brand Voice is stored in <code>pmc_public_brand_voices</code> for the selected customer</li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Why This Is Useful</h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>✓ Turns great generated copy into a persistent brand identity</li>
              <li>✓ Adds a reverse-engineering workflow to Brand Voice creation</li>
              <li>✓ Saves users time (they don't need to manually paste anything)</li>
              <li>✓ Helps agencies quickly establish and reuse consistent voices for clients</li>
              <li>✓ Makes future copy generation faster, more accurate, and more on-brand</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">📝 Notes</p>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>• This feature uses the same AI extraction method as "Paste Copy," but automated</li>
              <li>• Customer selection is required before saving</li>
              <li>• Saving does not overwrite existing brand voices unless user updates them manually</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Advanced Brand Voice Style Controls */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="text-teal-600 dark:text-teal-400" size={28} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Advanced Brand Voice Style Controls
          </h2>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Optional but Powerful</strong>: Advanced Style Controls provide fine-grained control over sentence structure, formality, emotional tone, vocabulary complexity, and more. These settings are completely optional but give you precise control over the AI's writing style.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Available Controls
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Sentence & Structure</h4>
                <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li><strong>Sentence Length</strong>: short, medium, long, varied</li>
                  <li><strong>Rhythm</strong>: staccato, smooth, energetic, calm</li>
                  <li><strong>Content Structure</strong>: short paragraphs, bullets, questions</li>
                </ul>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Tone & Voice</h4>
                <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li><strong>Formality</strong>: 1-5 scale (casual to ultra formal)</li>
                  <li><strong>Emotional Tone</strong>: warm, friendly, serious, etc.</li>
                  <li><strong>Persona</strong>: mentor, friend, expert, storyteller, etc.</li>
                </ul>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Language & Style</h4>
                <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li><strong>Point of View</strong>: first, second, third person, brand voice</li>
                  <li><strong>Figurative Level</strong>: literal, balanced, metaphorical</li>
                  <li><strong>Vocabulary</strong>: simple to highly intellectual</li>
                </ul>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Detail & Elements</h4>
                <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li><strong>Detail Depth</strong>: minimal, balanced, detailed, highly explanatory</li>
                  <li><strong>Allowed Elements</strong>: questions, bullets, analogies</li>
                  <li><strong>Forbidden Elements</strong>: emojis, slang, ALL CAPS</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              How They Affect Generation
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              When a Brand Voice with Advanced Style Controls is selected, these rules are passed to the AI model alongside the basic brand voice settings. This ensures every piece of content follows the same micro-style — sentence structure, tone, formality, vocabulary level, and content patterns.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              The AI receives explicit instructions for each configured control, making it follow strict style guidelines automatically without manual editing.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">When to Use Advanced Controls</h4>
            <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li><strong>Agencies managing multiple brands</strong> with very specific style requirements</li>
              <li><strong>Brands with strict tone/style guidelines</strong> that must be followed precisely</li>
              <li><strong>High-stakes content</strong> like websites, proposals, legal copy, or investor materials</li>
              <li><strong>Consistent multi-channel campaigns</strong> requiring identical voice across all touchpoints</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Accessing Advanced Controls
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              When creating or editing a Brand Voice, expand the <strong>"Advanced Style Controls (Optional)"</strong> section to configure these settings. All controls are optional — only set the ones that matter for your brand.
            </p>
          </div>
        </div>
      </section>

      {/* Database Structure */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Database className="text-green-600 dark:text-green-400" size={28} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Database Structure
          </h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Tables
            </h3>

            <div className="space-y-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">pmc_customers</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Stores customer/client information
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-xs font-mono overflow-x-auto">
                  <pre className="text-gray-800 dark:text-gray-200">
{`id              uuid PRIMARY KEY
name            text NOT NULL
description     text
user_id         uuid → pmc_users(id)
created_at      timestamptz`}
                  </pre>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">pmc_public_brand_voices</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Stores brand voice configurations
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-xs font-mono overflow-x-auto">
                  <pre className="text-gray-800 dark:text-gray-200">
{`id                    uuid PRIMARY KEY
customer_id           uuid → pmc_customers(id) ON DELETE CASCADE
owner_user_id         uuid → pmc_users(id) ON DELETE SET NULL
name                  text NOT NULL
description           text
personality_traits    text[]
tone_style            text
sentence_style        text
preferred_vocabulary  text[]
forbidden_terms       text[]
cta_style             text
punctuation_rules     jsonb
created_at            timestamptz
updated_at            timestamptz`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Relationships
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-4">
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li><strong>Customer → Brand Voices</strong>: One-to-Many (customer can have multiple brand voices)</li>
                <li><strong>ON DELETE CASCADE</strong>: Deleting a customer deletes all their brand voices</li>
                <li><strong>Template → Brand Voice</strong>: Optional reference (templates can save brand voice ID)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Using Brand Voices */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <FileCode className="text-indigo-600 dark:text-indigo-400" size={28} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Using Brand Voices in Copy Generation
          </h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Workflow
            </h3>
            <ol className="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Navigate to <strong>Copy Maker</strong></li>
              <li>Select a <strong>Customer</strong> from dropdown</li>
              <li>Brand Voice dropdown appears automatically</li>
              <li>Select your saved brand voice</li>
              <li>Fill in other copy generation fields</li>
              <li>Click <strong>"Generate Copy"</strong></li>
            </ol>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">
              How It Works Behind the Scenes
            </p>
            <ol className="list-decimal ml-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>System fetches brand voice from database</li>
              <li>Injects all brand voice parameters into system prompt</li>
              <li>AI receives explicit instructions on:
                <ul className="list-disc ml-5 mt-1 space-y-1 text-xs">
                  <li>Personality traits to embody</li>
                  <li>Tone and sentence style to use</li>
                  <li>Vocabulary to prefer and terms to avoid</li>
                  <li>CTA style and punctuation rules</li>
                </ul>
              </li>
              <li>Generated copy strictly adheres to brand voice</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Output Differences
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">Without Brand Voice</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                  "Get Fresh Organic Food Delivered Fast. Tired of grocery shopping? We bring farm-fresh organic produce straight to your door! Order today and get 20% off!"
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Generic, promotional, discount-focused
                </p>
              </div>
              <div className="border border-green-200 dark:border-green-700 rounded p-4 bg-green-50 dark:bg-green-900/10">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">With Brand Voice (Eco-Friendly)</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                  "Nourish your family with the season's freshest organic harvest, delivered right to your doorstep. We partner with local farms to bring you sustainably grown fruits and vegetables."
                </p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                  Warm, sustainable, community-focused
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editing and Managing */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Editing and Managing Brand Voices
        </h2>

        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Editing</h3>
            <ol className="list-decimal ml-6 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>Click <strong>Edit (pencil icon)</strong> on a brand voice card</li>
              <li>Modal opens with all fields pre-filled</li>
              <li>Modify any field</li>
              <li>Click <strong>"Save Changes"</strong></li>
            </ol>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Special feature: <strong>"Regenerate with AI"</strong> button allows re-generating from scratch
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Deleting</h3>
            <ol className="list-decimal ml-6 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>Click <strong>Delete (trash icon)</strong> on a brand voice card</li>
              <li>Confirm deletion in browser dialog</li>
              <li>Brand voice is permanently removed</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Template Integration */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Template Integration
        </h2>

        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Templates can save and restore brand voice selections for consistent workflows.
        </p>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded p-4">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">How It Works</p>
          <ol className="list-decimal ml-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>Configure Copy Maker with customer + brand voice selected</li>
            <li>Click <strong>"Save as Template"</strong></li>
            <li>Template stores:
              <ul className="list-disc ml-5 mt-1 space-y-1 text-xs">
                <li>Customer ID</li>
                <li>Brand Voice ID</li>
                <li>All other form settings</li>
              </ul>
            </li>
            <li>When loading template:
              <ul className="list-disc ml-5 mt-1 space-y-1 text-xs">
                <li>Customer auto-selects</li>
                <li>Brand Voice auto-selects</li>
                <li>All fields populate</li>
              </ul>
            </li>
          </ol>
        </div>
      </section>

      {/* Complete Example */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Complete End-to-End Example
        </h2>

        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Scenario: Organic Food Delivery Service</h3>

            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">1. Create Customer</p>
                <p className="text-gray-600 dark:text-gray-400 ml-4">
                  Name: "GreenLeaf Organics"<br />
                  Description: "Organic food delivery service"
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">2. Add Brand Voice (Manual)</p>
                <div className="ml-4 text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Name: "GreenLeaf Main Voice"</p>
                  <p>Personality: caring, fresh, sustainable, knowledgeable</p>
                  <p>Tone: conversational-friendly</p>
                  <p>Preferred vocabulary: fresh, organic, local, seasonal, harvest</p>
                  <p>Forbidden terms: cheap, processed, artificial</p>
                  <p>CTA style: friendly-invitation</p>
                </div>
              </div>

              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">3. Generate Copy</p>
                <div className="ml-4 text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Select customer: GreenLeaf Organics</p>
                  <p>Select brand voice: GreenLeaf Main Voice</p>
                  <p>Request: "Homepage hero section"</p>
                </div>
              </div>

              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">4. Result</p>
                <div className="ml-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 text-xs italic text-gray-700 dark:text-gray-300">
                  "Nourish your family with the season's freshest organic harvest, delivered right to your doorstep. We partner with local farms to bring you sustainably grown fruits, vegetables, and wholesome ingredients that you'll feel great about serving."
                </div>
                <p className="ml-4 mt-2 text-xs text-green-600 dark:text-green-400">
                  ✓ Uses preferred vocabulary (nourish, fresh, organic, seasonal, local)<br />
                  ✓ Avoids forbidden terms<br />
                  ✓ Friendly-invitation CTA style<br />
                  ✓ Conversational-warm tone
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Troubleshooting */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Quick Troubleshooting
        </h2>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Common Issues & Solutions</h3>
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">Issue: Brand Voice Not Applied</p>
              <p><strong>Solution:</strong> Ensure Brand Voice toggle is ON in Copy Maker. Check that you've selected both Customer and Brand Voice from dropdowns.</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">Issue: Output Ignores Brand Voice Instructions</p>
              <p><strong>Solution:</strong> Check for conflicting instructions in Special Instructions field. Brand voice can be overridden by explicit contradictory prompts.</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">Issue: Brand Voice Too Generic</p>
              <p><strong>Solution:</strong> Add more specific vocabulary preferences, forbidden terms, and personality traits. Use 4-6 traits minimum for best results.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          <details className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">What is a Brand Voice?</summary>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">A Brand Voice is a saved configuration that defines how AI should write for a specific brand. It includes personality traits, tone, preferred vocabulary, forbidden terms, CTA style, and punctuation rules.</p>
          </details>

          <details className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">How many brand voices can I create?</summary>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">There's no limit. You can create unlimited brand voices across unlimited customers. Many users create multiple voices per customer (e.g., "Website Voice," "Social Media Voice," "Email Voice").</p>
          </details>

          <details className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">What's the difference between Tone and Brand Voice?</summary>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Tone is just one component of Brand Voice. Brand Voice includes tone plus personality traits, vocabulary preferences, sentence style, CTA approach, punctuation rules, and advanced style controls.</p>
          </details>

          <details className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">When should I use presets vs. custom brand voices?</summary>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Use presets for quick starts or testing. Use custom brand voices for established brands with specific style guidelines. You can start with a preset and customize it.</p>
          </details>

          <details className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">How does "Save as Brand Voice" work?</summary>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">After generating copy you love, click "Save as Brand Voice" in the output toolbar. The generated text is automatically analyzed by AI to extract tone, style, vocabulary, and personality traits, which are saved as a new brand voice.</p>
          </details>

          <details className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">Will brand voice affect SEO metadata generation?</summary>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Yes, when SEO Metadata is enabled, brand voice influences meta descriptions, title tags, and headlines to maintain consistent brand tone across all outputs.</p>
          </details>

          <details className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">Why does output sometimes ignore my brand voice?</summary>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Check for conflicting instructions in Special Instructions or Output Structure fields. Explicit prompts override brand voice. Also verify the brand voice toggle is ON.</p>
          </details>

          <details className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">Can I A/B test different brand voices?</summary>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Yes! Create multiple brand voices for the same customer, generate copy with each, then use the Compare & Blend tool to evaluate which performs better.</p>
          </details>
        </div>
      </section>

      {/* Best Practices */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Best Practices
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-green-700 dark:text-green-400">✓ Do</h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Create separate brand voices for different campaigns</li>
              <li>• Use URL scanning for quick setup from existing websites</li>
              <li>• Test brand voices with different content types</li>
              <li>• Save successful configs as templates</li>
              <li>• Include 4-6 personality traits for best results</li>
              <li>• Specify both preferred and forbidden vocabulary</li>
            </ul>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-red-700 dark:text-red-400">✗ Don't</h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Use conflicting personality traits (e.g., formal + casual)</li>
              <li>• Leave preferred vocabulary empty (AI has no guidance)</li>
              <li>• Create overly restrictive forbidden terms lists</li>
              <li>• Skip testing - verify brand voice works as expected</li>
              <li>• Forget to update brand voices when brand evolves</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Related Documentation
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <a href="/help/templates-saved" target="_blank" rel="noopener noreferrer" className="border border-gray-200 dark:border-gray-700 rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Templates</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Learn how to save and reuse brand voice configurations</p>
          </a>
          <a href="/help/getting-started" target="_blank" rel="noopener noreferrer" className="border border-gray-200 dark:border-gray-700 rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Copy Maker</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Master the Copy Maker workspace and workflows</p>
          </a>
        </div>
      </section>

      {/* Link to Full Documentation */}
      <section className="mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">📚 Looking for More Detail?</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            This Help Center page provides a streamlined overview of the Brand Voice System. For comprehensive technical documentation, advanced examples, detailed field explanations, and complete troubleshooting guides, see the full documentation.
          </p>
          <a
            href="https://github.com/yourusername/copyzap/blob/main/help/brand-voice-user-guide.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
          >
            View Complete Brand Voice User Guide →
          </a>
        </div>
      </section>
    </HelpLayout>
  );
};

export default BrandVoiceSystem;
