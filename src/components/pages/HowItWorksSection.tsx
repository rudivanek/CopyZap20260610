import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Sparkles, CheckCircle2 } from 'lucide-react';

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
      staggerChildren: 0.2
    }
  }
};

const steps = [
  {
    title: "Describe Your Project",
    text: "Tell CopyZap what you're writing and who it's for.",
    icon: ClipboardList
  },
  {
    title: "Generate & Refine",
    text: "AI drafts your copy, scores it for clarity, and suggests improvements.",
    icon: Sparkles
  },
  {
    title: "Review & Export",
    text: "Polish your copy, export as Markdown or HTML, and save templates for later.",
    icon: CheckCircle2
  },
];

const HowItWorksSection: React.FC = () => {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      className="py-28 bg-white dark:bg-black"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUpVariants} className="text-center mb-16">
          <h2 className="text-3xl sm:text-3xl lg:text-4xl xl:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            How It Works — From Brief to Polished Copy in Minutes
          </h2>
          <p className="text-xl sm:text-2xl lg:text-3xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            A streamlined workflow that takes you from concept to conversion-ready content.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={fadeUpVariants}
              className="flex flex-col items-center text-center relative"
            >
              <div className="relative z-10 w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <step.icon className="w-10 h-10 text-white" />
              </div>

              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary-500 to-primary-300 dark:from-primary-400 dark:to-primary-600"></div>
              )}

              <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-800 text-center">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 text-sm font-bold px-3 py-1 rounded-full">
                  Step {index + 1}
                </div>
                <h3 className="font-semibold text-xl sm:text-2xl lg:text-3xl mb-3 text-gray-900 dark:text-white mt-2 text-center">
                  {step.title}
                </h3>
                <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed text-center">
                  {step.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default HowItWorksSection;
