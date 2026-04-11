import React, { useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";
import PostCard from "./components/PostCard";
import { FaInstagram } from "react-icons/fa";
import PostDetailPage from "./PostDetailPage";
import API_BASE_URL, {SERVER_BASE_URL} from "./api";
import useBreakpoint from "./useBreakpoint";

function FeedPage({
  profileData,
  onCreatePost,
  onOpenProfile,
  onOpenUserProfile,
  onStartChat,
  customPosts = [],
  unreadCounts = {},
}) {
  const [searchText, setSearchText] = useState("");
  const [posts, setPosts] = useState(customPosts || []);
  const [selectedPost, setSelectedPost] = useState(null);
  const [friendStatuses, setFriendStatuses] = useState({});
  const [sendingFriendRequestTo, setSendingFriendRequestTo] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const isTinyMobile = isMobile && window.innerWidth <= 380;

  const styles = getStyles(isMobile, isTablet, isDesktop, isTinyMobile);
  const unreadUsersCount = Object.values(unreadCounts || {}).filter(
  (count) => count > 0
).length;


  useEffect(() => {
    setPosts(customPosts || []);
  }, [customPosts]);

  const currentUserEmail = profileData?.email || "";
  const currentUserName = profileData?.fullName || "Student";
  const currentUserProfileImage = profileData?.profileImage || "";

  useEffect(() => {
    const fetchSuggestionStatuses = async () => {
      const validSuggestions = suggestions.filter(
        (item) =>
          item.email &&
          item.email.toLowerCase() !== currentUserEmail.toLowerCase()
      );

      if (!currentUserEmail || validSuggestions.length === 0) return;

      try {
        const statusEntries = await Promise.all(
          validSuggestions.map(async (item) => {
            const response = await fetch(
              `${API_BASE_URL}/user/friend-status?currentUserEmail=${encodeURIComponent(
                currentUserEmail
              )}&otherUserEmail=${encodeURIComponent(item.email)}`
            );

            const data = await response.json();

            if (!response.ok) {
              return [item.email.toLowerCase(), "none"];
            }

            return [item.email.toLowerCase(), data.status || "none"];
          })
        );

        setFriendStatuses(Object.fromEntries(statusEntries));
      } catch (error) {
        console.error("fetch suggestion friend statuses error:", error);
      }
    };

    fetchSuggestionStatuses();
  }, [currentUserEmail, suggestions]);
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!currentUserEmail) return;

      try {
        setLoadingSuggestions(true);

        const response = await fetch(
          `${API_BASE_URL}/user/random-suggestions?currentUserEmail=${encodeURIComponent(
            currentUserEmail
          )}&limit=10`
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(data.error || "Failed to fetch suggestions");
          setSuggestions([]);
          return;
        }

        const mappedSuggestions = (data.users || []).map((user, index) => ({
          id: user.id || user.email || index,
          name: user.full_name || user.username || "Student",
          sub: `${user.course || "Course"} • Year ${user.year || "1"}`,
          email: user.email || "",
          profileImage: user.profile_image_url
            ? user.profile_image_url.startsWith("http")
              ? user.profile_image_url
              : `${SERVER_BASE_URL}${user.profile_image_url}`
            : "",
        }));

        setSuggestions(mappedSuggestions.slice(0, 10));
      } catch (error) {
        console.error("fetch suggestions error:", error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [currentUserEmail]);


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

  const handleToggleLike = async (postId, isLiked) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
        method: isLiked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: currentUserEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to update like");
        return;
      }

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
              ...post,
              likes: data.post.likes_count,
              isLiked: data.post.is_liked,
            }
            : post
        )
      );

      setSelectedPost((prev) =>
        prev && prev.id === postId
          ? {
            ...prev,
            likes: data.post.likes_count,
            isLiked: data.post.is_liked,
          }
          : prev
      );
    } catch (error) {
      console.error("toggle like error:", error);
      alert("Server error");
    }
  };

  const handleCommentAdded = (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
            ...post,
            comments: (post.comments || 0) + 1,
          }
          : post
      )
    );

    setSelectedPost((prev) =>
      prev && prev.id === postId
        ? {
          ...prev,
          comments: (prev.comments || 0) + 1,
        }
        : prev
    );
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
    if (sendingFriendRequestTo === email.toLowerCase()) return "Sending...";
    if (status === "friends") return "Friends";
    if (status === "sent") return "Sent";
    if (status === "received") return "Respond";
    return "Add Friend";
  };

  const isFriendButtonDisabled = (status, email) => {
    if (sendingFriendRequestTo === email.toLowerCase()) return true;
    return status === "friends" || status === "sent";
  };

  const normalizedSearch = searchText.trim().toLowerCase();

  const filteredPosts = posts.filter((post) => {
    if (!normalizedSearch) return true;

    const text = `
      ${post.author || ""}
      ${post.caption || ""}
      ${post.subtitle || ""}
      ${post.type || ""}
    `.toLowerCase();

    return text.includes(normalizedSearch);
  });
  const handleStartChat = async (otherUserEmail) => {
    if (!currentUserEmail || !otherUserEmail) return;

    try {
      const response = await fetch(`${API_BASE_URL}/chat/direct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentUserEmail,
          otherUserEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to start chat");
        return;
      }

      if (onStartChat) {
        onStartChat(data.conversation?.id);
      }
    } catch (error) {
      console.error("start chat error:", error);
      alert("Server error");
    }
  };

  const filteredSuggestions = suggestions.filter((item) => {
    if (!normalizedSearch) return true;

    const text = `
      ${item.name || ""}
      ${item.sub || ""}
      ${item.email || ""}
    `.toLowerCase();

    return text.includes(normalizedSearch);
  });

  if (selectedPost) {
    return (
      <PostDetailPage
        post={selectedPost}
        onBack={() => setSelectedPost(null)}
        currentUserEmail={currentUserEmail}
        currentUserName={currentUserName}
        currentUserProfileImage={currentUserProfileImage}
        onToggleLike={handleToggleLike}
        onCommentAdded={handleCommentAdded}
      />
    );
  }

  const mobileSuggestions = filteredSuggestions.slice(0, 10);

  const suggestionsNode = (
    <div style={styles.widgetCardLarge}>
      <div style={styles.widgetHeader}>
        <h3 style={styles.widgetTitle}>Suggestions for you</h3>
        {!isTinyMobile && <button style={styles.smallLinkButton}>See all</button>}      </div>

      {loadingSuggestions ? (
        <p style={styles.emptyText}>Loading suggestions...</p>
      ) : (isMobile ? mobileSuggestions : filteredSuggestions).length === 0 ? (
        <p style={styles.emptyText}>No suggestions available.</p>
      ) : (
        (isMobile ? mobileSuggestions : filteredSuggestions).map((item) => {
          const status = friendStatuses[item.email?.toLowerCase()] || "none";

          return (
            <div key={item.id} style={styles.suggestionItem}>
              <div
                style={styles.suggestionLeft}
                onClick={() => onOpenUserProfile && onOpenUserProfile(item.email)}
              >
                {item.profileImage ? (
                  <img
                    src={item.profileImage}
                    alt={item.name}
                    style={styles.suggestionAvatarImage}
                  />
                ) : (
                  <div style={styles.suggestionAvatar}>{item.name.charAt(0)}</div>
                )}
                <div style={styles.suggestionTextWrap}>
                  <p style={styles.suggestionName}>{item.name}</p>
                  <p style={styles.suggestionSub}>{item.sub}</p>
                </div>
              </div>

              <div style={styles.suggestionButtons}>
               
<div style={styles.messageIconWrapper}>
  <button
    style={styles.messageButton}
    onClick={() => handleStartChat(item.email)}
  >
    Message
  </button>

  {unreadUsersCount > 0 && (
    <span style={styles.unreadBadge}>
      {unreadUsersCount > 99 ? "99+" : unreadUsersCount}
    </span>
  )}
</div>
                {status === "received" ? (
                  <div style={styles.suggestionActionGroup}>
                    <button
                      style={styles.acceptSuggestionButton}
                      onClick={() => handleAcceptFriend(item.email)}
                      disabled={sendingFriendRequestTo === item.email.toLowerCase()}
                    >
                      {sendingFriendRequestTo === item.email.toLowerCase()
                        ? "Wait..."
                        : "Accept"}
                    </button>

                    <button
                      style={styles.rejectSuggestionButton}
                      onClick={() => handleRejectFriend(item.email)}
                      disabled={sendingFriendRequestTo === item.email.toLowerCase()}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <button
                    style={{
                      ...styles.addFriendButton,
                      ...(status === "friends" ? styles.addFriendButtonDone : {}),
                      ...(status === "sent" ? styles.addFriendButtonMuted : {}),
                    }}
                    onClick={() => handleAddFriend(item.email)}
                    disabled={isFriendButtonDisabled(status, item.email)}
                  >
                    {getFriendButtonLabel(status, item.email)}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div >
  );

  const profileCardNode = (
    <div style={styles.profileCard}>
      <div style={styles.profileCardTop}>
        <img
          src={
            profileData?.profileImage && profileData.profileImage !== ""
              ? profileData.profileImage
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData?.fullName || "User")}`
          }
          alt="profile"
          style={styles.profileImage}
        />
        <div>
          <p style={styles.profileName}>{profileData?.fullName || "Student"}</p>
          <p style={styles.profileSub}>
            {profileData?.course || "Course"} • Year {profileData?.year || "1"}
          </p>
        </div>
      </div>

      <button style={styles.profileButton} onClick={onOpenProfile}>
        View Profile
      </button>
    </div>
  );

  return (
    <div style={styles.page}>
      <main style={styles.mainContent}>
        <div style={styles.topBar}>
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>
              <FiSearch />
            </span>
            <input
              type="text"
              placeholder="Search students, groups, posts..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {isMobile && suggestionsNode}

        <section style={styles.feedSection}>
          {filteredPosts.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyTitle}>
                {normalizedSearch ? "No matching posts found" : "No posts yet"}
              </p>
              <p style={styles.emptyText}>
                {normalizedSearch
                  ? "Try a different search for students, groups, or posts."
                  : "Be the first to share something with your campus community."}
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onClick={setSelectedPost}
                onToggleLike={handleToggleLike}
                onOpenUserProfile={onOpenUserProfile}
              />
            ))
          )}
        </section>
      </main>

      {!isMobile && (
        <aside style={styles.rightPanel}>
          {profileCardNode}
          {suggestionsNode}
        </aside>
      )}
