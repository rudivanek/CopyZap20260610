import React from 'react';
import { Shield, Lock, Eye, Database, Mail, AlertCircle } from 'lucide-react';
import PublicFooter from './PublicFooter';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <Shield size={28} className="text-primary-500 mr-2" />
          <h1 className="text-3xl font-bold text-black dark:text-white">Privacy Policy</h1>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-300 dark:border-gray-800 p-8 space-y-8">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            <p><strong>Last Updated:</strong> January 2025</p>
            <p><strong>Effective Date:</strong> January 1, 2025</p>
          </div>

          <section>
            <div className="flex items-center mb-4">
              <Eye size={20} className="text-primary-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Information We Collect</h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Account Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email address and name when you create an account</li>
                <li>Authentication data managed securely through Supabase</li>
                <li>Profile preferences and settings</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Content and Usage Data</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Business descriptions, copy content, and marketing materials you input</li>
                <li>Generated copy results and saved outputs</li>
                <li>Templates and customer information you create</li>
                <li>API usage statistics and credit consumption data</li>
                <li>System logs for troubleshooting and performance optimization</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <Database size={20} className="text-primary-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How We Use Your Information</h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Core Services</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Generate and improve marketing copy using AI models</li>
                <li>Save and manage your templates, sessions, and outputs</li>
                <li>Provide content scoring and evaluation services</li>
                <li>Track usage for billing and service optimization</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Service Improvement</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Analyze usage patterns to improve our AI models and features</li>
                <li>Monitor system performance and reliability</li>
                <li>Develop new features based on user needs</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <Lock size={20} className="text-primary-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Security & Protection</h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Security Measures</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>All data is encrypted in transit using HTTPS/TLS protocols</li>
                <li>Database encryption at rest through Supabase infrastructure</li>
                <li>Row-level security (RLS) policies to protect user data</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls limiting data access to authorized personnel only</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">AI Processing</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your content is processed by third-party AI providers (OpenAI, DeepSeek)</li>
                <li>We do not store your content permanently with AI providers</li>
                <li>AI providers may temporarily process data according to their privacy policies</li>
                <li>We recommend reviewing OpenAI and DeepSeek privacy policies</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <Mail size={20} className="text-primary-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Sharing & Third Parties</h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>We <strong>do not sell</strong> your personal information to third parties. We only share data in these limited circumstances:</p>
              
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Service Providers</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Supabase:</strong> Database hosting and authentication services</li>
                <li><strong>OpenAI & DeepSeek:</strong> AI content generation processing</li>
                <li><strong>Hosting providers:</strong> Infrastructure and content delivery</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Legal Requirements</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>When required by law or legal process</li>
                <li>To protect our rights, property, or safety</li>
                <li>In connection with a business transfer or acquisition</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <AlertCircle size={20} className="text-primary-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Rights & Choices</h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Account Control</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and update your account information anytime</li>
                <li>Delete your templates, sessions, and saved outputs</li>
                <li>Export your data in standard formats</li>
                <li>Request account deletion and data removal</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Data Retention</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account data: Retained while your account is active</li>
                <li>Generated content: Stored until you delete it manually</li>
                <li>Usage logs: Retained for 12 months for analytics and billing</li>
                <li>Deleted data: Permanently removed within 30 days</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cookies & Tracking</h2>
              <p>We use minimal tracking technologies:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Essential cookies:</strong> For authentication and session management</li>
                <li><strong>Preference cookies:</strong> To remember your theme and mode settings</li>
                <li><strong>No advertising cookies:</strong> We do not use third-party advertising trackers</li>
                <li>You can disable cookies in your browser, but this may affect functionality</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Children's Privacy</h2>
              <p>
                CopyZap is not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13. If you become aware that a child has provided 
                us with personal information, please contact us and we will take steps to remove such information.
              </p>
            </div>
          </section>

          <section>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your data in accordance with 
                this privacy policy and applicable laws.
              </p>
            </div>
          </section>

          <section>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of any changes 
                by posting the new privacy policy on this page and updating the "Last Updated" date. 
                Changes are effective immediately upon posting.
              </p>
            </div>
          </section>

          <section className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-2">
              <p>If you have questions about this privacy policy or our data practices, please contact us:</p>
              <ul className="space-y-1">
                <li><strong>Email:</strong> privacy@copyzap.com</li>
                <li><strong>Website:</strong> <a href="https://sharpen.studio" className="text-primary-500 hover:text-primary-400 underline">sharpen.studio</a></li>
              </ul>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                We are committed to protecting your privacy and will respond to your inquiries promptly.
              </p>
            </div>
          </section>
        </div>

        <PublicFooter />
      </div>
    </div>
  );
};

export default Privacy;