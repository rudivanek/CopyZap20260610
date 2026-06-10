import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import SocialShare from '../SocialShare';

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

const FooterSection: React.FC = () => {
  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUpVariants}
      className="bg-white dark:bg-black border-t border-gray-300 dark:border-gray-800 py-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-6 sm:space-y-0">
          <div className="order-1 sm:order-2">
            <SocialShare className="justify-center sm:justify-end" />
          </div>

          <div className="flex items-center space-x-6">
            <Link
              to="/create-account"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              <Sparkles size={16} />
              Try CopyZap
            </Link>
          </div>

          <div className="text-gray-600 dark:text-gray-400">
            © 2025 CopyZap
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm">
            <Link
              to="/help"
              className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
            >
              Help Center
            </Link>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <Link
              to="/blog"
              className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
            >
              Blog
            </Link>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <Link
              to="/privacy"
              className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <Link
              to="/privacy"
              className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
            >
              Terms & Conditions
            </Link>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Powered by{' '}
              <a
                href="https://sharpen.studio/en/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-400 transition-colors"
              >
                Sharpen.Studio
              </a>
            </p>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default FooterSection;