<div style={styles.instaHandle}>
      <a
        href="https://instagram.com/zaddieee_"
        target="_blank"
        rel="noreferrer"
        style={styles.instaHandleLink}
      >
        <FaInstagram size={18} />
<span>@zaddieee_</span>
      </a>
    </div>
    </div>
  );
}

const getStyles = (isMobile, isTablet, isDesktop, isTinyMobile) => ({
  page: {
    minHeight: "100dvh",
    background: "var(--bg-page)",
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : isTablet
        ? "minmax(0, 1fr) 320px"
        : "minmax(0, 1fr) 360px",
    gap: isMobile ? "12px" : "24px",
    padding: isMobile ? "8px" : isTablet ? "16px" : "0",
    boxSizing: "border-box",
    alignItems: "start",
  },
  suggestionAvatarImage: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },

  mainContent: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  topBar: {
    width: "100%",
  },

  searchWrapper: {
    position: "relative",
  },

  searchIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "16px",
    color: "var(--text-secondary)",
    display: "flex",
    alignItems: "center",
  },

  searchInput: {
    width: "100%",
    maxWidth: "100%",
    border: "1px solid var(--border-color)",
    background: "var(--bg-surface)",
    borderRadius: "16px",
    padding: isMobile ? "12px 12px 12px 38px" : "15px 16px 15px 44px",
    fontSize: isMobile ? "14px" : "15px",
    color: "var(--text-primary)",
    boxSizing: "border-box",
  },

  feedSection: {
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },

  emptyState: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "20px",
    padding: "32px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  },

  emptyTitle: {
    margin: "0 0 8px 0",
    fontSize: "20px",
    fontWeight: "700",
    color: "var(--text-primary)",
  },

  emptyText: {
    margin: 0,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },

  rightPanel: {
    display: isMobile ? "none" : "flex",
    flexDirection: "column",
    gap: "18px",
    position: "sticky",
    top: "24px",
    alignSelf: "start",
    height: "fit-content",
    width: "100%",
    maxWidth: isTablet ? "320px" : "360px",
     marginTop: "74px",
  },

  profileCard: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    minHeight: "188px",
    
  },

  profileCardTop: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "14px",
  },

  profileImage: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },

  profileName: {
    margin: 0,
    fontWeight: "700",
    fontSize: "15px",
    color: "var(--text-primary)",
  },

  profileSub: {
    margin: "4px 0 0 0",
    color: "var(--text-secondary)",
    fontSize: "13px",
  },

  profileButton: {
    width: "100%",
    border: "none",
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    borderRadius: "14px",
    padding: "12px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  widgetCardLarge: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "20px",
    padding: isTinyMobile ? "14px" : "18px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
    boxSizing: "border-box",
    maxHeight: isMobile ? "280px" : "none",
    overflowY: isMobile ? "auto" : "visible",
  },

  widgetHeader: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "12px",
  gap: "12px",
},

  widgetTitle: {
  margin: 0,
  fontSize: isTinyMobile ? "14px" : "16px",
  color: "var(--text-primary)",
  fontWeight: "700",
},

  smallLinkButton: {
    border: "none",
    background: "transparent",
    color: "var(--text-primary)",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    flexShrink: 0,
  },

  suggestionItem: {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  padding: "12px 0",
  borderBottom: "1px solid var(--border-color)",
  gap: "12px",
},
instaHandle: {
  position: "fixed",
  bottom: "20px",
  right: "20px",
  zIndex: 9999,
background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)",
  padding: "10px 16px",
  borderRadius: "999px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
},
  messageIconWrapper: {
  position: "relative",
  display: "inline-flex",
},

