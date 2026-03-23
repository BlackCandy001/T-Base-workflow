import React, { useState, useEffect } from "react";
import { useSettings, Account } from "../../context/SettingsContext";
import { Trash2, Plus, Loader2 } from "lucide-react";

import ProviderIcon from "../common/ProviderIcon";
const AccountManager: React.FC = () => {
  const { accounts, fetchAccounts, apiUrl } = useSettings();
  const [isAdding, setIsAdding] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdding) {
      fetchProviders();
    }
  }, [isAdding]);

  const fetchProviders = async () => {
    try {
      const response = await fetch(`${apiUrl}/v1/providers`);
      const result = await response.json();
      if (result.success) {
        setProviders(result.data.filter((p: any) => p.is_enabled));
      }
    } catch (err) {
      setError("Failed to fetch providers");
    }
  };

  const handleLogin = async (providerId: string) => {
    setIsLoggingIn(providerId);
    setError(null);
    try {
      const loginUrl = `${apiUrl}/v1/accounts/login/${providerId}`;
      
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "basic" }),
      });
      
      const result = await response.json();
      if (result.success && result.account) {
        // Save the returned account credentials to the database
        const saveResponse = await fetch(`${apiUrl}/v1/accounts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result.account),
        });
        const saveResult = await saveResponse.json();
        if (!saveResult.success) {
          setError(saveResult.message || "Login succeeded but failed to save account");
        } else {
          await fetchAccounts();
          setIsAdding(false);
        }
      } else if (result.success) {
        // Fallback: login succeeded but no account data returned
        await fetchAccounts();
        setIsAdding(false);
      } else {
        setError(result.message || "Login failed");
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoggingIn(null);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    try {
      const response = await fetch(`${apiUrl}/v1/accounts/${accountId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        await fetchAccounts();
      } else {
        setError(result.message || "Failed to delete account");
      }
    } catch (err) {
      setError("An error occurred while deleting the account");
    }
  };

  return (
    <div className="account-manager" style={{ marginTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--primary-text)" }}>AI Accounts</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            fontSize: "12px",
            backgroundColor: isAdding ? "rgba(255, 255, 255, 0.1)" : "var(--accent-color)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {isAdding ? "Cancel" : <><Plus size={14} /> Add Account</>}
        </button>
      </div>

      {error && (
        <div style={{ padding: "8px", backgroundColor: "rgba(244, 67, 54, 0.1)", color: "#f44336", borderRadius: "4px", marginBottom: "12px", fontSize: "12px" }}>
          {error}
        </div>
      )}

      {isAdding && (
        <div style={{ backgroundColor: "rgba(0, 0, 0, 0.2)", padding: "12px", borderRadius: "8px", marginBottom: "16px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <h4 style={{ margin: "0 0 12px 0", fontSize: "12px", opacity: 0.8 }}>Select AI Provider</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "8px" }}>
            {providers.map((provider) => (
              <button
                key={provider.provider_id}
                onClick={() => handleLogin(provider.provider_id)}
                disabled={!!isLoggingIn}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 8px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  cursor: isLoggingIn ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => !isLoggingIn && (e.currentTarget.style.borderColor = "var(--accent-color)")}
                onMouseLeave={(e) => !isLoggingIn && (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)")}
              >
                <ProviderIcon provider={provider} size={28} />
                <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--primary-text)" }}>{provider.name}</span>
                {isLoggingIn === provider.provider_id && <Loader2 size={12} className="animate-spin" />}
              </button>
            ))}
          </div>
          {isLoggingIn && (
            <div style={{ marginTop: "12px", textAlign: "center", fontSize: "12px", color: "var(--accent-color)" }}>
              <Loader2 size={14} className="animate-spin" style={{ display: "inline", marginRight: "6px" }} />
              Please complete login in the opened browser window...
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {accounts.length === 0 ? (
          <div style={{ padding: "24px 20px", textAlign: "center", opacity: 0.6, fontSize: "13px", border: "1px dashed rgba(255, 255, 255, 0.2)", borderRadius: "8px", backgroundColor: "rgba(0, 0, 0, 0.1)" }}>
            No accounts added yet.
          </div>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "8px" }}>
                  <ProviderIcon provider={{ provider_id: account.provider_id, name: account.provider_id, favicon: account.favicon }} size={18} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--primary-text)" }}>{account.email}</span>
                  <span style={{ fontSize: "10px", opacity: 0.6, textTransform: "uppercase" }}>{account.provider_id}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={() => handleDelete(account.id)}
                  style={{
                    padding: "6px",
                    backgroundColor: "transparent",
                    color: "rgba(244, 67, 54, 0.7)",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(244, 67, 54, 0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  title="Delete Account"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AccountManager;
