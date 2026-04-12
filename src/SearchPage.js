import React, { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "./api";
import { FiSearch, FiUsers, FiFileText, FiUser } from "react-icons/fi";
import useBreakpoint from "./useBreakpoint";

function SearchPage({ currentUserEmail, onStartChat, onOpenUserProfile }) {
  const { isMobile, isDesktop, isTablet } = useBreakpoint();
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [startingChatEmail, setStartingChatEmail] = useState("");
  const [friendStatuses, setFriendStatuses] = useState({});
  const [sendingFriendRequestTo, setSendingFriendRequestTo] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const styles = getStyles(isMobile, isTablet);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);

        const response = await fetch(
          `${API_BASE_URL}/user?currentUserEmail=${encodeURIComponent(
            currentUserEmail || ""
          )}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch users");
        }

        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch (error) {
        console.error("fetch users error:", error);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const results = useMemo(() => {
    const studentItems = users.map((user, index) => ({
      id: user.email || index,
      type: "student",
      title:
        user.username ||
        user.full_name ||
        user.email,
      subtitle: `${user.course || "Student"} • Year ${user.year || "-"}`,
      name:
        user.full_name ||
        user.username ||
        user.email ||
        "Student",
      email: user.email,
      course: user.course || "",
      year: user.year ? String(user.year) : "",
      branch: user.section || "",
      icon: <FiUser />,
      profileImageUrl: user.profile_image_url || "",
    }));

    return studentItems.filter((item) => {
      const q = query.toLowerCase().trim();

      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.branch?.toLowerCase().trim().includes(q);

      const matchesCourse =
  !courseFilter ||
  item.course?.toLowerCase().trim() === courseFilter.toLowerCase().trim();

      const matchesYear = !yearFilter || item.year === yearFilter;

      const matchesBranch =
  !branchFilter ||
  item.branch?.toLowerCase().trim() === branchFilter.toLowerCase().trim();

      return matchesQuery && matchesCourse && matchesYear && matchesBranch;
    });
  }, [users, query, courseFilter, yearFilter, branchFilter]);

  useEffect(() => {
    const fetchStatuses = async () => {
      const students = results.filter(
        (item) => item.type === "student" && item.email && item.email !== currentUserEmail
      );

      if (!currentUserEmail || students.length === 0) return;

      try {
        const statusEntries = await Promise.all(
          students.map(async (student) => {
            const response = await fetch(
              `${API_BASE_URL}/user/friend-status?currentUserEmail=${encodeURIComponent(
                currentUserEmail
              )}&otherUserEmail=${encodeURIComponent(student.email)}`
            );

            const data = await response.json();

            if (!response.ok) {
              return [student.email.toLowerCase(), "none"];
            }

            return [student.email.toLowerCase(), data.status || "none"];
          })
        );

        setFriendStatuses((prev) => ({
          ...prev,
          ...Object.fromEntries(statusEntries),
        }));
      } catch (error) {
        console.error("fetch friend statuses error:", error);
      }
    };

    fetchStatuses();
  }, [results, currentUserEmail]);

  const handleAcceptFriend = async (otherUserEmail) => {
    const normalizedCurrentUser = currentUserEmail?.toLowerCase()?.trim();
    const normalizedOtherUser = otherUserEmail?.toLowerCase()?.trim();

    try {
      setSendingFriendRequestTo(normalizedOtherUser);

      const response = await fetch(`${API_BASE_URL}/user/friend-request/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentUserEmail: normalizedCurrentUser,
          otherUserEmail: normalizedOtherUser,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to accept friend request");
        return;
      }

      setFriendStatuses((prev) => ({
        ...prev,
        [normalizedOtherUser]: "friends",
      }));
    } catch (error) {
      console.error("accept friend error:", error);
      alert("Server error");
    } finally {
      setSendingFriendRequestTo("");
    }
  };

  const handleRejectFriend = async (otherUserEmail) => {
    const normalizedCurrentUser = currentUserEmail?.toLowerCase()?.trim();
    const normalizedOtherUser = otherUserEmail?.toLowerCase()?.trim();

    try {
      setSendingFriendRequestTo(normalizedOtherUser);

      const response = await fetch(`${API_BASE_URL}/user/friend-request/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentUserEmail: normalizedCurrentUser,
          otherUserEmail: normalizedOtherUser,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to reject friend request");
        return;
      }

      setFriendStatuses((prev) => ({
        ...prev,
        [normalizedOtherUser]: "none",
      }));
    } catch (error) {
      console.error("reject friend error:", error);
      alert("Server error");
    } finally {
      setSendingFriendRequestTo("");
    }
  };

  const clearFilters = () => {
    setQuery("");
    setCourseFilter("");
    setYearFilter("");
    setBranchFilter("");
  };

  const handleStartChat = async (otherUserEmail) => {
    const normalizedCurrentUser = currentUserEmail?.toLowerCase()?.trim();
    const normalizedOtherUser = otherUserEmail?.toLowerCase()?.trim();

    if (!normalizedCurrentUser || !normalizedOtherUser) {
      alert("User email missing.");
      return;
    }

    if (normalizedCurrentUser === normalizedOtherUser) {
      alert("You cannot start a chat with yourself.");
      return;
    }

    try {
      setStartingChatEmail(normalizedOtherUser);

      const response = await fetch(`${API_BASE_URL}/chat/direct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentUserEmail: normalizedCurrentUser,
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
      console.error("start chat error:", error);
      alert("Server error");
    } finally {
      setStartingChatEmail("");
    }
  };

  const handleAddFriend = async (otherUserEmail) => {
    const normalizedCurrentUser = currentUserEmail?.toLowerCase()?.trim();
    const normalizedOtherUser = otherUserEmail?.toLowerCase()?.trim();

    if (!normalizedCurrentUser || !normalizedOtherUser) {
      alert("User email missing.");
      return;
    }

    if (normalizedCurrentUser === normalizedOtherUser) {
      alert("You cannot add yourself.");
      return;
    }

    try {
      setSendingFriendRequestTo(normalizedOtherUser);

      const response = await fetch(`${API_BASE_URL}/user/friend-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requesterEmail: normalizedCurrentUser,
          recipientEmail: normalizedOtherUser,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to send friend request");
        return;
      }

      setFriendStatuses((prev) => ({
        ...prev,
        [normalizedOtherUser]: data.status || "sent",
      }));
    } catch (error) {
      console.error("add friend error:", error);
      alert("Server error");
    } finally {
      setSendingFriendRequestTo("");
    }
  };

  const getFriendButtonLabel = (status, email) => {
    if (sendingFriendRequestTo === email.toLowerCase()) return "Please wait...";
    if (status === "friends") return "Friends";
    if (status === "sent") return "Sent";
    if (status === "received") return "Accept";
    return "Add Friend";
  };

  const isFriendButtonDisabled = (status, email) => {
    if (sendingFriendRequestTo === email.toLowerCase()) return true;
    return status === "friends" || status === "sent";
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerCard}>
          <h1 style={styles.title}>Search</h1>
          <p style={styles.subtitle}>
            Find students, groups, notes, and discussions across your campus network.
          </p>
        </div>

        <div style={styles.searchCard}>
          <div style={styles.searchBox}>
            <FiSearch style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name or keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterGrid}>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              style={styles.select}
            >
              <option value="">All Courses</option>
              <option value="mca">MCA</option>
              <option value="btech">BTech</option>
              <option value="bba">BBA</option>
                 <option value="bca">bca</option>
              <option value="bdes">BDes</option>
              <option value="mdes">MDes</option>
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={styles.select}
            >
              <option value="">All Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              style={styles.select}
            >
              <option value="">All Branches</option>
              <option value="Computer Applications">Computer Applications</option>
              <option value="CSE">CSE</option>
              <option value="Management">Management</option>
            </select>

            <button style={styles.clearButton} onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>

        <div style={styles.resultsCard}>
          <div style={styles.resultsHeader}>
            <h2 style={styles.sectionTitle}>Results</h2>
            <span style={styles.resultCount}>{results.length} found</span>
          </div>

          {loadingUsers ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyTitle}>Loading users...</p>
              <p style={styles.emptyText}>Please wait.</p>
            </div>
          ) : results.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyTitle}>No results found</p>
              <p style={styles.emptyText}>Try another search or change filters.</p>
            </div>
          ) : (
            <div style={styles.resultsList}>
              {results.map((item) => {
                const isStartingChat =
                  item.type === "student" &&
                  item.email &&
                  startingChatEmail === item.email.toLowerCase();

                const friendStatus = item.email
                  ? friendStatuses[item.email.toLowerCase()] || "none"
                  : "none";

                return (
                  <div key={item.id} style={styles.resultItem}>
                    <div style={styles.resultLeft}>
                      <div style={styles.resultIcon}>{item.icon}</div>
                      <div
                        style={styles.clickableUserInfo}
                        onClick={() =>
                          item.email && onOpenUserProfile && onOpenUserProfile(item.email)
                        }
                      >
                        <p style={styles.resultTitle}>{item.title}</p>
                        <p style={styles.resultSubtitle}>{item.subtitle}</p>
                        <p style={styles.resultMeta}>
                          {item.course} • Year {item.year} • {item.branch}
                        </p>
                      </div>
                    </div>

                    <div style={styles.resultActions}>
                      <span style={styles.resultType}>{item.type}</span>

                      {item.type === "student" && item.email ? (
                        <>
                          {friendStatus === "received" ? (
                            <>
                              <button
                                style={styles.acceptButton}
                                onClick={() => handleAcceptFriend(item.email)}
                                disabled={sendingFriendRequestTo === item.email.toLowerCase()}
                              >
                                {sendingFriendRequestTo === item.email.toLowerCase()
                                  ? "Please wait..."
                                  : "Accept"}
                              </button>

                              <button
                                style={styles.rejectButton}
                                onClick={() => handleRejectFriend(item.email)}
                                disabled={sendingFriendRequestTo === item.email.toLowerCase()}
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <button
                              style={{
                                ...styles.friendButton,
                                ...(friendStatus === "friends"
                                  ? styles.friendButtonDone
                                  : {}),
                                ...(friendStatus === "sent"
                                  ? styles.friendButtonMuted
                                  : {}),
                              }}
                              onClick={() => handleAddFriend(item.email)}
                              disabled={isFriendButtonDisabled(friendStatus, item.email)}
                            >
                              {getFriendButtonLabel(friendStatus, item.email)}
                            </button>
                          )}

                          <button
                            style={styles.messageButton}
                            onClick={() => handleStartChat(item.email)}
                            disabled={isStartingChat}
                          >
                            {isStartingChat ? "Opening..." : "Message"}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// const {isMobile, isDesktop, isTablet} = useBreakpoint();

const getStyles = (isMobile, isTablet) => ({

  page: {
    minHeight: "100dvh",
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
    background: "var(--bg-page)",
    color: "var(--text-primary)",
  },
  container: {
    width: "100%",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "0 12px",

  },
  headerCard: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "24px",
    padding: isMobile ? "18px" : "24px",
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
  },
  searchCard: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "24px",
    padding: isMobile ? "16px" : "20px",
    marginBottom: "20px",
  },
  searchBox: {
    position: "relative",
    marginBottom: "16px",
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
    boxSizing: "border-box",
    border: "1px solid var(--border-color)",
    background: "var(--bg-surface)",
    borderRadius: "16px",
    padding: isMobile ? "12px 12px 12px 38px" : "15px 16px 15px 42px",
    fontSize: "15px",
    outline: "none",
    color: "var(--text-primary)",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
  },
  select: {
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    background: "var(--bg-surface)",
    outline: "none",
    color: "var(--text-primary)",
  },
  clearButton: {
    border: "none",
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    borderRadius: "14px",
    padding: "12px 14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  resultsCard: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "24px",
    padding: isMobile ? "16px" : "24px",
  },
  resultsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: isMobile ? "flex-start" : "center",
    flexDirection: isMobile ? "column" : "row",
    gap: isMobile ? "6px" : 0,
    marginBottom: "16px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    color: "var(--text-primary)",
  },
  resultCount: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    fontWeight: "600",
  },
  resultsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  resultItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: isMobile ? "flex-start" : "center",
    flexDirection: isMobile ? "column" : "row",
    gap: "12px",
    border: "1px solid var(--border-color)",
    borderRadius: "16px",
    padding: isMobile ? "12px" : "14px 16px",
    background: "var(--bg-surface-soft)",
  },
  resultLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    minWidth: 0,
  },
  resultIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  clickableUserInfo: {
    cursor: "pointer",
  },
  resultTitle: {
    margin: 0,
    fontWeight: "700",
    color: "var(--text-primary)",
  },
  resultSubtitle: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "var(--text-secondary)",
  },
  resultMeta: {
    margin: "4px 0 0 0",
    fontSize: "12px",
    color: "var(--text-muted)",
  },
  resultType: {
    textTransform: "capitalize",
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-secondary)",
    background: "var(--bg-surface)",
    padding: "6px 10px",
    borderRadius: "999px",
    alignSelf: isMobile ? "flex-start" : "center",
  },
  resultActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    alignSelf: isMobile ? "flex-start" : "center",
    flexWrap: "wrap",
  },
  friendButton: {
    border: "1px solid var(--border-color)",
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  acceptButton: {
    border: "none",
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  rejectButton: {
    border: "1px solid var(--border-color)",
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  friendButtonDone: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#065f46",
  },
  friendButtonMuted: {
    background: "var(--bg-surface-soft)",
    border: "1px solid var(--border-color)",
    color: "var(--text-secondary)",
  },
  messageButton: {
    border: "none",
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  emptyState: {
    textAlign: "center",
    padding: "24px",
  },
  emptyTitle: {
    margin: "0 0 8px 0",
    fontWeight: "700",
    color: "var(--text-primary)",
  },
  emptyText: {
    margin: 0,
    color: "var(--text-secondary)",
  },
});

export default SearchPage;
