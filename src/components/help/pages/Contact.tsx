import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HelpLayout from '../HelpLayout';
import { supabase } from '../../../services/supabaseClient';
import toast from 'react-hot-toast';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-help-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Your message has been sent! We\'ll get back to you soon.');
        setFormData({ name: '', email: '', message: '' });
      } else {
        toast.error('There was a problem sending your message. Please try again later.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('An error occurred. Please email us directly at support@copyzap.app');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <HelpLayout
      title="Contact Support"
      breadcrumbs={[{ label: 'Contact Support' }]}
    >
      <p className="text-gray-600 dark:text-gray-300">
        Need help, found a bug, or want to request a new feature? Our team is here to help. Fill out the form below and we'll respond as soon as possible.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 my-8">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your.email@example.com"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
            Message
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={6}
            required
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe your question, issue, or feature request..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>

      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 my-8">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Other Ways to Reach Us</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Prefer email? Send us a message directly at:</p>
        <a href="mailto:support@copyzap.app" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
          support@copyzap.app
        </a>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 my-8">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Before You Contact Us</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-3">Looking for quick answers? Check out these resources:</p>
        <ul className="space-y-2">
          <li><Link to="/help/getting-started" className="text-blue-600 dark:text-blue-400 hover:underline">Getting Started Guide</Link> - Learn the basics</li>
          <li><Link to="/help/troubleshooting-faqs" className="text-blue-600 dark:text-blue-400 hover:underline">Troubleshooting & FAQs</Link> - Common issues and solutions</li>
          <li><Link to="/help" className="text-blue-600 dark:text-blue-400 hover:underline">Help Center</Link> - Browse all help topics</li>
        </ul>
      </div>
    </HelpLayout>
  );
};

export default Contact;
