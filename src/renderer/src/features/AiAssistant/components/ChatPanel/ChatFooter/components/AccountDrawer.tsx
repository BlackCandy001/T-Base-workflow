import React from "react"
import AccountManager from "../../../SettingsPanel/AccountManager"

interface AccountDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const AccountDrawer: React.FC<AccountDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: "absolute",
        bottom: "100%", // Pop up above the trigger area
        left: 0,
        right: 0,
        marginBottom: "8px",
        backgroundColor: "rgba(24, 24, 27, 0.95)", // Solid dark zinc base
        backdropFilter: "blur(16px)", // Glassmorphism
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "12px",
        boxShadow: "0 -8px 24px rgba(0, 0, 0, 0.5)",
        zIndex: 1000,
        height: "400px",
        maxHeight: "65vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "slideUpDrawer 0.2s ease-out",
        color: "var(--primary-text)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          backgroundColor: "rgba(0, 0, 0, 0.2)", // Sleek separated header
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--primary-text)",
          }}
        >
          AI Accounts
        </span>
        <div
          onClick={onClose}
          style={{
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            color: "var(--secondary-text)",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--hover-bg)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
          title="Close"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
        }}
      >
        <AccountManager />
      </div>
    </div>
  )
}

export default AccountDrawer
