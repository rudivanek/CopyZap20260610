import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Target, BarChart3, Database, Lightbulb, ArrowRight, CheckCircle } from 'lucide-react';
import SocialShare from './SocialShare';
import BetaRegistrationModal from './BetaRegistrationModal';
import PublicFooter from './PublicFooter';

const HomePage: React.FC = () => {
  const [isBetaModalOpen, setIsBetaModalOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-black dark:via-gray-900 dark:to-gray-950">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-50/20 to-gray-100/20 dark:from-transparent dark:via-gray-900/20 dark:to-gray-800/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Elevate Your Marketing with{' '}
              <span style={{ color: '#ff6b35' }}>CopyZap</span>
            </h1>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
              AI-Powered Copy That Converts
            </h2>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Harness advanced AI models like DeepSeek V3 and GPT-4o to generate, refine, and score high-quality copy. 
              Create dynamic variations, apply iconic voice styles, and optimize for your audience—in minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setIsBetaModalOpen(true)}
                className="inline-flex items-center bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-bold py-4 px-8 text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border border-gray-300 dark:border-gray-700"
              >
                <Zap size={24} className="mr-3" />
                Register for Beta
              </button>
              <Link
                to="/copy-maker"
                className="inline-flex items-center bg-gray-600 hover:bg-gray-500 text-white font-bold py-4 px-8 text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Sparkles size={24} className="mr-3" />
                Login to Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Video Tutorial Section */}
      <section className="py-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="w-full max-w-[700px] rounded-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
            <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
              <iframe
                src="https://player.vimeo.com/video/1136200760?badge=0&autopause=0&player_id=0&app_id=58479"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                title="CopyZap: AI Marketing Copy Generator & Writing Tool"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features for Superior Copy Creation
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Feature Card 1 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center mb-4">
                <Zap className="h-8 w-8 text-primary-500 mr-3" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Copy Maker – Your Flexible Workflow Hub</h3>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Generate fresh copy with dynamic cards for on-demand alternatives, voice styles (e.g., Steve Jobs or Seth Godin), 
                and headlines. Full control over tones, languages, and structures.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center mb-4">
                <Target className="h-8 w-8 text-primary-500 mr-3" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Improve Existing Copy</h3>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Paste your content and let AI enhance it for clarity, persuasiveness, and SEO. Add target audience details, 
                key messages, and competitor analysis for targeted refinements.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-8 w-8 text-primary-500 mr-3" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Advanced Customizations</h3>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Fine-tune with pro mode options: funnel stages, pain points, keyword integration, and output structures. 
                Use AI suggestions for quick field population.
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-8 w-8 text-primary-500 mr-3" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Content Scoring & Insights</h3>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Get color-coded scores (0-100) on clarity, engagement, and more, with improvement suggestions. 
                Compare versions side-by-side for optimal results.
              </p>
            </div>

            {/* Feature Card 5 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center mb-4">
                <Database className="h-8 w-8 text-primary-500 mr-3" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Templates & Dashboard</h3>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Save configurations as templates for consistency. Track sessions, outputs, and credits usage
                in your personalized dashboard.
              </p>
            </div>

            {/* Feature Card 6 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center mb-4">
                <Lightbulb className="h-8 w-8 text-primary-500 mr-3" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">SEO & Enhancement Options</h3>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Generate comprehensive SEO metadata including URL slugs, meta descriptions, headings, and Open Graph tags. 
                Add alternatives, strict word counts, or emotional tones to evoke the right response.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Getting Started */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              How to Get Started with CopyZap
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold mr-4 mb-4 sm:mb-0">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Quick Setup</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Provide your business description, target audience, and key message. Use suggestion buttons
                    for AI-powered ideas on fields like calls to action or brand values.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold mr-4 mb-4 sm:mb-0">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Generate & Enhance</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Create new copy or improve existing ones with optional features like voice styles and scoring.
                    Evaluate inputs first for feedback and better prompts.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold mr-4 mb-4 sm:mb-0">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Review & Manage</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    View threaded outputs with visual hierarchies, export as Markdown or text, and save templates
                    for future use. Pro tip: Add competitor copy for comparative boosts.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Why Users Love CopyZap
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-primary-500 mr-4 mt-1 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Save time with dynamic on-demand generation</strong>—no need to regenerate everything for variations.
                </p>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-primary-500 mr-4 mt-1 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Achieve brand consistency</strong> using templates and voice styles modeled after icons like David Ogilvy.
                </p>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-primary-500 mr-4 mt-1 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Optimize for results:</strong> Detailed scores and suggestions ensure persuasive, engaging copy.
                </p>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-primary-500 mr-4 mt-1 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Pro mode unlocks granular control,</strong> like funnel stage targeting and language constraints.
                </p>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-primary-500 mr-4 mt-1 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Track everything in the dashboard,</strong> from credits consumption to saved sessions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-black border-t border-gray-300 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-6 sm:space-y-0">
            {/* Social Share Buttons */}
            <div className="order-1 sm:order-2">
              <SocialShare className="justify-center sm:justify-end" />
            </div>
            
            {/* Navigation Links */}
            <div className="flex items-center space-x-6">
              <Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
                Privacy
              </Link>
            </div>
            
            {/* Copyright */}
            <div className="text-gray-600 dark:text-gray-400">
              © 2025 CopyZap
            </div>
          </div>
          
          <div className="text-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Website and App - powered by <a href="https://sharpen.studio" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-400 underline">Sharpen.Studio</a>
            </p>
          </div>

          <PublicFooter />
        </div>
      </footer>
      
      {/* Beta Registration Modal */}
      <BetaRegistrationModal
        isOpen={isBetaModalOpen}
        onClose={() => setIsBetaModalOpen(false)}
      />
    </div>
  );
};

export default HomePage;