unreadBadge: {
  position: "absolute",
  top: "-6px",
  right: "-6px",
  minWidth: "20px",
  height: "20px",
  borderRadius: "999px",
  background: "#dc2626",
  color: "#ffffff",
  fontSize: "11px",
  fontWeight: "700",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 6px",
  lineHeight: 1,
},

instaHandleLink: {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#fff",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "600",
},
suggestionLeft: {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  cursor: "pointer",
  minWidth: 0,
  width: "100%",
},

  suggestionTextWrap: {
  minWidth: 0,
  flex: 1,
},
  suggestionAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    flexShrink: 0,
  },

  suggestionName: {
  margin: 0,
  fontSize: "14px",
  fontWeight: "700",
  color: "var(--text-primary)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
},

suggestionSub: {
  margin: "4px 0 0 0",
  fontSize: "12px",
  color: "var(--text-secondary)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
},

  suggestionActionGroup: {
  display: "flex",
  gap: "8px",
  flex: "1 1 220px",
},

  acceptSuggestionButton: {
  border: "none",
  background: "var(--button-primary)",
  color: "var(--button-primary-text)",
  borderRadius: "10px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
  whiteSpace: "nowrap",
  flex: 1,
},

  rejectSuggestionButton: {
  border: "1px solid var(--border-color)",
  background: "var(--bg-surface)",
  color: "var(--text-primary)",
  borderRadius: "10px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
  whiteSpace: "nowrap",
  flex: 1,
},


  addFriendButton: {
  border: "1px solid var(--border-color)",
  background: "var(--bg-surface)",
  color: "var(--text-primary)",
  borderRadius: "10px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
  whiteSpace: "nowrap",
  flex: "1 1 110px",
},

  addFriendButtonDone: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#065f46",
  },
  suggestionButtons: {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  width: "100%",
},

  messageButton: {
  border: "1px solid var(--border-color)",
  background: "var(--bg-surface-soft)",
  color: "var(--text-primary)",
  borderRadius: "10px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
  whiteSpace: "nowrap",
  flex: "1 1 110px",
},

  addFriendButtonMuted: {
    background: "var(--bg-surface-soft)",
    border: "1px solid var(--border-color)",
    color: "var(--text-secondary)",
  },
});

export default FeedPage;
