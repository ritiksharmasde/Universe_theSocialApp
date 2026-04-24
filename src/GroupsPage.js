import React, { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiSearch,
  FiUsers,
  FiPlusSquare,
  FiBookOpen,
} from "react-icons/fi";
import API_BASE_URL from "./api";
const glass = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid var(--border-color)",
};
function GroupsPage({ currentUserEmail, onBack, onCreateGroup, onOpenGroup }) {
  const [searchText, setSearchText] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });
  
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups`, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});
        const data = await response.json();

        if (!response.ok) {
          console.error(data.error || "Failed to fetch groups");
          return;
        }

        setGroups(data.groups || []);
      } catch (error) {
        console.error("Fetch groups error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUserEmail) {
      fetchGroups();
    }
  }, [currentUserEmail]);

  const filteredGroups = groups.filter((group) => {
    const text =
      `${group.name || ""} ${group.course || ""} ${group.year || ""} ${group.description || ""}`.toLowerCase();
    return text.includes(searchText.toLowerCase());
  });

  const handleJoinToggle = async (groupId, isJoined) => {
    try {
      const url = isJoined
        ? `${API_BASE_URL}/groups/${groupId}/leave`
        : `${API_BASE_URL}/groups/${groupId}/join`;

      const response = await fetch(url, {
  method: "POST",
  headers: authHeaders(),
});

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to update group membership");
        return;
      }

      setGroups((prev) =>
        prev.map((g) =>
          Number(g.id) === Number(groupId)
            ? {
              ...g,
              is_joined: !isJoined,
              members_count: isJoined
                ? Math.max((g.members_count || 1) - 1, 0)
                : (g.members_count || 0) + 1,
            }
            : g
        )
      );
    } catch (err) {
      console.error("Join/Leave group error:", err);
      alert("Server error");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
  method: "DELETE",
  headers: authHeaders(),
});

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to delete group");
        return;
      }

      setGroups((prev) =>
        prev.filter((group) => Number(group.id) !== Number(groupId))
      );
    } catch (error) {
      console.error("Delete group error:", error);
      alert("Server error");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <button style={styles.backButton} onClick={onBack}>
            <FiArrowLeft />
            <span>Back</span>
          </button>

          <button style={styles.createButton} onClick={onCreateGroup}>
            <FiPlusSquare />
            <span>Create Group</span>
          </button>
        </div>

        <div style={styles.headerCard}>
          <div>
            <h1 style={styles.title}>Study Groups</h1>
            <p style={styles.subtitle}>
              Find your classmates, join topic-based communities, and study
              together.
            </p>
          </div>
        </div>

        <div style={styles.searchBar}>
          <FiSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search groups by name, course, topic..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();

              }
            }}
            style={styles.searchInput}
          />
        </div>

        {loading ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyTitle}>Loading groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyTitle}>No groups found</p>
            <p style={styles.emptyText}>
              Try another search or create a new group.
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredGroups.map((group) => {
              const isFull = Number(group.members_count || 0) >= 5;
              const isJoined = Boolean(group.is_joined);
              const isOwner =
                group.created_by_email &&
                currentUserEmail &&
                group.created_by_email.toLowerCase() ===
                currentUserEmail.toLowerCase();

              return (
                <div key={group.id} style={styles.groupCard}>
                  <div style={styles.groupTop}>
                    <div style={styles.groupIconWrap}>
                      <FiUsers />
                    </div>

                    <div style={styles.groupMeta}>
                      <h3 style={styles.groupName}>{group.name}</h3>
                      <p style={styles.groupTags}>
                        <FiBookOpen style={styles.inlineIcon} />
                        <span>
                          {group.course || "Course"} • {group.year || "Year"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <p style={styles.groupDescription}>{group.description}</p>

                  <div style={styles.groupFooter}>
                    <span style={styles.memberCount}>
                      {group.members_count || 0}/5 members
                    </span>

                    <div style={styles.groupButtons}>
                      <button
                        style={{
                          ...styles.joinButton,
                          ...(isJoined ? styles.joinedButton : {}),
                          ...(!isJoined && isFull ? styles.disabledButton : {}),
                        }}
                        onClick={() => handleJoinToggle(group.id, isJoined)}
                        disabled={!isJoined && isFull}
                      >
                        {isJoined ? "Joined" : isFull ? "Full" : "Join"}
                      </button>

                      <button
                        style={{
                          ...styles.viewButton,
                          ...(!isJoined ? styles.disabledButton : {}),
                        }}
                        onClick={() => onOpenGroup && onOpenGroup(group)}
                        disabled={!isJoined}
                      >
                        Open
                      </button>

                      {isOwner ? (
                        <button
                          style={styles.deleteButton}
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "transparent",
    padding: "clamp(10px, 3vw, 24px)",
    boxSizing: "border-box",
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
    color: "var(--text-primary)",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  backButton: {
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    color: "var(--text-primary)",
    fontSize: "14px",
    padding: 0,
  },
  createButton: {
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
  headerCard: {
    ...glass,
    borderRadius: "24px",
    padding: "24px",
    marginBottom: "18px",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "clamp(22px, 6vw, 32px)",
    color: "var(--text-primary)",
  },
  subtitle: {
    margin: 0,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  searchBar: {
    position: "relative",
    marginBottom: "20px",
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-secondary)",
    fontSize: "16px",
  },
  searchInput: {
  width: "100%",
  border: "1px solid var(--border-color)",
  background: "var(--input-bg)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderRadius: "16px",
  padding: "12px 16px 12px 42px",
  fontSize: "15px",
  outline: "none",
  color: "var(--text-primary)",
},
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
  },
  groupCard: {
    ...glass,
    borderRadius: "22px",
    padding: "20px",
    display: "flex",
    transition: "all 0.2s ease",
    flexDirection: "column",
    gap: "14px",
  },
  groupTop: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },
  groupIconWrap: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },
  groupMeta: {
    flex: 1,
  },
  groupName: {
    margin: "0 0 6px 0",
    fontSize: "18px",
    color: "var(--text-primary)",
  },
  groupTags: {
    margin: 0,
    fontSize: "13px",
    color: "var(--text-secondary)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  inlineIcon: {
    fontSize: "14px",
  },
  groupDescription: {
    margin: 0,
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  groupFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginTop: "auto",
    flexWrap: "wrap",
  },
  memberCount: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    fontWeight: "600",
  },
  groupButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  joinButton: {
    border: "none",
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    borderRadius: "12px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  joinedButton: {
  background: "var(--bg-surface-soft)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-color)",
  backdropFilter: "blur(8px)",
},
  viewButton: {
  border: "1px solid var(--border-color)",
  background: "var(--input-bg)",
  backdropFilter: "blur(8px)",
  color: "var(--text-primary)",
  borderRadius: "12px",
  padding: "10px 14px",
  fontWeight: "700",
  cursor: "pointer",
},
  deleteButton: {
  border: "1px solid #dc2626",
  background: "transparent",
  color: "#dc2626",
  borderRadius: "12px",
  padding: "10px 14px",
  fontWeight: "700",
  cursor: "pointer",
},
  emptyState: {
    ...glass,
    borderRadius: "22px",
    marginTop: "24px",
    padding: "28px",
    textAlign: "center",
  },
  emptyTitle: {
    margin: "0 0 8px 0",
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--text-primary)",
  },
  emptyText: {
    margin: 0,
    color: "var(--text-secondary)",
  },
};

export default GroupsPage;
