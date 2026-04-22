import React, { useState, useEffect } from "react";
import API_BASE_URL from "./api";

function FeedbackPage({ currentUserEmail }) {
  const [category, setCategory] = useState("site-development");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState({
    loading: false,
    success: "",
    error: "",
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(
    window.innerWidth > 768 && window.innerWidth <= 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setStatus({
        loading: false,
        success: "",
        error: "Please enter your feedback.",
      });
      return;
    }

    if (!currentUserEmail) {
      setStatus({
        loading: false,
        success: "",
        error: "User email not found. Please login again.",
      });
      return;
    }

    try {
      setStatus({
        loading: true,
        success: "",
        error: "",
      });

      const response = await fetch(`${API_BASE_URL}/feedback`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
  body: JSON.stringify({
    category,
    message: trimmedMessage,
  }),
});

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      setMessage("");
      setCategory("site-development");
      setStatus({
        loading: false,
        success: "Feedback submitted successfully.",
        error: "",
      });
    } catch (error) {
      setStatus({
        loading: false,
        success: "",
        error: error.message || "Something went wrong.",
      });
    }
  };

  const dynamicStyles = getStyles({ isMobile, isTablet });

  return (
    <div style={dynamicStyles.page}>
      <div style={dynamicStyles.wrapper}>
        <div style={dynamicStyles.card}>
          <div style={dynamicStyles.header}>
            <h1 style={dynamicStyles.title}>Feedback</h1>
            <p style={dynamicStyles.subtitle}>
              Share feedback related to site development or report issues.
            </p>
          </div>

          <div style={dynamicStyles.infoBox}>
            <span style={dynamicStyles.infoLabel}>Logged in as</span>
            <span style={dynamicStyles.infoValue}>
              {currentUserEmail || "Not available"}
            </span>
          </div>

          {status.success ? (
            <div style={dynamicStyles.successBox}>{status.success}</div>
          ) : null}

          {status.error ? (
            <div style={dynamicStyles.errorBox}>{status.error}</div>
          ) : null}

          <form onSubmit={handleSubmit} style={dynamicStyles.form}>
            <div style={dynamicStyles.field}>
              <label style={dynamicStyles.label}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={dynamicStyles.input}
              >
                <option value="site-development">Site Development</option>
                <option value="issues">Issues</option>
              </select>
            </div>

            <div style={dynamicStyles.field}>
              <label style={dynamicStyles.label}>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the site development feedback or issue..."
                rows={isMobile ? 6 : 8}
                style={dynamicStyles.textarea}
              />
            </div>

            <button
              type="submit"
              style={{
                ...dynamicStyles.button,
                ...(status.loading ? dynamicStyles.buttonDisabled : {}),
              }}
              disabled={status.loading}
            >
              {status.loading ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function getStyles({ isMobile, isTablet }) {
  return {
    page: {
      width: "100%",
      minHeight: "100%",
      display: "flex",
      justifyContent: "center",
      padding: isMobile ? "12px" : isTablet ? "20px" : "28px",
      boxSizing: "border-box",
      background: "var(--bg-primary, transparent)",
    },

    wrapper: {
      width: "100%",
      maxWidth: isMobile ? "100%" : isTablet ? "820px" : "900px",
    },

    card: {
      width: "100%",
      background: "var(--bg-surface)",
      border: "1px solid var(--border-color)",
      borderRadius: isMobile ? "16px" : "24px",
      padding: isMobile ? "16px" : isTablet ? "22px" : "28px",
      boxSizing: "border-box",
      boxShadow:
        "0 8px 24px rgba(15, 23, 42, 0.06)",
    },

    header: {
      marginBottom: isMobile ? "16px" : "20px",
    },

    title: {
      margin: 0,
      marginBottom: "8px",
      color: "var(--text-primary)",
      fontSize: isMobile ? "24px" : isTablet ? "28px" : "32px",
      lineHeight: 1.2,
      fontWeight: "800",
      wordBreak: "break-word",
    },

    subtitle: {
      margin: 0,
      color: "var(--text-secondary)",
      fontSize: isMobile ? "14px" : "15px",
      lineHeight: 1.6,
    },

    infoBox: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "flex-start" : "center",
      gap: "8px",
      marginBottom: "18px",
      padding: isMobile ? "12px" : "14px 16px",
      borderRadius: "14px",
      background: "var(--bg-surface-soft)",
      border: "1px solid var(--border-color)",
      color: "var(--text-primary)",
      overflowWrap: "anywhere",
    },

    infoLabel: {
      fontWeight: "700",
      fontSize: "14px",
      color: "var(--text-secondary)",
    },

    infoValue: {
      fontWeight: "600",
      fontSize: isMobile ? "14px" : "15px",
      color: "var(--text-primary)",
      wordBreak: "break-word",
    },

    form: {
      display: "flex",
      flexDirection: "column",
      gap: isMobile ? "14px" : "18px",
    },

    field: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },

    label: {
      fontSize: "14px",
      fontWeight: "700",
      color: "var(--text-primary)",
    },

    input: {
      width: "100%",
      minHeight: isMobile ? "46px" : "50px",
      padding: isMobile ? "12px 14px" : "14px 16px",
      borderRadius: "14px",
      border: "1px solid var(--border-color)",
      background: "var(--bg-surface-soft)",
      color: "var(--text-primary)",
      fontSize: isMobile ? "14px" : "15px",
      boxSizing: "border-box",
      outline: "none",
      appearance: "none",
      WebkitAppearance: "none",
      MozAppearance: "none",
    },

    textarea: {
      width: "100%",
      padding: isMobile ? "12px 14px" : "14px 16px",
      borderRadius: "14px",
      border: "1px solid var(--border-color)",
      background: "var(--bg-surface-soft)",
      color: "var(--text-primary)",
      fontSize: isMobile ? "14px" : "15px",
      lineHeight: 1.6,
      boxSizing: "border-box",
      outline: "none",
      resize: "vertical",
      minHeight: isMobile ? "140px" : "180px",
    },

    button: {
      width: isMobile ? "100%" : "fit-content",
      minWidth: isMobile ? "100%" : "220px",
      alignSelf: isMobile ? "stretch" : "flex-start",
      border: "none",
      borderRadius: "14px",
      padding: isMobile ? "14px 16px" : "15px 22px",
      background: "var(--button-primary)",
      color: "var(--button-primary-text)",
      fontSize: isMobile ? "14px" : "15px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "opacity 0.2s ease, transform 0.2s ease",
    },

    buttonDisabled: {
      opacity: 0.7,
      cursor: "not-allowed",
    },

    successBox: {
      marginBottom: "14px",
      padding: isMobile ? "12px" : "12px 14px",
      borderRadius: "14px",
      border: "1px solid rgba(34, 197, 94, 0.25)",
      background: "rgba(34, 197, 94, 0.10)",
      color: "var(--text-primary)",
      fontWeight: "600",
      fontSize: isMobile ? "14px" : "15px",
    },

    errorBox: {
      marginBottom: "14px",
      padding: isMobile ? "12px" : "12px 14px",
      borderRadius: "14px",
      border: "1px solid rgba(239, 68, 68, 0.25)",
      background: "rgba(239, 68, 68, 0.10)",
      color: "var(--text-primary)",
      fontWeight: "600",
      fontSize: isMobile ? "14px" : "15px",
    },
  };
}

export default FeedbackPage;
