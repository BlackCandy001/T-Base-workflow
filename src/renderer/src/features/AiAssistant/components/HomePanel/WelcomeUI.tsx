import React, { useState, useEffect, useCallback } from "react";
import { Zap, Search, Clock, Loader2, FolderOpen, MessageSquare } from "lucide-react";
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
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Fetch history logic
  const fetchHistory = useCallback(() => {
    setIsLoading(true);
    const vscodeApi = (window as any).vscodeApi;
    if (vscodeApi) {
      vscodeApi.postMessage({
        command: "getHistory",
        requestId: `welcome-hist-${Date.now()}`,
      });
    }

    setTimeout(() => {
      setIsLoading(false);
    }, 5000);
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
    .slice(0, 10);

  return (
    <div
      className="zen-scrollbar animate-fade-in-up"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "var(--spacing-xl) var(--spacing-lg) var(--spacing-md) var(--spacing-lg)",
        color: "var(--primary-text)",
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
          gap: "16px",
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
            marginBottom: "8px",
          }}
        >
          <div
            className="hover-glow"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--accent-color)",
              boxShadow: "var(--accent-glow)",
            }}
          >
            {imagesUri ? (
              <img
                src={`${imagesUri}/icon.png`}
                alt="Zen Logo"
                style={{
                  width: "28px",
                  height: "28px",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement!.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
                }}
              />
            ) : (
              <Zap size={24} color="white" fill="white" />
            )}
          </div>

          <h1
            style={{
              fontSize: "36px",
              fontWeight: 800,
              margin: 0,
              background: "linear-gradient(135deg, var(--primary-text) 0%, var(--secondary-text) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            Zen
          </h1>
        </div>

        {/* Dynamic Slogan Section */}
        <div style={{ height: "24px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
          <div
            key={sloganIndex}
            style={{
              fontSize: "15px",
              color: "var(--secondary-text)",
              fontWeight: 500,
              animation: "slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              whiteSpace: "nowrap",
              letterSpacing: "0.01em",
            }}
          >
            {SLOGANS[sloganIndex]}
          </div>
        </div>

        {/* Get Started Card */}
        <div
          className="hover-glow"
          style={{
            padding: "20px 24px",
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(145deg, var(--secondary-bg) 0%, var(--tertiary-bg) 100%)",
            border: "1px solid color-mix(in srgb, var(--accent-color) 20%, var(--border-color))",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            textAlign: "left",
            width: "100%",
            marginBottom: "32px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div 
              style={{ 
                padding: "10px", 
                backgroundColor: "var(--accent-bg-transparent)", 
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "pulseGlow 2s infinite"
              }}
            >
              <Zap size={22} color="var(--accent-color)" fill="var(--accent-color)" strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px 0", color: "var(--primary-text)" }}>
                Get Started with Zen
              </h3>
              <p style={{ fontSize: "13px", color: "var(--secondary-text)", lineHeight: "1.5", margin: 0 }}>
                Connect your AI accounts to unlock unlimited intelligence and start building with your favorite models.
              </p>
            </div>
          </div>
          
          <button
            className="interactive-element"
            onClick={() => {
              window.postMessage({ command: "showAccountDrawer" }, "*");
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: "transparent",
              color: "var(--accent-color)",
              border: "1.5px solid var(--accent-color)",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "center",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--accent-color)";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--accent-color)";
            }}
          >
            Connect All Accounts
          </button>
        </div>
      </div>

      {/* Recent Conversations Section */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          marginTop: "8px",
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
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <Clock size={14} strokeWidth={2} />
            <span>Recent Conversations</span>
          </div>

          {/* Search History */}
          <div style={{ position: "relative", width: "180px" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--secondary-text)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 12px 6px 30px",
                fontSize: "12px",
                backgroundColor: "var(--tertiary-bg)",
                border: "1px solid var(--border-color)",
                borderRadius: "10px",
                color: "var(--primary-text)",
                outline: "none",
                transition: "all var(--transition-fast)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-color)";
                e.currentTarget.style.boxShadow = "var(--accent-glow)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.boxShadow = "none";
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
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", color: "var(--secondary-text)", gap: "8px" }}>
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
              className="animate-fade-in-up"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 24px",
                backgroundColor: "var(--secondary-bg)",
                border: "1px dashed var(--border-color)",
                borderRadius: "var(--radius-md)",
                color: "var(--secondary-text)",
                textAlign: "center",
                gap: "16px",
              }}
            >
              <div 
                className="animate-float"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  backgroundColor: "color-mix(in srgb, var(--secondary-text) 10%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--secondary-text)",
                }}
              >
                <MessageSquare size={24} strokeWidth={1.5} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--primary-text)", marginBottom: "4px" }}>
                  {searchQuery ? "No matches found" : "No conversations found"}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.7 }}>
                  {searchQuery ? `We couldn't find anything matching "${searchQuery}"` : "Your new chats will appear here. Start a conversation below!"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
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
