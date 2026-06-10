import React from 'react';
import { Zap } from 'lucide-react';

interface UpgradeHintProps {
  versionCount: number;
}

const UpgradeHint: React.FC<UpgradeHintProps> = ({ versionCount }) => {
  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 8,
        background: '#fff7ed',
        border: '1px solid #fed7aa',
        borderLeft: '3px solid #f97316',
        marginTop: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Zap size={15} style={{ color: '#f97316', marginTop: 1, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#9a3412', lineHeight: '1.4' }}>
            Want more high-performing variations?
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#c2410c', lineHeight: '1.5' }}>
            {versionCount >= 2
              ? `You've generated ${versionCount} versions — most users test 3–5 before choosing a winner.`
              : 'Generate more versions, test angles, and improve results faster.'}
          </p>
          <p
            style={{
              margin: '5px 0 0',
              fontSize: 13,
              fontWeight: 500,
              color: '#f97316',
              cursor: 'default',
              textDecoration: 'none',
            }}
          >
            More generations available
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeHint;
