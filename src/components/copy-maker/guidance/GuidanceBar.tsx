import React from 'react';

type GuidanceMode = 'create' | 'improve';

interface GuidancePill {
  id: GuidanceMode;
  label: string;
}

const PILLS: GuidancePill[] = [
  { id: 'create', label: 'Generate' },
  { id: 'improve', label: 'Improve' },
];

interface GuidanceBarProps {
  activeTab: 'create' | 'improve';
  hasOutputs: boolean;
  onSelect: (mode: GuidanceMode) => void;
}

const GuidanceBar: React.FC<GuidanceBarProps> = ({ activeTab, onSelect }) => {
  return (
    <div className="flex items-center flex-wrap gap-2 mb-3">
      <span style={{ fontSize: 13, color: '#6b7280', marginRight: 4 }}>Start here:</span>
      {PILLS.map(({ id, label }) => {
        const active = id === 'create' ? activeTab === 'create' : activeTab === 'improve';
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: active ? '1px solid #111827' : '1px solid #e5e7eb',
              background: active ? '#111827' : 'transparent',
              color: active ? '#ffffff' : '#6b7280',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!active) {
                (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#d1d5db';
                (e.currentTarget as HTMLButtonElement).style.color = '#111827';
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb';
                (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
              }
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default GuidanceBar;
