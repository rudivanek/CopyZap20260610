import React from 'react';
import { ArrowRight } from 'lucide-react';

interface DynamicGuidanceProps {
  outputCount: number;
  tab: 'create' | 'improve';
  compareActive: boolean;
  onGenerateAnother?: () => void;
}

const nextBarStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  maxWidth: 520,
  padding: '9px 14px',
  borderRadius: 8,
  background: '#f0f2f5',
  border: '1px solid #c5cad4',
  borderLeft: '3px solid rgba(249,115,22,0.45)',
  fontSize: 13,
  color: '#374151',
  lineHeight: '1.5',
  cursor: 'default',
  transition: 'background 0.15s ease, box-shadow 0.15s ease',
};

const nextBarHoverStyle: React.CSSProperties = {
  background: '#e8eaee',
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
};

const NextBar: React.FC<{ children: React.ReactNode; clickable?: boolean; onClick?: () => void }> = ({
  children,
  clickable,
  onClick,
}) => {
  const [hovered, setHovered] = React.useState(false);
  const style: React.CSSProperties = {
    ...nextBarStyle,
    ...(hovered ? nextBarHoverStyle : {}),
    cursor: clickable ? 'pointer' : 'default',
  };

  return (
    <div
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const DynamicGuidance: React.FC<DynamicGuidanceProps> = ({
  outputCount,
  tab,
  compareActive,
  onGenerateAnother,
}) => {
  if (outputCount === 0 && !compareActive) {
    return null;
  }

  let content: React.ReactNode;

  if (compareActive && outputCount >= 2) {
    content = (
      <NextBar>
        <span style={{ marginRight: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1f2937', flexShrink: 0 }}>
          Next:
        </span>
        <span style={{ color: '#374151' }}>Run analysis to see which version performs best</span>
      </NextBar>
    );
  } else if (outputCount === 0) {
    content = (
      <NextBar>
        <span style={{ marginRight: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1f2937', flexShrink: 0 }}>
          Next:
        </span>
        <span style={{ color: '#374151' }}>Generate your first version to get started</span>
      </NextBar>
    );
  } else if (outputCount === 1) {
    if (onGenerateAnother) {
      content = (
        <NextBar clickable onClick={onGenerateAnother}>
          <span style={{ marginRight: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1f2937', flexShrink: 0 }}>
            Next:
          </span>
          <span style={{ color: '#374151', fontWeight: 500 }}>Create another version</span>
          <span style={{ color: '#6b7280', marginLeft: 3 }}>to compare results</span>
          <ArrowRight size={13} style={{ marginLeft: 6, color: '#6b7280', flexShrink: 0 }} />
        </NextBar>
      );
    } else {
      content = (
        <NextBar>
          <span style={{ marginRight: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1f2937', flexShrink: 0 }}>
            Next:
          </span>
          <span style={{ color: '#374151', fontWeight: 500 }}>Create another version</span>
          <span style={{ color: '#6b7280', marginLeft: 3 }}>to compare results</span>
        </NextBar>
      );
    }
  } else if (outputCount >= 2) {
    content = (
      <NextBar>
        <span style={{ marginRight: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1f2937', flexShrink: 0 }}>
          Next:
        </span>
        <span style={{ color: '#374151' }}>Compare versions and pick the strongest one</span>
      </NextBar>
    );
  } else {
    return null;
  }

  return (
    <div style={{ marginBottom: 10 }}>
      {content}
    </div>
  );
};

export default DynamicGuidance;
