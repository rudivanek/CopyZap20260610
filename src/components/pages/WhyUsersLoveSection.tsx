import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface WhyUsersLoveSectionProps {
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

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const benefits = [
  "Save hours weekly with dynamic, context-aware generation.",
  "Keep consistent brand tone using reusable templates.",
  "Boost conversions with data-driven scoring & insights.",
  "Manage projects seamlessly with your personalized dashboard.",
];

const WhyUsersLoveSection: React.FC<WhyUsersLoveSectionProps> = ({ onOpenBetaModal }) => {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      className="py-28 bg-gray-50 dark:bg-gray-950"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUpVariants} className="text-center mb-16">
          <h2 className="text-3xl sm:text-3xl lg:text-4xl xl:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why Marketers & Agencies Choose CopyZap
          </h2>
          <p className="text-xl sm:text-2xl lg:text-3xl text-gray-600 dark:text-gray-400">
            Join hundreds of professionals who've transformed their content workflow.
          </p>
        </motion.div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-800">
          <ul className="space-y-6">
            {benefits.map((benefit, index) => (
              <motion.li
                key={index}
                variants={fadeUpVariants}
                className="flex items-start gap-4"
              >
                <CheckCircle className="text-primary-500 mt-1 w-6 h-6 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 text-2xl leading-relaxed">
                  {benefit}
                </span>
              </motion.li>
            ))}
          </ul>

          <motion.div variants={fadeUpVariants} className="mt-10 text-center">
            <button
              onClick={onOpenBetaModal}
              className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-10 text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Try CopyZap Free
              <ArrowRight size={24} className="ml-3" />
            </button>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              No credit card required. Start creating better copy today.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default WhyUsersLoveSection;
