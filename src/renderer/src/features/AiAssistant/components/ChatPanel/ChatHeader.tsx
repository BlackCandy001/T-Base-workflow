import React from "react";
import { TabInfo } from "../../types";
import { Message } from "./ChatBody/types";
import { useNetworkPing } from "../../hooks/useNetworkPing";
import ProviderIcon from "../common/ProviderIcon";
import { Copy, ChevronRight, Activity, Clock } from "lucide-react";

interface ChatHeaderProps {
  selectedTab: TabInfo;
  onBack: () => void;
  onClearChat: () => void;
  isLoadingConversation?: boolean;
  firstRequestMessage?: Message;
  contextUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  taskName?: string | null;
  conversationId?: string;
  currentModel?: any;
  currentAccount?: any;
  onToggleTaskDrawer?: () => void;
  taskProgress?: {
    current: {
      taskName: string;
      tasks: { text: string; status: "todo" | "done" }[];
      files: string[];
      taskIndex?: number;
      totalTasks?: number;
    } | null;
    history: any[];
  };
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  selectedTab,
  contextUsage,
  taskName,
  conversationId,
  currentModel,
  currentAccount,
  taskProgress,
  onToggleTaskDrawer,
}) => {
  const formatTokens = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const { ping, color } = useNetworkPing();

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    const id = conversationId || selectedTab.conversationId;
    if (id) {
      navigator.clipboard.writeText(id);
    }
  };

  const providerId = currentModel?.providerId || selectedTab.provider || "deepseek";

  return (
    <div
      style={{
        borderBottom: "1px solid var(--border-color)",
        backgroundColor: "var(--secondary-bg)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        padding: "10px 16px",
        gap: "8px",
        boxShadow: "var(--shadow-sm)",
        zIndex: 10,
      }}
    >
      {/* Top Row: Navigation & Meta info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, overflow: "hidden" }}>
          <div
            style={{
              padding: "4px",
              borderRadius: "10px",
              backgroundColor: "var(--accent-bg-transparent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ProviderIcon 
              provider={{ provider_id: providerId, id: providerId, name: providerId }} 
              size={16} 
            />
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--primary-text)", whiteSpace: "nowrap" }}>
                {currentModel?.id || "Chat"}
              </span>
              <span
                onClick={handleCopyId}
                title="Copy ID"
                style={{
                  fontSize: "10px",
                  color: "var(--secondary-text)",
                  fontFamily: "monospace",
                  opacity: 0.6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  backgroundColor: "var(--tertiary-bg)",
                  transition: "all var(--transition-fast)",
                }}
                className="interactive-element"
              >
                #{(conversationId || selectedTab.conversationId || "NEW").slice(-6)}
                <Copy size={8} />
              </span>
            </div>
            {currentAccount?.email && (
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--secondary-text)",
                  opacity: 0.7,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={currentAccount.email}
              >
                {currentAccount.email}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Token Usage Bagde */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              borderRadius: "8px",
              backgroundColor: "var(--tertiary-bg)",
              border: "1px solid var(--border-color)",
              color: "var(--secondary-text)",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            <Activity size={12} strokeWidth={2.5} />
            <span>{contextUsage ? formatTokens(contextUsage.total) : "0"}</span>
          </div>

          {/* Ping Indicator */}
          <div
            title={`Latency: ${ping !== null ? ping + 'ms' : 'Offline'}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "10px",
              fontWeight: 700,
              padding: "4px 8px",
              borderRadius: "8px",
              backgroundColor: "color-mix(in srgb, " + color + " 10%, transparent)",
              color: color,
              border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: color,
                boxShadow: `0 0 6px ${color}`,
              }}
            />
            {ping !== null ? `${ping}ms` : "OFFLINE"}
          </div>
        </div>
      </div>

      {/* Task & Progress Section */}
      {(taskProgress?.current || taskName) && (
        <div
          onClick={onToggleTaskDrawer}
          className="interactive-element"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--tertiary-bg)",
            border: "1px solid var(--border-color)",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
          }}
        >
          <div 
            style={{ 
              backgroundColor: "var(--accent-color)", 
              width: "24px", 
              height: "24px", 
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white"
            }}
          >
            <Clock size={14} strokeWidth={2.5} />
          </div>
          
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {taskProgress?.current?.taskName || taskName}
              </span>
              {taskProgress?.current?.totalTasks && (
                <span style={{ fontSize: "10px", color: "var(--secondary-text)", backgroundColor: "var(--vscode-badge-background)", padding: "1px 6px", borderRadius: "10px" }}>
                  {taskProgress.current.taskIndex || 1}/{taskProgress.current.totalTasks}
                </span>
              )}
            </div>
            
            {taskProgress?.current?.tasks && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--secondary-text)", opacity: 0.8 }}>
                <ChevronRight size={10} />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {taskProgress.current.tasks.find(t => t.status === "todo")?.text || "Task completed"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
