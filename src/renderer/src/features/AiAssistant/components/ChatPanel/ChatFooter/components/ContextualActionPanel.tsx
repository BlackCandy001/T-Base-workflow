import React from 'react';
import { Layout, Check, X, Zap } from 'lucide-react';

interface ContextualActionPanelProps {
  isVisible: boolean;
  onApply: () => void;
  onDismiss: () => void;
  applied: boolean;
  nodeCount: number;
  edgeCount: number;
}

const ContextualActionPanel: React.FC<ContextualActionPanelProps> = ({
  isVisible,
  onApply,
  onDismiss,
  applied,
  nodeCount,
  edgeCount
}) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        backgroundColor: 'var(--tertiary-bg)',
        borderBottom: '1px solid var(--border-color)',
        borderTopLeftRadius: 'var(--radius-lg)',
        borderTopRightRadius: 'var(--radius-lg)',
        animation: 'slide-in-down 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 5,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div 
          style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: 'var(--radius-sm)', 
            backgroundColor: 'var(--accent-bg-transparent)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--accent-color)'
          }}
        >
          <Layout size={14} />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-text)' }}>
            Workflow Diagram
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--secondary-text)', opacity: 0.8 }}>
             <span style={{ color: 'var(--success-color, #10b981)', fontWeight: 700 }}>+{nodeCount} Nodes</span>
             <span>•</span>
             <span style={{ fontWeight: 700 }}>{edgeCount} Edges</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onDismiss}
          className="interactive-element"
          style={{
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--secondary-text)',
            backgroundColor: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer'
          }}
        >
          <X size={12} />
          Reject
        </button>
        
        <button
          onClick={onApply}
          className={`hover-glow ${!applied ? 'animate-pulse' : ''}`}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: applied ? 'var(--success-color, #10b981)' : 'var(--accent-color)',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 700,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: applied ? 'var(--accent-glow)' : 'var(--shadow-md)',
          }}
        >
          {applied ? <Check size={12} strokeWidth={3} /> : <Zap size={12} fill="currentColor" />}
          {applied ? 'Applied' : 'Accept All'}
        </button>
      </div>
    </div>
  );
};

export default ContextualActionPanel;
