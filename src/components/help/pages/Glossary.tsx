import React from 'react';
import HelpLayout from '../HelpLayout';

const Glossary: React.FC = () => {
  const terms = [
    {
      term: "Brand Voice",
      definition: "A custom communication style that reflects your brand's personality, tone, and messaging guidelines. Brand voices can be extracted from URLs or created manually."
    },
    {
      term: "Voice Style",
      definition: "Pre-defined communication styles modeled after well-known personalities or writing approaches (e.g., Steve Jobs, casual, professional)."
    },
    {
      term: "Template",
      definition: "A saved configuration of form settings that can be reused for similar copy generation tasks."
    },
    {
      term: "Copy Maker",
      definition: "The main copywriting interface where you create and refine marketing content."
    },
    {
      term: "Quick Setup Wizard",
      definition: "A guided workflow that helps you quickly generate copy by answering a series of simple questions, then auto-filling the Copy Maker form."
    },
    {
      term: "Alternative Copy",
      definition: "Additional variations of generated content created using different approaches or styles."
    },
    {
      term: "Content Scoring",
      definition: "AI-powered analysis that evaluates copy quality and provides improvement suggestions. Triggered by clicking the Score button on an output card."
    },
    {
      term: "Blending",
      definition: "Combining elements from multiple copy versions to create an optimized final result."
    },
    {
      term: "SEO Metadata",
      definition: "Search engine optimization elements including meta titles, descriptions, and structured data."
    },
    {
      term: "Output Structure",
      definition: "The format and organization of generated content (e.g., paragraphs, bullet points, sections)."
    },
    {
      term: "Special Instructions",
      definition: "Custom requirements or constraints that guide the AI in generating copy."
    },
    {
      term: "Target Audience",
      definition: "The specific group of people your copy is intended to reach and persuade."
    },
    {
      term: "Call to Action (CTA)",
      definition: "A prompt that encourages readers to take a specific action (e.g., 'Buy Now', 'Learn More')."
    }
  ];

  return (
    <HelpLayout
      title="Glossary of Terms"
      breadcrumbs={[{ label: 'Glossary' }]}
    >
      <div className="space-y-6">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Common terms and concepts used throughout CopyZap.
        </p>

        <div className="space-y-6">
          {terms.map((item, index) => (
            <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {item.term}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {item.definition}
              </p>
            </div>
          ))}
        </div>
      </div>
    </HelpLayout>
  );
};

export default Glossary;
