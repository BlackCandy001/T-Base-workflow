import React, { useState } from "react";
import { useProject } from "../../../../context/ProjectContext";
import { Layout, Check, AlertCircle } from "lucide-react";

interface DiagramBlockProps {
  nodes: any[];
  edges: any[];
  disabled?: boolean;
}

const DiagramBlock: React.FC<DiagramBlockProps> = ({ nodes, edges, disabled }) => {
  const { setNodes, setEdges } = useProject();
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = () => {
    try {
      if (!nodes || !edges) {
        throw new Error("Invalid diagram data");
      }
      setNodes(nodes);
      setEdges(edges);
      setApplied(true);
      setError(null);
      
      // Auto-reset "applied" state after some time
      setTimeout(() => setApplied(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to apply diagram");
    }
  };

  return (
    <div style={{
      marginLeft: "29px",
      marginTop: "8px",
      marginBottom: "12px",
      padding: "12px",
      borderRadius: "8px",
      backgroundColor: "var(--vscode-editor-background)",
      border: "1px solid var(--vscode-widget-border)",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Layout size={16} style={{ color: "var(--accent-color)" }} />
          <span style={{ 
            fontSize: "13px", 
            fontWeight: 600,
            color: "var(--vscode-editor-foreground)"
          }}>
            AI Generated Diagram
          </span>
        </div>
        <div style={{ fontSize: "11px", opacity: 0.6 }}>
          {nodes.length} nodes, {edges.length} edges
        </div>
      </div>

      <p style={{ 
        fontSize: "12px", 
        margin: 0, 
        opacity: 0.8,
        color: "var(--vscode-descriptionForeground)"
      }}>
        The AI has designed a new workflow structure. Click the button below to apply it to your canvas.
      </p>

      <button
        onClick={handleApply}
        disabled={disabled || applied || nodes.length === 0}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "4px",
          border: "none",
          backgroundColor: applied ? "var(--vscode-testing-iconPassed)" : "var(--vscode-button-background)",
          color: "var(--vscode-button-foreground)",
          cursor: (disabled || applied) ? "default" : "pointer",
          fontSize: "12px",
          fontWeight: 600,
          transition: "all 0.2s",
          marginTop: "4px"
        }}
      >
        {applied ? (
          <>
            <Check size={14} />
            Applied to Canvas
          </>
        ) : (
          <>
            <Layout size={14} />
            Apply to Canvas
          </>
        )}
      </button>

      {error && (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "6px", 
          color: "var(--vscode-errorForeground)",
          fontSize: "11px",
          marginTop: "4px"
        }}>
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
};

export default DiagramBlock;
