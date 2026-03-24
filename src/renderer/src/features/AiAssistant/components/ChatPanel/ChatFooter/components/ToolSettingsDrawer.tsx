import React from "react";
import {
  useSettings,
  defaultToolPermissions,
} from "../../../../context/SettingsContext";
import { getToolColor } from "../../ChatBody/utils";
import {
  FileText,
  FilePlus,
  FileCode,
  List,
  Search,
  ShieldCheck,
  Terminal,
  BookOpen,
  Edit3,
  Layout,
  Crosshair,
  Link,
  X,
} from "lucide-react";

interface ToolSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOOL_DESCRIPTIONS: Record<string, string> = {
  read_file: "Read the content of any file.",
  write_to_file: "Create or overwrite a file entirely.",
  replace_in_file: "Edit code using search and replace blocks.",
  list_files: "List files and directories in a path.",
  search_files: "Search for text strings across the codebase.",
  ask_bypass_gitignore: "Request permission to access ignored files.",
  run_command: "Execute a terminal command (bash/sh).",
  read_workspace_context: "Read the project's workspace.md knowledge file.",
  update_workspace_context: "Update the project's workspace.md knowledge file.",
  get_file_outline: "Get the class and function structure of a file.",
  get_symbol_definition: "Find the definition of a specific symbol.",
  get_references: "Find all references to a specific symbol.",
};

const TOOL_ICONS: Record<string, React.ReactNode> = {
  read_file: <FileText size={16} />,
  write_to_file: <FilePlus size={16} />,
  replace_in_file: <FileCode size={16} />,
  list_files: <List size={16} />,
  search_files: <Search size={16} />,
  ask_bypass_gitignore: <ShieldCheck size={16} />,
  run_command: <Terminal size={16} />,
  read_workspace_context: <BookOpen size={16} />,
  update_workspace_context: <Edit3 size={16} />,
  get_file_outline: <Layout size={16} />,
  get_symbol_definition: <Crosshair size={16} />,
  get_references: <Link size={16} />,
};

const ToolSettingsDrawer: React.FC<ToolSettingsDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { toolPermissions, setToolPermission } = useSettings();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "100%", // Pop up above the input container
        left: 0,
        right: 0,
        marginBottom: "8px",
        height: "440px",
        maxHeight: "50vh",
        backgroundColor: "rgba(24, 24, 27, 0.95)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "12px",
        boxShadow: "0 -8px 24px rgba(0, 0, 0, 0.5)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        animation: "slideUpDrawer 0.2s ease-out",
        color: "var(--primary-text)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.2)",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Tool Execution Permissions
        </span>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            color: "var(--secondary-text)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div
        className="custom-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {Object.keys(defaultToolPermissions).map((toolId) => {
          const permission = toolPermissions[toolId] || "auto";
          const toolColor = getToolColor(toolId as any);

          return (
            <div
              key={toolId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px 12px",
                borderRadius: "6px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--hover-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              {/* Tool Icon */}
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  backgroundColor: `${toolColor}1A`,
                  color: toolColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {TOOL_ICONS[toolId] || <Terminal size={16} />}
              </div>

              {/* Info */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, fontFamily: "monospace" }}>
                  {toolId}
                </span>
                <span style={{ fontSize: "11px", opacity: 0.6, marginTop: "2px" }}>
                  {TOOL_DESCRIPTIONS[toolId]}
                </span>
              </div>

              {/* Toggle logic */}
              <div
                style={{
                  display: "flex",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "6px",
                  padding: "2px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <button
                  onClick={() => setToolPermission(toolId, "auto")}
                  style={{
                    padding: "4px 10px",
                    fontSize: "10px",
                    borderRadius: "4px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: permission === "auto" ? "var(--accent-color)" : "transparent",
                    color: permission === "auto" ? "white" : "var(--secondary-text)",
                    fontWeight: 600,
                    transition: "all 0.2s",
                  }}
                >
                  Auto
                </button>
                <button
                  onClick={() => setToolPermission(toolId, "request")}
                  style={{
                    padding: "4px 10px",
                    fontSize: "10px",
                    borderRadius: "4px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: permission === "request" ? "var(--accent-color)" : "transparent",
                    color: permission === "request" ? "white" : "var(--secondary-text)",
                    fontWeight: 600,
                    transition: "all 0.2s",
                  }}
                >
                  Request
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideUpDrawer {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ToolSettingsDrawer;
