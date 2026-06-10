import React from 'react';
import HelpLayout from '../HelpLayout';
import HelpPageTemplate from '../HelpPageTemplate';

const VoiceStylesAndBlending: React.FC = () => {
  return (
    <HelpLayout
      title="Voice Styles & Blending"
      breadcrumbs={[{ label: 'Voice Styles & Blending' }]}
    >
      <HelpPageTemplate
        tldr="Apply iconic writing styles from masters like Seth Godin, David Ogilvy, or Steve Jobs to your copy, or blend multiple styles for unique voices."
        whenToUse="Use voice styles when you want to emulate a specific writing tone or blend multiple influencers' styles for brand consistency."
        steps={[
          {
            title: 'Enable Voice Styles',
            content: <p>In Optional Features, toggle on "Apply Voice Style" or "Generate Voice Variations".</p>
          },
          {
            title: 'Select Your Voices',
            content: <p>Choose from 10+ iconic styles including Seth Godin, Ann Handley, Gary Vaynerchuk, and more. You can select multiple voices for blending.</p>
          },
          {
            title: 'Generate and Compare',
            content: <p>Generate your copy to see how each voice style transforms your content. Use comparison tools to evaluate differences.</p>
          }
        ]}
        proTips={[
          'Start with one voice style to understand its characteristics',
          'Blend 2-3 complementary voices for unique brand personalities',
          'Use voice styles consistently across campaigns for brand recognition'
        ]}
        relatedLinks={[
          { title: 'Optional Features', path: '/help/optional-features' },
          { title: 'Workflow: Voice Variations', path: '/help/real-case-workflows/voice-variations' }
        ]}
      />
    </HelpLayout>
  );
};

export default VoiceStylesAndBlending;
