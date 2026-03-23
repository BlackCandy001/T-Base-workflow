import React, { useState } from "react";
import { RefreshCw } from "lucide-react";

// Icon map for known providers using Google's favicon service
export const PROVIDER_ICONS: Record<string, string> = {
  gemini: "https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06.svg",
  claude: "https://www.anthropic.com/favicon.ico",
  deepseek: "https://chat.deepseek.com/favicon.ico",
  cerebras: "https://cerebras.ai/favicon.ico",
  groq: "https://groq.com/favicon.ico",
  mistral: "https://mistral.ai/favicon.ico",
  huggingchat: "https://huggingface.co/favicon.ico",
  kimi: "https://kimi.moonshot.cn/favicon.ico",
  qwen: "https://chat.qwen.ai/favicon.ico",
  geminicli: "https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06.svg",
  qwencli: "https://chat.qwen.ai/favicon.ico",
};

// Colors for fallback letter avatars
export const PROVIDER_COLORS: Record<string, string> = {
  gemini: "#4285F4",
  claude: "#D97706",
  deepseek: "#2563EB",
  cerebras: "#7C3AED",
  groq: "#059669",
  mistral: "#DC2626",
  huggingchat: "#F59E0B",
  kimi: "#0EA5E9",
  qwen: "#8B5CF6",
};

interface ProviderIconProps {
  provider: {
    provider_id?: string;
    id?: string;
    name?: string;
    favicon?: string;
  };
  size?: number;
  className?: string;
}

export const ProviderIcon: React.FC<ProviderIconProps> = ({ provider, size = 24, className }) => {
  const [imgError, setImgError] = useState(false);
  
  // Normalize provider ID
  const pId = provider.provider_id || provider.id || "";
  
  const iconUrl = PROVIDER_ICONS[pId] || provider.favicon;
  const color = PROVIDER_COLORS[pId] || "var(--accent-color)";
  const letter = (provider.name || pId || "?").charAt(0).toUpperCase();

  if (iconUrl && !imgError) {
    return (
      <img
        src={iconUrl}
        style={{ width: size, height: size, borderRadius: "4px", objectFit: "contain" }}
        className={className}
        alt=""
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback: colored letter avatar
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "6px",
        backgroundColor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.5,
        fontWeight: 700,
        color: "white",
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
};

export default ProviderIcon;
