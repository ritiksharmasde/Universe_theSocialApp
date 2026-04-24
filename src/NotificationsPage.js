import React, { useEffect, useState } from "react";
import {
  FiBell,
  FiHeart,
  FiMessageCircle,
  FiUsers,
  FiShield,
} from "react-icons/fi";
import API_BASE_URL from "./api";
import useBreakpoint from "./useBreakpoint";
const authHeaders = (includeJson = true) => ({
  ...(includeJson ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});
const glass = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid var(--border-color)",
};
function NotificationsPage() {
  const { isMobile } = useBreakpoint();
  const styles = getStyles(isMobile);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("token");

if (!token) {
        setNotifications([]);
        setError("");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/notifications`, {
  headers: authHeaders(false),
});

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          setError(data?.error || "Failed to fetch notifications");
          setNotifications([]);
          return;
        }

        setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      } catch (err) {
        console.error("fetch notifications error:", err);
        setError("Failed to fetch notifications");
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkRead = async (id, isRead) => {
    if (isRead) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
  method: "PUT",
  headers: authHeaders(),
});

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error(data?.error || "Failed to mark notification as read");
        return;
      }

      setNotifications((prev) =>
        prev.map((item) =>
          Number(item.id) === Number(id) ? { ...item, is_read: true } : item
        )
      );
    } catch (err) {
      console.error("mark notification read error:", err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return <FiHeart />;
      case "comment":
        return <FiMessageCircle />;
      case "friend_request":
        return <FiUsers />;
      case "admin_message":
        return <FiShield />;
      default:
        return <FiBell />;
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerCard}>
          <h1 style={styles.title}>Notifications</h1>
          <p style={styles.subtitle}>
            Stay updated with likes, comments, friend requests, and platform
            messages.
          </p>
        </div>

        <div style={styles.notificationsCard}>
          <div style={styles.notificationsList}>
            {loading ? (
              <p style={styles.stateText}>Loading notifications...</p>
            ) : error ? (
              <p style={styles.errorText}>{error}</p>
            ) : notifications.length === 0 ? (
              <p style={styles.stateText}>No notifications yet.</p>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  style={{
                    ...styles.notificationItem,
                    ...(item.is_read ? {} : styles.unreadNotificationItem),
                  }}
                  onClick={() => handleMarkRead(item.id, item.is_read)}
onMouseEnter={(e) => {
  e.currentTarget.style.transform = "translateY(-1px)";
  e.currentTarget.style.background = "var(--bg-surface)";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = "none";
  e.currentTarget.style.background = "var(--bg-surface-soft)";
}}
                >
                  <div style={styles.iconWrap}>
                    {getNotificationIcon(item.type)}
                  </div>

                  <div style={styles.notificationContent}>
                    <p style={styles.notificationTitle}>{item.title}</p>

                    {item.body ? (
                      <p style={styles.notificationBody}>{item.body}</p>
                    ) : null}

                    <p style={styles.notificationTime}>
                      {formatDateTime(item.created_at)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const getStyles = (isMobile) => ({
  page: {
    minHeight: "100dvh",
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
    background: "transparent",
    color: "var(--text-primary)",
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: isMobile ? "0 8px" : "0 10px",
  },
  headerCard: {
    ...glass,
    borderRadius: "24px",
    padding: isMobile ? "16px" : "24px",
    marginBottom: "18px",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: isMobile ? "26px" : "32px",
    color: "var(--text-primary)",
  },
  subtitle: {
    margin: 0,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    fontSize: isMobile ? "14px" : "16px",
  },
  notificationsCard: {
    ...glass,
    borderRadius: "24px",
    padding: isMobile ? "14px" : "20px",
  },
  notificationsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  notificationItem: {
    display: "flex",
    alignItems: isMobile ? "flex-start" : "center",
    gap: "14px",
    padding: isMobile ? "12px" : "14px",
    borderRadius: "16px",
    background: "var(--bg-surface-soft)",
border: "1px solid var(--border-color)",
backdropFilter: "blur(6px)",
WebkitBackdropFilter: "blur(6px)",
    cursor: "pointer",
    transition: "0.2s ease",
    width: "100%",
    textAlign: "left",
  },
  unreadNotificationItem: {
    border: "1px solid rgba(99,102,241,0.6)",
boxShadow: "0 0 0 1px rgba(99,102,241,0.25)",
background: "var(--bg-surface)",
  },
  iconWrap: {
    width: isMobile ? "40px" : "44px",
    height: isMobile ? "40px" : "44px",
    borderRadius: "14px",
    background: "var(--button-primary)",
boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
    color: "var(--button-primary-text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: isMobile ? "16px" : "18px",
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
    minWidth: 0,
  },
  notificationTitle: {
    margin: 0,
    color: "var(--text-primary)",
    fontWeight: "600",
    fontSize: isMobile ? "14px" : "16px",
    lineHeight: 1.5,
  },
  notificationBody: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
  notificationTime: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "var(--text-secondary)",
  },
  stateText: {
    margin: 0,
    fontSize: "14px",
    color: "var(--text-secondary)",
    textAlign: "center",
    padding: "12px 0",
  },
  errorText: {
    margin: 0,
    fontSize: "14px",
    color: "red",
    textAlign: "center",
    padding: "12px 0",
  },
});

export default NotificationsPage;
