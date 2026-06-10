import React from 'react';
import { Edit, Trash2, MessageSquare } from 'lucide-react';
import { BrandVoice } from '../types';

interface BrandVoiceCardProps {
  voice: BrandVoice;
  onEdit: () => void;
  onDelete: () => void;
}

const BrandVoiceCard: React.FC<BrandVoiceCardProps> = ({ voice, onEdit, onDelete }) => {
  const previewTraits = voice.personality_traits.slice(0, 3);
  const hasMore = voice.personality_traits.length > 3;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start flex-1">
          <MessageSquare size={20} className="text-primary-600 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              {voice.name}
            </h4>
            {voice.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {voice.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-gray-100 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Personality Traits Preview */}
      {previewTraits.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {previewTraits.map((trait, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full"
            >
              {trait}
            </span>
          ))}
          {hasMore && (
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium rounded-full">
              +{voice.personality_traits.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Tone Style Pill */}
      {voice.tone_style && (
        <div className="inline-flex items-center px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
          Tone: {voice.tone_style}
        </div>
      )}
    </div>
  );
};

export default BrandVoiceCard;
