import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Sparkles, Settings2, TrendingUp, Copy, Globe } from 'lucide-react';

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

const features = [
  {
    group: "Create Faster",
    items: [
      {
        title: "Copy Maker Hub",
        icon: Rocket,
        text: "Generate fresh ideas, hooks, and campaigns with built-in AI assistance."
      },
      {
        title: "Templates & Dashboard",
        icon: Copy,
        text: "Save your best prompts and tone setups for consistent output."
      },
    ],
  },
  {
    group: "Refine Smarter",
    items: [
      {
        title: "Improve Existing Copy",
        icon: Sparkles,
        text: "Paste any text and let AI enhance clarity, tone, and persuasiveness."
      },
      {
        title: "Content Scoring & Insights",
        icon: TrendingUp,
        text: "Evaluate copy with smart scoring for readability and conversion."
      },
    ],
  },
  {
    group: "Optimize for Results",
    items: [
      {
        title: "SEO & GEO Enhancements",
        icon: Globe,
        text: "Boost visibility with optimized titles, metadata, and LLM-ready structure."
      },
      {
        title: "Advanced Customizations",
        icon: Settings2,
        text: "Adjust tone, structure, and funnel-stage targeting effortlessly."
      },
    ],
  },
];

const FeaturesSection: React.FC = () => {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      className="py-28 bg-gray-50 dark:bg-gray-950"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUpVariants} className="text-center mb-20">
          <h2 className="text-3xl sm:text-3xl lg:text-4xl xl:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need to Create, Refine, and Scale Winning Copy
          </h2>
          <p className="text-xl sm:text-2xl lg:text-3xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            From ideation to optimization, CopyZap gives you the tools to craft compelling marketing content at scale.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((group) => (
            <motion.div
              key={group.group}
              variants={fadeUpVariants}
              className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-800"
            >
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-6 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">
                {group.group}
              </h3>
              <ul className="space-y-6">
                {group.items.map((item) => (
                  <li
                    key={item.title}
                    className="flex items-start gap-4 hover:translate-y-[-2px] transition-transform"
                  >
                    <item.icon className="w-6 h-6 mt-1 text-primary-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-xl sm:text-2xl text-gray-900 dark:text-white mb-1">{item.title}</p>
                      <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default FeaturesSection;
