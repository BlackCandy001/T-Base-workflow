import React, { useEffect, useRef, useState } from "react";
import "./TerminalBlock.css";
import { useProject } from "../context/ProjectContext";
import { Copy, Check } from "lucide-react";

interface TerminalBlockProps {
  logs: string;
  status?: "busy" | "idle" | "free";
  maxHeight?: number;
  rows?: number;
  initialCommand?: string;
  cwd?: string;
  onInput?: (data: string) => void;
}

export const TerminalBlock: React.FC<TerminalBlockProps> = ({
  logs,
  status,
  maxHeight = 400,
  initialCommand,
  cwd,
  rows = 22,
  onInput,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const { homedir } = useProject();
  const [copied, setCopied] = useState(false);

  const formatCwd = (path: string) => {
    if (homedir && path.startsWith(homedir)) {
      return path.replace(homedir, "~");
    }
    return path;
  };

  const formatCommand = (cmd: string) => {
    if (!cmd) return "";
    const lines = cmd.split("\n");
    if (lines.length > 3) {
      return lines.slice(0, 3).join("\n") + "\n...";
    }
    return cmd;
  };

  const stripAnsi = (str: string) =>
    str
      .replace(/\x1B\[[0-9;?]*[A-Za-z~]/g, "")
      .replace(/\x1b\].*?(\x07|\x1b\\)/g, "");

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanLogs = stripAnsi(logs);
    const textToCopy = `${cwd ? `${cwd}$ ` : ""}${initialCommand || ""}\n\n${cleanLogs}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Scroll to bottom when logs change
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="terminal-block-container" style={{ maxHeight }}>
      <div
        className="terminal-fixed-header"
        style={{
          padding: "6px 10px",
          backgroundColor: "#1e1e1e",
          borderBottom: "1px solid #333",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "11px",
          fontWeight: 500,
          color: "#888",
          position: "sticky",
          top: 0,
          zIndex: 5,
        }}
      >
        <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <span style={{ color: "#aaa" }}>{cwd ? `${formatCwd(cwd)}$ ` : ""}</span>
          <span style={{ color: "#eee" }}>{initialCommand ? formatCommand(initialCommand) : "Terminal"}</span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            background: "none",
            border: "none",
            color: "#888",
            cursor: "pointer",
            padding: "2px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {copied ? <Check size={14} style={{ color: "#4caf50" }} /> : <Copy size={14} />}
        </button>
      </div>
      <div
        ref={terminalRef}
        style={{
          padding: "10px",
          backgroundColor: "#1e1e1e",
          color: "#eee",
          fontFamily: "monospace",
          fontSize: "12px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          overflowY: "auto",
          minHeight: "100px",
          maxHeight: maxHeight - 30, // Header height
        }}
      >
        {stripAnsi(logs)}
        {status === "busy" && <span className="terminal-cursor">█</span>}
      </div>
    </div>
  );
};
