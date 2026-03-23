import React, { useState, useEffect, useCallback } from "react";
import { Zap, Search, History, Loader2, FolderOpen } from "lucide-react";
import { ConversationItem } from "../HistoryPanel/types";
import HistoryCard from "../HistoryPanel/HistoryCard";

const SLOGANS = [
  "Feel Free Chat Free",
  "Chat Free With All Model In the World",
  "Limitless Intelligence, Zero Cost",
  "Powering Your Code with Global AI",
  "High-Performance Chat, Powered by Zen",
  "Your Gateway to All AI Models",
];

interface WelcomeUIProps {
  onLoadConversation?: (
    conversationId: string,
    tabId: number,
    folderPath: string | null,
  ) => void;
}

const WelcomeUI: React.FC<WelcomeUIProps> = ({ onLoadConversation }) => {
  const imagesUri = (window as any).__zenImagesUri;
  const [sloganIndex, setSloganIndex] = useState(0);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setSloganIndex((prev) => (prev + 1) % SLOGANS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Fetch history logic
  const fetchHistory = useCallback(() => {
    setIsLoading(true);
    // Request history
    const vscodeApi = (window as any).vscodeApi;
    if (vscodeApi) {
      vscodeApi.postMessage({
        command: "getHistory",
        requestId: `welcome-hist-${Date.now()}`,
      });
    }

    // Backup timeout if no response arrives
    setTimeout(() => {
      setIsLoading(false);
    }, 5000); // 5s timeout
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === "historyResult") {
        if (message.history) {
          setConversations(message.history);
        }
        setIsLoading(false);
      } else if (message.command === "deleteConversationResult") {
        if (message.success) {
          setConversations((prev) =>
            prev.filter((c) => c.id !== message.conversationId),
          );
        }
      } else if (
        message.command === "deleteConfirmed" &&
        message.conversationId
      ) {
        const vscodeApi = (window as any).vscodeApi;
        if (vscodeApi) {
          vscodeApi.postMessage({
            command: "deleteConversation",
            conversationId: message.conversationId,
          });
        }
      } else if (message.command === "clearAllConfirmed") {
        const vscodeApi = (window as any).vscodeApi;
        if (vscodeApi) {
          vscodeApi.postMessage({
            command: "deleteAllConversations",
          });
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Initial load
    fetchHistory();

    return () => window.removeEventListener("message", handleMessage);
  }, [fetchHistory]);

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const vscodeApi = (window as any).vscodeApi;
    if (vscodeApi) {
      vscodeApi.postMessage({
        command: "confirmDelete",
        conversationId: id,
      });
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    const h = date.getHours().toString().padStart(2, "0");
    const min = date.getMinutes().toString().padStart(2, "0");
    return `${d}/${m}/${y} ${h}:${min}`;
  };

  const filteredConversations = conversations
    .filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.preview.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      const timeA = new Date(
        a.lastModified || a.timestamp || a.createdAt || 0,
      ).getTime();
      const timeB = new Date(
        b.lastModified || b.timestamp || b.createdAt || 0,
      ).getTime();
      return timeB - timeA;
    })
    .slice(0, 10); // Show top 10 recent

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "var(--spacing-xl) var(--spacing-md)",
        color: "var(--primary-text)",
        animation: "fadeIn 0.5s ease-out",
        maxWidth: "600px",
        margin: "0 auto",
        width: "100%",
        height: "100%",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px", // Reduced from 24px
          textAlign: "center",
          width: "100%",
        }}
      >
        {/* Horizontal Header Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--accent-color)", // Fallback color
            }}
          >
            {imagesUri ? (
              <img
                src={`${imagesUri}/icon.png`}
                alt="Zen Logo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement!.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
                }}
              />
            ) : (
              <Zap size={24} color="white" />
            )}
          </div>

          <h1
            style={{
              fontSize: "36px",
              fontWeight: 800,
              margin: 0,
              background:
                "linear-gradient(to right, var(--primary-text), var(--secondary-text))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
            }}
          >
            Zen
          </h1>
        </div>

        {/* Dynamic Slogan Section */}
        <div
          style={{
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            margin: "0 0 8px 0", // Reduced from 16px
          }}
        >
          <div
            key={sloganIndex}
            style={{
              fontSize: "18px",
              color: "var(--secondary-text)",
              fontWeight: 500,
              animation: "slideUp 0.4s ease-out",
              whiteSpace: "nowrap",
            }}
          >
            {SLOGANS[sloganIndex]}
          </div>
        </div>

        {/* Elara Requirement Alert */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "12px",
            backgroundColor: "rgba(234, 179, 8, 0.05)",
            border: "1px solid rgba(234, 179, 8, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            textAlign: "left",
            width: "100%",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Zap size={20} color="#eab308" style={{ flexShrink: 0 }} />
            <div
              style={{
                fontSize: "12px",
                color: "var(--primary-text)",
                lineHeight: "1.4",
              }}
            >
              <strong style={{ color: "#eab308" }}>Get Started:</strong> Connect
              your AI accounts to start chatting with models.
            </div>
          </div>
          <button
            onClick={() => {
              window.postMessage({ command: "showAccountDrawer" }, "*");
            }}
            style={{
              padding: "6px 12px",
              backgroundColor: "var(--accent-color)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Connect Account
          </button>
        </div>
      </div>

      {/* History Section */}
      <div
        className="welcome-history-section"
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 4px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--secondary-text)",
            }}
          >
            <History size={14} />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Recent Conversations
            </span>
          </div>

          <div style={{ position: "relative", width: "180px" }}>
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "4px 8px 4px 28px",
                fontSize: "11px",
                backgroundColor: "var(--input-bg)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                color: "var(--primary-text)",
                outline: "none",
              }}
            />
            <Search
              size={12}
              style={{
                position: "absolute",
                left: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--secondary-text)",
              }}
            />
          </div>
        </div>

        <div
          className="welcome-history-section-list"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            maxHeight: "350px",
            overflowY: "auto",
            paddingRight: "0",
          }}
        >
          {isLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px",
                color: "var(--secondary-text)",
                gap: "8px",
              }}
            >
              <Loader2 size={16} className="spin-animation" />
              <span style={{ fontSize: "12px" }}>Loading history...</span>
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onClick={() => {
                  if (onLoadConversation) {
                    onLoadConversation(item.id, item.tabId, item.folderPath);
                  }
                }}
                onDelete={handleDeleteConversation}
                formatDate={formatDate}
              />
            ))
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px 16px",
                backgroundColor: "var(--secondary-bg)",
                border: "1px dashed var(--border-color)",
                borderRadius: "8px",
                color: "var(--secondary-text)",
                fontSize: "13px",
                textAlign: "center",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              {searchQuery ? (
                <>
                  <Search size={24} style={{ opacity: 0.5 }} />
                  <span>No matches found for "{searchQuery}"</span>
                </>
              ) : (
                <>
                  <FolderOpen size={24} style={{ opacity: 0.5 }} />
                  <span>No recent conversations found.</span>
                  <span style={{ fontSize: "12px", opacity: 0.8 }}>Your new chats will appear here.</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* Custom Scrollbar for history list - Hidden but scrollable */
        .welcome-history-section-list::-webkit-scrollbar {
          display: none;
        }
        .welcome-history-section-list {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default WelcomeUI;
