import React, { useEffect, useState } from "react";

import {
  FiArrowLeft,
  FiUserPlus,
  FiMessageCircle,
  FiCheck,
  FiX,
  FiMapPin,
  FiBookOpen,
  FiGithub,
  FiLinkedin,
} from "react-icons/fi";
import API_BASE_URL, { SERVER_BASE_URL } from "./api";
const glass = {
  background: "var(--glass-bg)",
border: "1px solid var(--border-color)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};
function PublicProfilePage({
  currentUserEmail,
  viewedUserEmail,
  onBack,
  onStartChat,
}) {
  const [userData, setUserData] = useState(null);
  const [friendStatus, setFriendStatus] = useState("none");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [profilePreview, setProfilePreview] = useState("");
  const isMobile = window.innerWidth < 768;
  const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});
  useEffect(() => {
    const fetchProfile = async () => {
      if (!viewedUserEmail) return;

      try {
        setLoading(true);

        const response = await fetch(
  `${API_BASE_URL}/user/public/${encodeURIComponent(viewedUserEmail)}`,
  {
    headers: authHeaders(),
  }
);
        const data = await response.json();

        if (!response.ok) {
          console.error(data.error || "Failed to fetch public profile");
          return;
        }

        setUserData(data.user);
      } catch (error) {
        console.error("fetch public profile error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [viewedUserEmail]);


  useEffect(() => {
    const fetchBlockStatus = async () => {
      if (!viewedUserEmail) return;
      if (currentUserEmail.toLowerCase() === viewedUserEmail.toLowerCase()) return;

      try {
        const response = await fetch(
  `${API_BASE_URL}/user/block-status?otherUserEmail=${encodeURIComponent(viewedUserEmail)}`,
  {
    headers: authHeaders(),
  }
);
        const data = await response.json();

        if (!response.ok) {
          console.error(data.error || "Failed to fetch block status");
          return;
        }

        setIsBlocked(Boolean(data.isBlocked));
      } catch (error) {
        console.error("fetch block status error:", error);
      }
    };

    fetchBlockStatus();
  }, [currentUserEmail, viewedUserEmail]);

  useEffect(() => {
    const fetchFriendStatus = async () => {
      if (!viewedUserEmail) return;

      if (currentUserEmail.toLowerCase() === viewedUserEmail.toLowerCase()) {
        setFriendStatus("self");
        return;
      }

      try {
        const response = await fetch(
  `${API_BASE_URL}/user/friend-status?otherUserEmail=${encodeURIComponent(viewedUserEmail)}`,
  {
    headers: authHeaders(),
  }
);
        const data = await response.json();

        if (!response.ok) {
          console.error(data.error || "Failed to fetch friend status");
          return;
        }

        setFriendStatus(data.status || "none");
      } catch (error) {
        console.error("fetch friend status error:", error);
      }
    };

    fetchFriendStatus();
  }, [currentUserEmail, viewedUserEmail]);

  const handleStartChat = async () => {
    const normalizedCurrentUser = currentUserEmail?.toLowerCase()?.trim();
    const normalizedOtherUser = viewedUserEmail?.toLowerCase()?.trim();

    if (!normalizedCurrentUser || !normalizedOtherUser) {
      alert("User email missing.");
      return;
    }

    if (normalizedCurrentUser === normalizedOtherUser) {
      alert("You cannot start a chat with yourself.");
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(`${API_BASE_URL}/chat/direct`, {
  method: "POST",
  headers: authHeaders(),
  body: JSON.stringify({
    otherUserEmail: normalizedOtherUser,
  }),
});

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to start chat");
        return;
      }

      if (data.conversation?.id) {
        const deletedChatsKey = `deletedChats_${normalizedCurrentUser}`;
        const deletedChatIds = JSON.parse(localStorage.getItem(deletedChatsKey) || "[]");
        const updatedDeletedChatIds = deletedChatIds.filter(
          (id) => Number(id) !== Number(data.conversation.id)
        );
        localStorage.setItem(deletedChatsKey, JSON.stringify(updatedDeletedChatIds));
      }

      if (data.conversation?.id && onStartChat) {
        onStartChat(Number(data.conversation.id));
      }
    } catch (error) {
      console.error("start chat from public profile error:", error);
      alert("Server error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockUser = async () => {
    const action = isBlocked ? "unblock" : "block";
    const confirmMessage = isBlocked
      ? "This user is already blocked. Do you want to unblock them?"
      : "Are you sure you want to block this user?";

    if (!window.confirm(confirmMessage)) return;

    try {
      setActionLoading(true);

      const response = await fetch(`${API_BASE_URL}/user/${action}`, {
  method: "POST",
  headers: authHeaders(),
  body: JSON.stringify({
    blockedEmail: viewedUserEmail,
  }),
});

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || `Failed to ${action} user`);
        return;
      }

      setIsBlocked(!isBlocked);

      if (!isBlocked) {
        setFriendStatus("none");
        alert("User blocked successfully.");
      } else {
        alert("User unblocked successfully.");
      }
    } catch (error) {
      console.error(`${action} user error:`, error);
      alert("Server error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddFriend = async () => {
    try {
      setActionLoading(true);

      const response = await fetch(`${API_BASE_URL}/user/friend-request`, {
  method: "POST",
  headers: authHeaders(),
  body: JSON.stringify({
    recipientEmail: viewedUserEmail,
  }),
});

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to send friend request");
        return;
      }

      setFriendStatus(data.status || "sent");
    } catch (error) {
      console.error("add friend error:", error);
      alert("Server error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptFriend = async () => {
    try {
      setActionLoading(true);

      const response = await fetch(`${API_BASE_URL}/user/friend-request/accept`, {
  method: "POST",
  headers: authHeaders(),
  body: JSON.stringify({
    otherUserEmail: viewedUserEmail,
  }),
});

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to accept friend request");
        return;
      }

      setFriendStatus("friends");
    } catch (error) {
      console.error("accept friend error:", error);
      alert("Server error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectFriend = async () => {
    try {
      setActionLoading(true);

      const response = await fetch(`${API_BASE_URL}/user/friend-request/reject`, {
  method: "POST",
  headers: authHeaders(),
  body: JSON.stringify({
    otherUserEmail: viewedUserEmail,
  }),
});

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to reject friend request");
        return;
      }

      setFriendStatus("none");
    } catch (error) {
      console.error("reject friend error:", error);
      alert("Server error");
    } finally {
      setActionLoading(false);
    }
  };

  const renderFriendAction = () => {
    if (friendStatus === "self") return null;

    if (friendStatus === "friends") {
      return (
        <button style={{ ...styles.actionButton, ...styles.friendsButton }} disabled>
          <FiCheck />
          <span>Friends</span>
        </button>
      );
    }

    if (friendStatus === "sent") {
      return (
        <button style={{ ...styles.actionButton, ...styles.sentButton }} disabled>
          <FiUserPlus />
          <span>Sent</span>
        </button>
      );
    }

    if (friendStatus === "received") {
      return (
        <div style={styles.dualActionRow}>
          <button
            style={styles.primaryButton}
            onClick={handleAcceptFriend}
            disabled={actionLoading}
          >
            <FiCheck />
            <span>{actionLoading ? "Please wait..." : "Accept"}</span>
          </button>

          <button
            style={styles.secondaryButton}
            onClick={handleRejectFriend}
            disabled={actionLoading}
          >
            <FiX />
            <span>Reject</span>
          </button>
        </div>
      );
    }

    return (
      <button
        style={styles.primaryButton}
        onClick={handleAddFriend}
        disabled={actionLoading}
      >
        <FiUserPlus />
        <span>{actionLoading ? "Please wait..." : "Add Friend"}</span>
      </button>
    );
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <button style={styles.backButton} onClick={onBack}>
            <FiArrowLeft />
            <span>Back</span>
          </button>
          <div style={styles.card}>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <button style={styles.backButton} onClick={onBack}>
            <FiArrowLeft />
            <span>Back</span>
          </button>
          <div style={styles.card}>User not found.</div>
        </div>
      </div>
    );
  }

  const profileImage = userData.profile_image_url
    ? userData.profile_image_url.startsWith("http")
      ? userData.profile_image_url
      : `${SERVER_BASE_URL}${userData.profile_image_url}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.full_name || "User")}`;

  const skills = userData.skills
    ? userData.skills.split(",").map((item) => item.trim()).filter(Boolean)
    : [];

  const interests = userData.interests
    ? userData.interests.split(",").map((item) => item.trim()).filter(Boolean)
    : [];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button style={styles.backButton} onClick={onBack}>
          <FiArrowLeft />
          <span>Back</span>
        </button>

        <div
          style={{
            ...styles.heroCard,
            flexDirection: isMobile ? "column" : "row",
          }}
        >         <img
            src={
              userData.profile_image_url
                ? userData.profile_image_url.startsWith("http")
                  ? userData.profile_image_url
                  : `${SERVER_BASE_URL}${userData.profile_image_url}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.full_name || "User")}`
            }
            alt={userData.full_name || "User"}
            style={styles.avatar}
          />

          <div style={styles.heroContent}>
            <h1 style={styles.name}>{userData.full_name || "Student"}</h1>
            <p style={styles.username}>@{userData.username || "username"}</p>

            <p style={styles.meta}>
              {userData.course || "Course"} • Year {userData.year || "-"}
              {userData.branch ? ` • Branch ${userData.branch}` : ""}
            </p>

            {userData.bio ? <p style={styles.bio}>{userData.bio}</p> : null}

            <div style={styles.infoGrid}>
              {userData.city ? (
                <div style={styles.infoChip}>
                  <FiMapPin />
                  <span>{userData.city}</span>
                </div>
              ) : null}

              {userData.course ? (
                <div style={styles.infoChip}>
                  <FiBookOpen />
                  <span>{userData.course}</span>
                </div>
              ) : null}

              {userData.year ? (
                <div style={styles.infoChip}>
                  <span>Year {userData.year}</span>
                </div>
              ) : null}
            </div>

            <div style={styles.actionRow}>
              {renderFriendAction()}

              {friendStatus !== "self" ? (
                <button
                  style={styles.messageButton}
                  onClick={handleStartChat}
                  disabled={actionLoading}
                >
                  <FiMessageCircle />
                  <span>Message</span>
                </button>
              ) : null}

              {friendStatus !== "self" ? (
                <button
                  style={{
                    ...styles.blockButton,
                    ...(isBlocked ? styles.unblockButton : {}),
                  }}
                  onClick={handleBlockUser}
                  disabled={actionLoading}
                >
                  {isBlocked ? "Unblock User" : "Block User"}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {skills.length > 0 || interests.length > 0 || userData.linkedin || userData.github ? (
          <div style={styles.detailsCard}>
            {skills.length > 0 ? (
              <div style={styles.sectionBlock}>
                <h3 style={styles.sectionTitle}>Skills</h3>
                <div style={styles.tags}>
                  {skills.map((skill, index) => (
                    <span key={index} style={styles.tag}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {interests.length > 0 ? (
              <div style={styles.sectionBlock}>
                <h3 style={styles.sectionTitle}>Interests</h3>
                <div style={styles.tags}>
                  {interests.map((interest, index) => (
                    <span key={index} style={styles.tag}>
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {userData.linkedin || userData.github ? (
              <div style={styles.sectionBlock}>
                <h3 style={styles.sectionTitle}>Links</h3>
                <div style={styles.linksRow}>
                  {userData.linkedin ? (
                    <a
                      href={userData.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.linkButton}
                    >
                      <FiLinkedin />
                      <span>LinkedIn</span>
                    </a>
                  ) : null}

                  {userData.github ? (
                    <a
                      href={userData.github}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.linkButton}
                    >
                      <FiGithub />
                      <span>GitHub</span>
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "transparent",
    padding: "clamp(10px, 3vw, 24px)",
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
    color: "var(--text-primary)",
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },
  backButton: {
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    marginBottom: "16px",
    fontSize: "15px",
    color: "var(--text-primary)",
  },
  heroCard: {
  ...glass,
  borderRadius: "24px",
  padding: "clamp(16px, 4vw, 32px)",
  display: "flex",
  gap: "20px",
  alignItems: "flex-start",
  color: "var(--text-primary)",   // 🔥 important
},
  detailsCard: {
  ...glass,
  borderRadius: "24px",
  padding: "24px",
  marginTop: "18px",
},
  blockButton: {
    // background: "var(--bg-surface)",
// border: "1px solid var(--border-color)",
    background: "rgba(220,38,38,0.08)",
border: "1px solid rgba(220,38,38,0.5)",
color: "#ef4444",
boxShadow: "0 4px 10px rgba(220,38,38,0.25)",
    borderRadius: "14px",
    padding: "12px 16px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  card: {
  ...glass,
  borderRadius: "24px",
  padding: "24px",
},
  avatar: {
    width: "clamp(100px, 30vw, 180px)",
    height: "clamp(100px, 30vw, 180px)",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    border: "3px solid var(--border-color)",
boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
  },
  heroContent: {
    flex: 1,
  },
  name: {
    margin: "0 0 8px 0",
    fontSize: "clamp(22px, 6vw, 42px)",
    color: "var(--text-primary)",
  },
  username: {
    margin: "0 0 10px 0",
    fontSize: "18px",
    color: "var(--text-secondary)",
  },
  meta: {
    margin: "0 0 14px 0",
    color: "var(--text-secondary)",
    fontSize: "16px",
    fontWeight: "600",
  },
  bio: {
    margin: "0 0 16px 0",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    maxWidth: "720px",
  },
  unblockButton: {
    border: "1px solid #16a34a",
    color: "#16a34a",
  },
  infoGrid: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  infoChip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "var(--bg-surface-soft)",
border: "1px solid var(--border-color)",
    borderRadius: "999px",
    padding: "8px 12px",
    color: "var(--text-secondary)",
    fontSize: "14px",
    fontWeight: "500",
  },
  actionRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  dualActionRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  actionButton: {
    border: "none",
    borderRadius: "14px",
    padding: "12px 16px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  primaryButton: {
    border: "none",
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    borderRadius: "14px",
    padding: "12px 16px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  secondaryButton: {
    background: "var(--bg-surface)",
border: "1px solid var(--border-color)",
    color: "var(--text-primary)",
    borderRadius: "14px",
    padding: "12px 16px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  messageButton: {
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
color: "#fff",
boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
    borderRadius: "14px",
    padding: "12px 16px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  friendsButton: {
    background: "rgba(16,185,129,0.12)",
border: "1px solid rgba(16,185,129,0.5)",
color: "#10b981",
  },
  sentButton: {
    background: "var(--bg-surface-soft)",
border: "1px solid var(--border-color)",
    color: "var(--text-secondary)",
  },
  sectionBlock: {
    marginBottom: "20px",
  },
  sectionTitle: {
    margin: "0 0 10px 0",
    fontSize: "18px",
    color: "var(--text-primary)",
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  tag: {
    background: "var(--bg-surface-soft)",
border: "1px solid var(--border-color)",
    color: "var(--text-primary)",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: "600",
  },
  linksRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  linkButton: {
    textDecoration: "none",
    background: "var(--bg-surface)",
border: "1px solid var(--border-color)",
    color: "var(--text-primary)",
    borderRadius: "14px",
    padding: "10px 14px",
    fontWeight: "700",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
};

export default PublicProfilePage;
