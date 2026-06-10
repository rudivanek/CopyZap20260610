import React from 'react';
import { Mic, Info as InfoIcon } from 'lucide-react';
import { useBrandVoices } from '../../hooks/useBrandVoices';
import { Tooltip } from './Tooltip';

interface BrandVoiceSelectorProps {
  customerId?: string;
  value?: string;
  onChange: (brandVoiceId: string) => void;
  className?: string;
}

const BrandVoiceSelector: React.FC<BrandVoiceSelectorProps> = ({
  customerId,
  value,
  onChange,
  className = ''
}) => {
  const { voices, loading } = useBrandVoices(customerId);

  console.log('🎤 BrandVoiceSelector rendered:', { customerId, voicesCount: voices.length, loading });

  if (!customerId) {
    console.log('🎤 BrandVoiceSelector: No customerId, returning null');
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center mb-1">
        <Mic size={16} className="text-primary-600 dark:text-primary-400 mr-2" />
        <label htmlFor="brandVoice" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
          Brand Voice
        </label>
        <Tooltip content="Apply a specific brand voice to your generated copy. Brand voices include tone, personality traits, vocabulary preferences, and punctuation rules that ensure consistency across all content.">
          <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <InfoIcon size={14} />
          </button>
        </Tooltip>
      </div>
      <select
        id="brandVoice"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || voices.length === 0}
        className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
      >
        <option value="">No brand voice (use form settings)</option>
        {voices.map(voice => (
          <option key={voice.id} value={voice.id}>
            {voice.name}
          </option>
        ))}
      </select>
      {voices.length === 0 && !loading && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          No brand voices created for this customer yet. Visit the Brand Voices menu to create one.
        </p>
      )}
      {voices.length > 0 && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Optional: Apply a saved brand voice to ensure consistent tone and style
        </p>
      )}
    </div>
  );
};

export default BrandVoiceSelector;
