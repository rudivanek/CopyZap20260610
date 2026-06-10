import React from 'react';
import { ArrowRight, X } from 'lucide-react';

interface NextStepSuggestionProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

const NextStepSuggestion: React.FC<NextStepSuggestionProps> = ({
  message,
  actionLabel,
  onAction,
  onDismiss,
}) => {
  const [hovered, setHovered] = React.useState(false);
  const isClickable = !!(actionLabel && onAction);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 14px',
        background: hovered ? '#e8eaee' : '#f0f2f5',
        border: '1px solid #c5cad4',
        borderLeft: '3px solid rgba(249,115,22,0.45)',
        borderRadius: 8,
        maxWidth: 'fit-content',
        margin: '4px 0',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'background 0.15s ease, box-shadow 0.15s ease',
        boxShadow: hovered ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#1f2937',
            flexShrink: 0,
          }}
        >
          Next:
        </span>
        <span style={{ fontSize: 13, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {message}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 12,
              fontWeight: 600,
              color: '#374151',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {actionLabel}
            <ArrowRight size={11} />
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            style={{
              marginLeft: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

export default NextStepSuggestion;
