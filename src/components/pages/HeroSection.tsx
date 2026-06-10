import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onOpenBetaModal: () => void;
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

const HeroSection: React.FC<HeroSectionProps> = ({ onOpenBetaModal }) => {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={fadeUpVariants}
      className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-black dark:via-gray-900 dark:to-gray-950"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-50/20 to-gray-100/20 dark:from-transparent dark:via-gray-900/20 dark:to-gray-800/20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center">
          <motion.h1
            variants={fadeUpVariants}
            className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
          >
            Create Copy That Sells — Instantly
          </motion.h1>
          <motion.p
            variants={fadeUpVariants}
            className="text-xl sm:text-2xl lg:text-3xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            CopyZap turns your ideas into persuasive marketing content powered by advanced AI.
            From ad campaigns to web pages, generate and refine professional-grade copy fine-tuned for clarity, tone, and results.
          </motion.p>
          <motion.div
            variants={fadeUpVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={onOpenBetaModal}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-8 text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Sparkles size={24} className="mr-3" />
              Start Free Beta
            </button>
            <Link
              to="/copy-maker"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-bold py-4 px-8 text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border border-gray-300 dark:border-gray-700"
            >
              Login to Get Started
            </Link>
          </motion.div>
          <motion.p
            variants={fadeUpVariants}
            className="mt-6 text-sm text-gray-600 dark:text-gray-400"
          >
            No credit card required. Start creating better copy today.
          </motion.p>
        </div>
      </div>
    </motion.section>
  );
};

export default HeroSection;
