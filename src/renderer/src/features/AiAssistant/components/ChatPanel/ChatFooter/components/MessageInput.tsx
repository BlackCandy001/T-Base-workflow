import React from "react";
import { UploadedFile } from "../types";
import ChangesTree from "../../ChangesTree";
import { PlusIcon, ChevronDownIcon, SendIcon } from "./Icons";
import {
  Cpu,
  X,
  Clock,
  FileText,
  Wrench,
  Brain,
  Zap,
  Layout,
} from "lucide-react";
import { useBackendConnection } from "../../../../context/BackendConnectionContext";
import { LANGUAGES } from "../../../SettingsPanel/LanguageSelector";
import { useSettings, Account } from "../../../../context/SettingsContext";
import { useProject } from "../../../../context/ProjectContext";
import { parseAIResponse } from "../../../../services/ResponseParser";
import QuickSwitchDrawer from "./QuickSwitchDrawer";
import ToolSettingsDrawer from "./ToolSettingsDrawer";
import ContextualActionPanel from "./ContextualActionPanel";

interface MessageInputProps {
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  isHistoryMode?: boolean;
  uploadedFiles: UploadedFile[];
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  handleTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  setShowAtMenu: (show: boolean) => void;
  handleFileSelect: () => void;
  onOpenProjectStructure: () => void;
  showChangesDropdown: boolean;
  setShowChangesDropdown: (show: boolean) => void;
  messages: any[];
  handleGitCommit: () => void;
  handleSend: (model: any, account: any, thinking?: boolean) => void;
  folderPath?: string | null,
  isConversationStarted?: boolean,
  selectedQuickModel?: {
    providerId: string;
    modelId: string;
    modelName?: string;
    accountId?: string;
    favicon?: string;
    email?: string;
  } | null;
  onQuickModelSelect?: (
    model: {
      providerId: string;
      modelId: string;
      modelName?: string;
      accountId?: string;
      favicon?: string;
      email?: string;
    } | null,
  ) => void;
  currentModel: any;
  setCurrentModel: (model: any) => void;
  currentAccount: any;
  setCurrentAccount: (account: any) => void;
  onToggleTaskDrawer?: () => void;
  hasTaskProgress?: boolean;
  isProcessing?: boolean;
  // 🆕 Stop Generation Props
  isStreaming?: boolean;
  onStopGeneration?: () => void;
  // 🆕 Backup Props
  onToggleBackupDrawer?: () => void;
  hasBackupEvents?: boolean;
  backupEventCount?: number;
  // 🆕 Blacklist Props
  onToggleBlacklistDrawer?: () => void;
  isBackupEnabled?: boolean;
  isRawMode?: boolean;
  onToggleRawMode?: () => void;
  // 🆕 Account Props
  onToggleAccountDrawer?: () => void;
  hasResolvedModel?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  message,
  isHistoryMode = false,
  uploadedFiles,
  textareaRef,
  handleTextareaChange,
  handleKeyDown,
  handlePaste,
  handleDragOver,
  handleDrop,
  handleFileSelect,
  showChangesDropdown,
  setShowChangesDropdown,
  messages,
  handleGitCommit,
  handleSend,
  folderPath,
  isConversationStarted,
  selectedQuickModel,
  onQuickModelSelect,
  currentModel,
  setCurrentModel,
  currentAccount,
  setCurrentAccount,
  onToggleTaskDrawer,
  hasTaskProgress,
  isProcessing,
  isStreaming,
  onStopGeneration,
  onToggleBackupDrawer,
  backupEventCount,
  isRawMode,
  onToggleRawMode,
  hasResolvedModel,
}) => {
  const { isConnected, isElaraMismatch } = useBackendConnection();
  const {
    apiUrl,
    accounts,
    fetchAccounts,
    providers,
    fetchProviders,
    isLoadingCache,
    language: preferredLanguage,
  } = useSettings();
  const pendingAccountIdRef = React.useRef<string | null>(null);

  // 🆕 Quick Model Switcher Logic
  const [isQuickModelDropdownOpen, setIsQuickModelDropdownOpen] =
    React.useState(false);

  // 🆕 Tool Settings Drawer Logic
  const [isToolSettingsOpen, setIsToolSettingsOpen] = React.useState(false);

  // 🆕 Capabilities Logic
  const [thinkingEnabled, setThinkingEnabled] = React.useState(false);

  // Derive current provider config
  const currentProviderConfig = React.useMemo(() => {
    if (!currentModel?.providerId) return null;
    return providers.find(
      (p) =>
        p.provider_id?.toLowerCase() === currentModel.providerId?.toLowerCase(),
    );
  }, [currentModel, providers]);

  const supportsUpload = React.useMemo(() => {
    if (!currentProviderConfig) return false;
    return !!currentProviderConfig.is_upload;
  }, [currentProviderConfig]);

  const supportsThinking = React.useMemo(() => {
    if (!currentModel) return false;
    // Check if model supports thinking (usually inferred from ID or specific config)
    // For DeepSeek R1, it's often implicit or via regex on ID
    // or if the model object has a 'capabilities' field (mocked for now)
    // Assuming DeepSeek Reasoner models contain "reasoner" or "r1"
    const modelId = (currentModel.id || "").toLowerCase();
    const modelName = (currentModel.name || "").toLowerCase();
    return (
      modelId.includes("reasoner") ||
      modelId.includes("r1") ||
      modelName.includes("reasoner") ||
      modelName.includes("r1")
    );
    // TODO: In future, this should come from API model definition
  }, [currentModel]);

  const quickModelDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        quickModelDropdownRef.current &&
        !quickModelDropdownRef.current.contains(event.target as Node)
      ) {
        setIsQuickModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Load API URL
  React.useEffect(() => {
    const storage = (window as any).storage;
    if (storage) {
      storage.get("backend-api-url").then((res: any) => {
        if (res?.value) {
          // setApiUrl(res.value); // apiUrl is now from useSettings
        }
      });
    }
  }, []);

  // Initial fetch
  React.useEffect(() => {
    fetchProviders();
    fetchAccounts();
  }, [fetchProviders, fetchAccounts]);

  // Load saved selection and language
  React.useEffect(() => {
    const loadSelection = async () => {
      const storage = (window as any).storage;
      if (!storage) {
        // setIsLoadingCache(false); // isLoadingCache is now from useSettings
        return;
      }

      // setIsLoadingCache(true); // isLoadingCache is now from useSettings
      const key = `zen-model-selection:${folderPath || "global"}`;
      try {
        const [selectionRes] = await Promise.all([storage.get(key)]);

        if (selectionRes?.value) {
          const saved = JSON.parse(selectionRes.value);
          if (saved.model) setCurrentModel(saved.model);
          if (saved.accountId) {
            pendingAccountIdRef.current = saved.accountId;
            if (saved.email) {
              setCurrentAccount({ id: saved.accountId, email: saved.email });
            }
          }
        }
      } catch (e) {
        // console.error("Failed to load selection", e);
      } finally {
        // setIsLoadingCache(false); // isLoadingCache is now from useSettings
      }
    };
    loadSelection();
  }, [folderPath, setCurrentModel, setCurrentAccount]);

  // Save selection
  React.useEffect(() => {
    if (currentModel) {
      const storage = (window as any).storage;
      if (storage) {
        const key = `zen-model-selection:${folderPath || "global"}`;
        const data = {
          model: currentModel,
          accountId: currentAccount?.id,
          email: currentAccount?.email,
        };
        storage.set(key, JSON.stringify(data));
      }
    }
  }, [
    currentModel,
    currentAccount,
    folderPath,
    setCurrentModel,
    setCurrentAccount,
  ]);

  // Handle auto-selection of account from cache once providers and accounts are loaded
  React.useEffect(() => {
    if (
      pendingAccountIdRef.current &&
      providers.length > 0 &&
      accounts.length > 0 &&
      !currentAccount?.email &&
      currentModel?.providerId
    ) {
      const acc = accounts.find(
        (a: Account) =>
          a.id === pendingAccountIdRef.current &&
          a.provider_id === currentModel.providerId,
      );
      if (acc) {
        setCurrentAccount({ id: acc.id, email: acc.email });
        pendingAccountIdRef.current = null; // Mark as resolved
      }
    }
  }, [
    providers,
    accounts,
    currentModel,
    currentAccount,
    setCurrentAccount,
  ]);
  
  const { setNodes, setEdges } = useProject();
  const [appliedLatest, setAppliedLatest] = React.useState(false);
  const [dismissedDiagramId, setDismissedDiagramId] = React.useState<string | null>(null);

  // Find latest diagram in history
  const latestDiagram = React.useMemo(() => {
    if (!messages || messages.length === 0) return null;
    
    // Scan messages from newest to oldest
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "assistant" && msg.content) {
        const parsed = parseAIResponse(msg.content);
        if (parsed.diagrams && parsed.diagrams.length > 0) {
          const diagram = parsed.diagrams[parsed.diagrams.length - 1];
          // Use a hash or ID to identify the diagram. 
          // Since diagram object might not have unique ID, we can use message ID or index.
          const diagramId = `diag-${i}`; 
          if (dismissedDiagramId === diagramId) return null;
          return { ...diagram, id: diagramId };
        }
      }
    }
    return null;
  }, [messages, dismissedDiagramId]);

  const handleApplyToCanvas = () => {
    if (latestDiagram) {
      setNodes(latestDiagram.nodes);
      setEdges(latestDiagram.edges);
      setAppliedLatest(true);
      setTimeout(() => setAppliedLatest(false), 3000);
    }
  };

  return (
    <div
      style={{
        padding: "var(--spacing-md) var(--spacing-lg)",
        paddingBottom: "var(--spacing-lg)",
        backgroundColor: "var(--primary-bg)",
        position: "relative",
        borderTop: "1px solid var(--border-color)",
        zIndex: 10,
      }}
    >
      {showChangesDropdown && (
        <ChangesTree
          messages={messages}
          onCommit={handleGitCommit}
          onClose={() => setShowChangesDropdown(false)}
        />
      )}

      <ToolSettingsDrawer
        isOpen={isToolSettingsOpen}
        onClose={() => setIsToolSettingsOpen(false)}
      />

      <div
        className="animate-fade-in-up"
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--secondary-bg)",
          border: !isConnected ? "1.5px solid var(--error-color)" : "1px solid var(--border-color)",
          boxShadow: "var(--shadow-md)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          marginTop: "24px",
          padding: "2px",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "var(--shadow-lg)";
          e.currentTarget.style.borderColor = "var(--accent-color)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "var(--shadow-md)";
          e.currentTarget.style.borderColor = isConnected ? "var(--border-color)" : "var(--error-color)";
        }}
      >
        <ContextualActionPanel
          isVisible={!!latestDiagram}
          onApply={handleApplyToCanvas}
          onDismiss={() => {
            if (latestDiagram?.id) {
              setDismissedDiagramId(latestDiagram.id);
            }
          }}
          applied={appliedLatest}
          nodeCount={latestDiagram?.nodes?.length || 0}
          edgeCount={latestDiagram?.edges?.length || 0}
        />
        {/* Badges Block */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", position: "absolute", bottom: "100%", left: "12px", marginBottom: "-1px", zIndex: 20 }}>
          {selectedQuickModel && (
            <div
              className="hover-glow"
              style={{
                backgroundColor: "var(--accent-bg-transparent)",
                color: "var(--accent-color)",
                padding: "6px 12px",
                fontSize: "11px",
                fontWeight: 700,
                borderTopLeftRadius: "var(--radius-md)",
                borderTopRightRadius: "var(--radius-md)",
                border: "1px solid var(--accent-color)",
                borderBottom: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 -4px 12px rgba(0,0,0,0.15)",
                backdropFilter: "blur(8px)",
              }}
            >
              {selectedQuickModel.favicon ? (
                <img src={selectedQuickModel.favicon} alt="icon" style={{ width: "12px", height: "12px", borderRadius: "2px" }} 
                     onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : (
                <Cpu size={12} strokeWidth={2.5} />
              )}
              <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedQuickModel.providerId}/{selectedQuickModel.modelId}
              </span>
              <X size={14} style={{ cursor: "pointer", opacity: 0.7 }} onClick={(e) => { e.stopPropagation(); onQuickModelSelect?.(null); }} />
            </div>
          )}

          {(!isConversationStarted || currentModel) && (
            <div
              className="hover-glow"
              onClick={() => setIsQuickModelDropdownOpen(true)}
              style={{
                backgroundColor: "var(--secondary-bg)",
                color: "var(--primary-text)",
                padding: "6px 12px",
                fontSize: "11px",
                fontWeight: 700,
                borderTopLeftRadius: "var(--radius-md)",
                borderTopRightRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                borderBottom: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 -4px 12px rgba(0,0,0,0.15)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {currentModel ? (
                <>
                  {currentModel.favicon ? (
                    <img src={currentModel.favicon} alt="icon" style={{ width: "12px", height: "12px", borderRadius: "2px" }}
                         onError={(e) => (e.currentTarget.style.display = "none")} />
                  ) : (
                    <Cpu size={12} />
                  )}
                  <span>{currentModel.providerId}/{currentModel.id}</span>
                  <span style={{ opacity: 0.6, display: 'flex' }}><ChevronDownIcon size={12} /></span>
                </>
              ) : (
                <>
                  <Cpu size={12} />
                  <span>Select Brain</span>
                  <span style={{ opacity: 0.6, display: 'flex' }}><ChevronDownIcon size={12} /></span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{ position: "relative", padding: "12px 16px 8px 16px", backgroundColor: "transparent" }}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!currentModel && !selectedQuickModel && !hasResolvedModel) {
                  setIsQuickModelDropdownOpen(true);
                  if (providers.length === 0) fetchProviders();
                  return;
                }
                handleSend(currentModel, currentAccount, thinkingEnabled);
              } else {
                handleKeyDown(e);
              }
            }}
            onPaste={(e) => {
              if (!supportsUpload && e.clipboardData.files.length > 0) {
                e.preventDefault();
                return;
              }
              handlePaste(e);
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => {
              if (!supportsUpload) {
                e.preventDefault();
                return;
              }
              handleDrop(e);
            }}
            placeholder={
              isHistoryMode ? "History mode - sending messages is disabled" :
              !isConnected ? "Backend connection lost..." :
              isLoadingCache ? "Wait, loading brain data..." :
              isProcessing ? "Assistant is crafting a response..." :
              "Ask Zen anything or type @ to mention files..."
            }
            disabled={isHistoryMode || !isConnected || isLoadingCache || isProcessing}
            rows={1}
            style={{
              width: "100%",
              minHeight: "28px",
              maxHeight: "240px",
              border: "none",
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
              fontSize: "14px",
              lineHeight: "1.5",
              backgroundColor: "transparent",
              color: "var(--primary-text)",
              overflow: "auto",
              opacity: isHistoryMode || !isConnected || isLoadingCache || isProcessing ? 0.5 : 1,
              cursor: isHistoryMode || !isConnected || isLoadingCache || isProcessing ? "not-allowed" : "text",
              padding: "2px 0",
            }}
          />
        </div>

        {/* Toolbar */}
        <div
          style={{
            padding: "8px 12px 10px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.02)",
            borderBottomLeftRadius: "var(--radius-lg)",
            borderBottomRightRadius: "var(--radius-lg)",
          }}
        >
          {/* Left Toolbar Items */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {supportsUpload && (
              <button
                className="interactive-element"
                onClick={handleFileSelect}
                title="Attach files"
                style={{ padding: "6px", borderRadius: "var(--radius-sm)", color: "var(--secondary-text)"}}
              >
                <PlusIcon />
              </button>
            )}

            <div style={{ width: "1px", height: "16px", backgroundColor: "var(--border-color)", margin: "0 4px", opacity: 0.5 }} />

            {isConversationStarted && (
              <>
                {hasTaskProgress && (
                  <button
                    className="interactive-element"
                    onClick={onToggleTaskDrawer}
                    title="Task Progress"
                    style={{ padding: "6px", borderRadius: "var(--radius-sm)", color: "var(--secondary-text)"}}
                  >
                    <Layout size={16} strokeWidth={2} />
                  </button>
                )}
                {onToggleBackupDrawer && (
                  <button
                    className="interactive-element"
                    onClick={onToggleBackupDrawer}
                    title="Backup History"
                    style={{ padding: "6px", borderRadius: "var(--radius-sm)", color: "var(--secondary-text)", position: "relative"}}
                  >
                    <Clock size={16} />
                    {backupEventCount !== undefined && backupEventCount > 0 && (
                      <span style={{ position: "absolute", top: "2px", right: "2px", width: "8px", height: "8px", backgroundColor: "var(--accent-color)", borderRadius: "50%", border: "1.5px solid var(--secondary-bg)" }} />
                    )}
                  </button>
                )}
              </>
            )}

            <button
              className="interactive-element"
              onClick={onToggleRawMode}
              title={isRawMode ? "Switch to Processed Mode" : "Switch to Raw Mode"}
              style={{ padding: "6px", borderRadius: "var(--radius-sm)", color: isRawMode ? "var(--accent-color)" : "var(--secondary-text)"}}
            >
              <FileText size={16} />
            </button>

            <button
              className="interactive-element"
              onClick={() => setIsToolSettingsOpen(!isToolSettingsOpen)}
              title="Tool Settings"
              style={{ padding: "6px", borderRadius: "var(--radius-sm)", color: isToolSettingsOpen ? "var(--accent-color)" : "var(--secondary-text)"}}
            >
              <Wrench size={16} />
            </button>

            {supportsThinking && (
              <button
                className={`interactive-element ${thinkingEnabled ? 'animate-pulse' : ''}`}
                onClick={() => setThinkingEnabled(!thinkingEnabled)}
                title={thinkingEnabled ? "Disable Deep Thinking" : "Enable Deep Thinking"}
                style={{ padding: "6px", borderRadius: "var(--radius-sm)", color: thinkingEnabled ? "var(--purple-color, #a855f7)" : "var(--secondary-text)"}}
              >
                <Brain size={16} />
              </button>
            )}
          </div>

          {/* Right Action Items */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              className="interactive-element"
              onClick={() => {
                if (isStreaming && onStopGeneration) {
                  onStopGeneration();
                  return;
                }
                if (!currentModel && !selectedQuickModel && !hasResolvedModel) {
                  setIsQuickModelDropdownOpen(true);
                  if (providers.length === 0) fetchProviders();
                  return;
                }
                handleSend(currentModel, currentAccount, thinkingEnabled);
              }}
              disabled={isHistoryMode || isLoadingCache || (!isStreaming && !message.trim() && uploadedFiles.length === 0)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-md)",
                backgroundColor: isStreaming ? "var(--error-color)" : (message.trim() || uploadedFiles.length > 0 ? "var(--accent-color)" : "var(--tertiary-bg)"),
                color: (isStreaming || message.trim() || uploadedFiles.length > 0) ? "white" : "var(--secondary-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                border: "none",
                cursor: (isStreaming || message.trim() || uploadedFiles.length > 0) ? "pointer" : "default",
                boxShadow: (message.trim() || uploadedFiles.length > 0) ? "var(--accent-glow)" : "none",
              }}
            >
              {isStreaming ? <X size={20} strokeWidth={3} /> : <SendIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Language Badge */}
      {isConnected && !isElaraMismatch && LANGUAGES.some((l) => l.code === preferredLanguage) && (
        <div
          style={{
            position: "absolute",
            top: "14px",
            right: "24px",
            backgroundColor: "var(--tertiary-bg)",
            color: "var(--secondary-text)",
            padding: "2px 8px",
            borderRadius: "var(--radius-sm)",
            fontSize: "10px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "5px",
            opacity: 0.8,
            border: "1px solid var(--border-color)",
          }}
        >
          <span>{LANGUAGES.find((l: any) => l.code === preferredLanguage)?.flag || "🇺🇸"}</span>
          <span style={{ letterSpacing: "0.5px" }}>{preferredLanguage.toUpperCase()}</span>
        </div>
      )}

      {/* Error/Mismatch Badges */}
      {!isConnected && (
        <div
          className="animate-pulse"
          onClick={() => window.postMessage({ command: "showSettings" }, "*")}
          style={{
            position: "absolute",
            bottom: "100%",
            right: "24px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            color: "var(--error-color)",
            padding: "6px 14px",
            fontSize: "11px",
            fontWeight: 700,
            borderTopLeftRadius: "var(--radius-md)",
            borderTopRightRadius: "var(--radius-md)",
            border: "1.5px solid var(--error-color)",
            borderBottom: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "-1px",
          }}
        >
          <X size={12} strokeWidth={3} />
          Connection Down
        </div>
      )}
      {isConnected && isElaraMismatch && (
        <div
          onClick={() => {
            const vscodeApi = (window as any).vscodeApi;
            if (vscodeApi) vscodeApi.postMessage({ command: "openExternal", url: "https://github.com/KhanhRomVN/Elara" });
          }}
          style={{
            position: "absolute",
            bottom: "100%",
            right: "24px",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            color: "var(--yellow-color, #eab308)",
            padding: "6px 14px",
            fontSize: "11px",
            fontWeight: 700,
            borderTopLeftRadius: "var(--radius-md)",
            borderTopRightRadius: "var(--radius-md)",
            border: "1.5px solid var(--yellow-color, #eab308)",
            borderBottom: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "-1px",
          }}
        >
          <Zap size={12} fill="currentColor" />
          Elara Mismatch
        </div>
      )}

      <div ref={quickModelDropdownRef}>
        <QuickSwitchDrawer
          isOpen={isQuickModelDropdownOpen}
          onClose={() => setIsQuickModelDropdownOpen(false)}
          providers={providers}
          apiUrl={apiUrl}
          onSelect={(selected) => {
            // Find provider and model to extract name and favicon
            const prov = providers.find(
              (p: any) => p.provider_id === selected.providerId,
            );
            const modelObj = prov?.models?.find(
              (m: any) => m.id === selected.modelId,
            );
            const modelName = modelObj?.name || selected.modelId;

            let faviconUrl = "";
            if (prov?.website) {
              try {
                const u = new URL(prov.website);
                faviconUrl = `${u.origin}/favicon.ico`;
              } catch {
                // ignore
              }
            }

            // Rescue missing currentModel even in active conversations:
            if (
              (!isConversationStarted || !currentModel) &&
              setCurrentModel &&
              setCurrentAccount
            ) {
              setCurrentModel({
                ...selected,
                id: selected.modelId,
                name: modelName,
                favicon: faviconUrl,
              });
              setCurrentAccount({
                id: selected.accountId,
                email: selected.email,
              });
            } else if (onQuickModelSelect) {
              onQuickModelSelect({
                ...selected,
                modelName: modelName,
                email: selected.email,
                favicon: faviconUrl,
              });
            }
          }}
        />
      </div>
    </div>
  );
};

export default MessageInput;
