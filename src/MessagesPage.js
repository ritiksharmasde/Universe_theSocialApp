import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { FiSend, FiSearch, FiMenu, FiSmile } from "react-icons/fi";
import EmojiPicker from "emoji-picker-react";
import socket from "./socket";
import API_BASE_URL, { SERVER_BASE_URL } from "./api";
import useBreakpoint from "./useBreakpoint";

const glass = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid var(--border-color)",
};

function MessagesPage({
  currentUserEmail = "",
  activeConversationId,
  unreadCounts,
  setUnreadCounts,
  onOpenUserProfile,
  conversations: propConversations = [], // ✅ NEW: Accept conversations from parent
  setConversations: propSetConversations, // ✅ NEW: Accept setter from parent
}) {
  const { isMobile, isTablet } = useBreakpoint();

  const [selectedChatId, setSelectedChatId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [showChatList, setShowChatList] = useState(true);
  const [searchText, setSearchText] = useState("");
  
  // Refs for avoiding stale closures
  const conversationsRef = useRef([]);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef([]);
  const receivedMessageIdsRef = useRef(new Set());
  const selectedChatIdRef = useRef(null);
  const currentUserEmailRef = useRef("");
  const blockStatusCacheRef = useRef({});
  const loadingStateRef = useRef({});
  const isMountedRef = useRef(true); // ✅ NEW: Track if component is mounted
  
  // State - use prop if provided, otherwise local state
  const [localConversations, setLocalConversations] = useState([]);
  const conversations = propConversations.length > 0 ? propConversations : localConversations;
  const setConversations = propSetConversations || setLocalConversations;
  
  const [messages, setMessages] = useState([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const normalizedSelectedChatId =
    selectedChatId !== null ? Number(selectedChatId) : null;

  // ============ FILTERING ============
  const filteredChats = useMemo(() => {
    return conversations.filter((chat) => {
      const text = `${chat.name || ""} ${chat.displayName || ""}`.toLowerCase();
      return text.includes(searchText.toLowerCase());
    });
  }, [conversations, searchText]);

  const selectedChat =
    filteredChats.find((chat) => Number(chat.id) === normalizedSelectedChatId) ||
    null;

  // ============ REF SYNC ============
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    selectedChatIdRef.current = normalizedSelectedChatId;
  }, [normalizedSelectedChatId]);

  useEffect(() => {
    currentUserEmailRef.current = currentUserEmail.toLowerCase().trim();
  }, [currentUserEmail]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // ============ CLEANUP ON UNMOUNT ============
  useEffect(() => {
    return () => {
      isMountedRef.current = false; // Mark unmounted to prevent state updates
    };
  }, []);

  // ============ EMOJI PICKER ============
  const handleEmojiClick = useCallback((emojiData) => {
    setMessageText((prev) => prev + emojiData.emoji);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setShowEmojiPicker(false);
    if (showEmojiPicker) {
      window.addEventListener("click", handleClickOutside);
    }
    return () => window.removeEventListener("click", handleClickOutside);
  }, [showEmojiPicker]);

  // ============ CHAT SELECTION & FILTERING ============
  useEffect(() => {
    if (filteredChats.length === 0) {
      setSelectedChatId(null);
      setMessages([]);
      return;
    }

    const selectedStillExists = filteredChats.some(
      (chat) => Number(chat.id) === Number(normalizedSelectedChatId)
    );

    if (!selectedStillExists && normalizedSelectedChatId !== null) {
      setSelectedChatId(null);
      setMessages([]);
    }
  }, [filteredChats, normalizedSelectedChatId]);

  // ============ ACTIVE CONVERSATION ID EFFECT ============
  useEffect(() => {
    if (activeConversationId) {
      setSelectedChatId(Number(activeConversationId));
      setUnreadCounts((prev) => ({
        ...prev,
        [Number(activeConversationId)]: 0,
      }));

      if (isMobile) {
        setShowChatList(false);
      }
    }
  }, [activeConversationId, isMobile]);

  // ============ BLOCK STATUS (WITH CACHING) ============
  useEffect(() => {
    const fetchBlockStatus = async () => {
      if (!selectedChat?.otherEmail || !currentUserEmail) {
        setIsBlocked(false);
        return;
      }

      const cacheKey = selectedChat.otherEmail.toLowerCase();

      if (blockStatusCacheRef.current[cacheKey] !== undefined) {
        setIsBlocked(blockStatusCacheRef.current[cacheKey]);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/user/block-status?otherUserEmail=${encodeURIComponent(
            selectedChat.otherEmail
          )}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        if (!response.ok) {
          console.error("Failed to fetch block status");
          return;
        }

        const data = await response.json();
        const blocked = Boolean(data.isBlocked);
        
        blockStatusCacheRef.current[cacheKey] = blocked;
        if (isMountedRef.current) {
          setIsBlocked(blocked);
        }
      } catch (error) {
        console.error("fetch block status error:", error);
      }
    };

    fetchBlockStatus();
  }, [selectedChat?.otherEmail, currentUserEmail]);

  // ============ FETCH CONVERSATIONS (OPTIMIZED) ============
  // ============ FETCH CONVERSATIONS (OPTIMIZED + FIX) ============
useEffect(() => {
  const activeId = activeConversationId ? Number(activeConversationId) : null;

  const activeConversationExists =
    !activeId ||
    conversations.some((chat) => Number(chat.id) === activeId);

  // ✅ Use cache if it already contains the needed chat
  if (propConversations.length > 0 && activeConversationExists) {
    return;
  }

  const fetchConversations = async () => {
    if (!currentUserEmail) return;

    try {
      const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch conversations");
        return;
      }

      const data = await response.json();

      const mappedConversations = (data.conversations || []).map((chat) => {
        if (chat.is_group) {
          return {
            ...chat,
            id: Number(chat.id),
            displayName: chat.name || "Group Chat",
            otherEmail: null,
            avatarUrl: "",
          };
        }

        const displayName =
          chat.other_full_name ||
          chat.other_username ||
          chat.other_email?.split("@")[0] ||
          "Conversation";

        return {
          ...chat,
          id: Number(chat.id),
          displayName,
          otherEmail: chat.other_email,
          avatarUrl: chat.other_profile_image_url
            ? chat.other_profile_image_url.startsWith("http")
              ? chat.other_profile_image_url
              : `${SERVER_BASE_URL}${chat.other_profile_image_url}`
            : "",
          course: chat.other_course || "",
          year: chat.other_year || "",
        };
      });

      if (!isMountedRef.current) return;

      setConversations(mappedConversations);

      const counts = {};
      mappedConversations.forEach((chat) => {
        counts[Number(chat.id)] = Number(chat.unread_count || 0);
      });
      setUnreadCounts(counts);

      if (activeId) {
        setSelectedChatId(activeId);
      }
    } catch (error) {
      console.error("fetchConversations error:", error);
    }
  };

  fetchConversations();
}, [currentUserEmail, activeConversationId, propConversations.length]);
  
  // ============ FETCH MESSAGES ============
  useEffect(() => {
    const fetchMessages = async () => {
      if (!normalizedSelectedChatId) return;

      if (loadingStateRef.current[normalizedSelectedChatId]) return;
      
      loadingStateRef.current[normalizedSelectedChatId] = true;
      setIsLoadingMessages(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/chat/messages/${normalizedSelectedChatId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          console.error("Failed to fetch messages");
          return;
        }

        const data = await response.json();
        
        if (!isMountedRef.current) return;

        setMessages(data.messages || []);
        setUnreadCounts((prev) => ({
          ...prev,
          [normalizedSelectedChatId]: 0,
        }));
      } catch (error) {
        console.error("fetchMessages error:", error);
      } finally {
        loadingStateRef.current[normalizedSelectedChatId] = false;
        if (isMountedRef.current) {
          setIsLoadingMessages(false);
        }
      }
    };

    fetchMessages();
  }, [normalizedSelectedChatId]);

  // ============ SOCKET EVENTS ============
  useEffect(() => {
    const handleReceiveMessage = (message) => {
      const messageKey =
        message.id ||
        `${message.conversation_id}-${message.sender_email}-${message.message_text}`;

      if (receivedMessageIdsRef.current.has(messageKey)) return;
      receivedMessageIdsRef.current.add(messageKey);

      // ✅ Limit Set size to prevent memory leak
      if (receivedMessageIdsRef.current.size > 5000) {
        receivedMessageIdsRef.current.clear();
      }

      const incomingConversationId = Number(message.conversation_id);
      const isMine =
        message.sender_email?.toLowerCase().trim() === currentUserEmailRef.current;

      if (!isMountedRef.current) return;

      // Move conversation to top
      setConversations((prev) => {
        const target = prev.find(
          (chat) => Number(chat.id) === incomingConversationId
        );

        if (!target) return prev;

        const rest = prev.filter(
          (chat) => Number(chat.id) !== incomingConversationId
        );

        return [target, ...rest];
      });

      // If viewing this conversation, add message
      if (incomingConversationId === Number(selectedChatIdRef.current)) {
        setMessages((prev) => [...prev, message]);

        if (!isMine) {
          setUnreadCounts((prev) => ({
            ...prev,
            [incomingConversationId]: 0,
          }));
        }
        return;
      }

      // If not viewing, increment unread count
      if (!isMine) {
        setUnreadCounts((prev) => ({
          ...prev,
          [incomingConversationId]: (prev[incomingConversationId] || 0) + 1,
        }));
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, []);

  // ============ JOIN CONVERSATION ============
  useEffect(() => {
    if (normalizedSelectedChatId) {
      socket.emit("join_conversation", normalizedSelectedChatId);
    }
  }, [normalizedSelectedChatId]);

  // ============ AUTO-SCROLL ============
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  // ============ SEND MESSAGE ============
// ============ SEND MESSAGE ============
const handleSend = useCallback(() => {
  const text = messageText.trim();

  if (!text || !normalizedSelectedChatId) return;

  const tempMessage = {
    id: `temp-${Date.now()}`,
    conversation_id: normalizedSelectedChatId,
    sender_email: currentUserEmailRef.current,
    message_text: text,
  };

  // ✅ Show your message instantly
  setMessages((prev) => [...prev, tempMessage]);

  socket.emit("send_message", {
    conversationId: normalizedSelectedChatId,
    messageText: text,
  });

  setMessageText("");
  setShowEmojiPicker(false);
}, [messageText, normalizedSelectedChatId]);

  // ============ SELECT CHAT ============
  const handleSelectChat = useCallback((chatId) => {
    const numericId = Number(chatId);
    setSelectedChatId(numericId);
    setUnreadCounts((prev) => ({
      ...prev,
      [numericId]: 0,
    }));

    if (isMobile) {
      setShowChatList(false);
    }
  }, [isMobile]);

  // ============ BLOCK USER ============
  const handleBlockUser = useCallback(async () => {
    if (!selectedChat?.otherEmail) return;

    const action = isBlocked ? "unblock" : "block";
    const confirmMessage = isBlocked
      ? "This user is already blocked. Do you want to unblock them?"
      : "Are you sure you want to block this user?";

    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/user/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          blockedEmail: selectedChat.otherEmail,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || `Failed to ${action} user`);
        return;
      }

      const newBlockStatus = !isBlocked;
      if (isMountedRef.current) {
        setIsBlocked(newBlockStatus);
      }
      
      blockStatusCacheRef.current[selectedChat.otherEmail.toLowerCase()] = newBlockStatus;
      
      alert(
        newBlockStatus
          ? "User blocked successfully."
          : "User unblocked successfully."
      );
    } catch (error) {
      console.error(`${action} user error:`, error);
      alert("Server error");
    }
  }, [isBlocked, selectedChat?.otherEmail]);

  // ============ DELETE CHAT ============
  const handleDeleteChat = useCallback(async () => {
    if (!selectedChat) return;

    if (
      !window.confirm(
        "Delete this chat for you? The other person will still keep their chat."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/chat/delete-for-me`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          conversationId: selectedChat.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to delete chat");
        return;
      }

      if (!isMountedRef.current) return;

      setConversations((prev) => {
        const updated = prev.filter(
          (chat) => Number(chat.id) !== Number(selectedChat.id)
        );

        setSelectedChatId(null);
        setMessages([]);

        return updated;
      });

      setUnreadCounts((prev) => {
        const next = { ...prev };
        delete next[Number(selectedChat.id)];
        return next;
      });

      if (isMobile) {
        setShowChatList(true);
      }
    } catch (error) {
      console.error("delete chat error:", error);
      alert("Server error");
    }
  }, [selectedChat, isMobile]);

  // ============ RENDER ============
  return (
    <div style={styles.page}>
      <div
        style={{
          ...styles.layout,
          gridTemplateColumns: isMobile
            ? "1fr"
            : "minmax(280px, 360px) minmax(0, 1fr)",
        }}
      >
        {(!isMobile || showChatList) && (
          <div style={styles.chatList}>
            <h1 style={styles.title}>Messages</h1>

            <div style={styles.searchBox}>
              <FiSearch style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            {filteredChats.length === 0 ? (
              <p style={styles.emptyText}>No conversations yet.</p>
            ) : (
              filteredChats.map((chat) => {
                const isActive = Number(chat.id) === normalizedSelectedChatId;
                const unreadCount = unreadCounts[Number(chat.id)] || 0;

                return (
                  <button
                    key={chat.id}
                    style={{
                      ...styles.chatItem,
                      ...(isActive ? styles.activeChatItem : {}),
                    }}
                    onClick={() => handleSelectChat(chat.id)}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "var(--bg-surface-soft)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    {chat.avatarUrl ? (
                      <img
                        src={chat.avatarUrl}
                        alt={chat.displayName || "User"}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <div style={styles.avatar}>
                        {(chat.displayName || "C").charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div style={styles.chatMeta}>
                      <div style={styles.chatNameRow}>
                        <p style={styles.chatName}>
                          {chat.displayName || "Conversation"}
                        </p>
                        {unreadCount > 0 ? (
                          <span style={styles.unreadBadge}>
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        ) : null}
                      </div>

                      <p style={styles.chatPreview}>
                        {chat.is_group
                          ? "Group chat"
                          : chat.course
                          ? `${chat.course} • Year ${chat.year || ""}`
                          : "Direct message"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {(!isMobile || (!showChatList && selectedChat)) && (
          <div
            style={{
              ...styles.chatWindow,
              ...(isMobile
                ? {
                  position: "fixed",
                  top: "60px",
                  left: "12px",
                  right: "12px",
                  bottom: "12px",
                  height: "auto",
                  zIndex: 20,
                }
                : {}),
            }}
          >
            <div style={styles.chatHeader}>
              <div style={styles.chatHeaderLeft}>
                {isMobile && (
                  <button
                    style={styles.mobileMenuButton}
                    onClick={() => {
                      setShowChatList(true);
                      setSelectedChatId(null);
                      setMessages([]);
                    }}
                  >
                    <FiMenu />
                  </button>
                )}

                <div
                  style={{
                    ...styles.headerUser,
                    cursor: selectedChat?.otherEmail ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (selectedChat?.otherEmail && onOpenUserProfile) {
                      onOpenUserProfile(selectedChat.otherEmail);
                    }
                  }}
                >
                  {selectedChat?.avatarUrl ? (
                    <img
                      src={selectedChat.avatarUrl}
                      alt={selectedChat.displayName || "User"}
                      style={styles.headerAvatarImage}
                    />
                  ) : (
                    <div style={styles.headerAvatarFallback}>
                      {(selectedChat?.displayName || "C")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div style={styles.headerRow}>
                    <span>{selectedChat?.displayName || "Select a chat"}</span>

                    {selectedChat?.otherEmail && (
                      <div style={styles.inlineActions}>
                        <button
                          style={{
                            ...styles.smallButton,
                            ...(isBlocked
                              ? styles.unblockUserButton
                              : styles.blockUserButton),
                          }}
                          onClick={handleBlockUser}
                        >
                          {isBlocked ? "Unblock" : "Block"}
                        </button>

                        <button
                          style={styles.smallButton}
                          onClick={handleDeleteChat}
                        >
                          Delete Chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                ...styles.messagesArea,
                ...(isMobile
                  ? {
                    paddingBottom: "84px",
                  }
                  : {}),
              }}
            >
              {isLoadingMessages ? (
                <div style={styles.emptyStateCenter}>
                  <p style={styles.emptyText}>Loading messages...</p>
                </div>
              ) : !selectedChat ? (
                <div style={styles.emptyStateCenter}>
                  <p style={styles.emptyText}>Select a chat to view messages.</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={styles.emptyStateCenter}>
                  <p style={styles.emptyText}>No messages yet.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    style={
                      message.sender_email?.toLowerCase().trim() ===
                      currentUserEmailRef.current
                        ? styles.messageBubbleMe
                        : styles.messageBubbleOther
                    }
                  >
                    {message.message_text}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div
              style={{
                ...styles.inputRow,
                ...(isMobile
                  ? {
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }
                  : {}),
              }}
            >
              <div style={styles.emojiWrapper}>
                <button
                  type="button"
                  style={styles.emojiButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEmojiPicker((prev) => !prev);
                  }}
                >
                  <FiSmile />
                </button>

                {showEmojiPicker && (
                  <div
                    style={styles.emojiPickerBox}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      theme="auto"
                      width={300}
                      height={350}
                    />
                  </div>
                )}
              </div>

              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  isBlocked ? "You have blocked this user." : "Type a message..."
                }
                disabled={!selectedChat || isBlocked}
                style={styles.input}
              />
              <button
                style={styles.sendButton}
                onClick={handleSend}
                disabled={!selectedChat || isBlocked}
              >
                <FiSend />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "calc(100dvh - 48px)",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
    color: "var(--text-primary)",
    background: "transparent",
    overflow: "hidden",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 360px) minmax(0, 1fr)",
    gap: "20px",
    alignItems: "stretch",
    height: "100%",
    minHeight: 0,
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
  },

  chatList: {
    ...glass,
    borderRadius: "20px",
    padding: "20px",
    boxSizing: "border-box",
    height: "100%",
    minHeight: 0,
    minWidth: 0,
    overflowY: "auto",
  },

  title: {
    margin: "0 0 18px 0",
    fontSize: "28px",
    color: "var(--text-primary)",
  },

  searchBox: {
    position: "relative",
    marginBottom: "16px",
  },

  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-secondary)",
    fontSize: "15px",
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: "12px 14px 12px 38px",
    outline: "none",
    fontSize: "14px",
    background: "var(--input-bg)",
    color: "var(--text-primary)",
  },

  chatItem: {
    width: "100%",
    border: "none",
    background: "transparent",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    padding: "12px",
    borderRadius: "14px",
    cursor: "pointer",
    textAlign: "left",
    marginBottom: "8px",
    color: "var(--text-primary)",
    transition: "all 0.2s ease",
  },

  activeChatItem: {
    background:
      "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.18))",
    border: "1px solid rgba(99,102,241,0.5)",
    boxShadow: "0 6px 18px rgba(99,102,241,0.35)",
    transform: "scale(1.01)",
  },

  avatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    flexShrink: 0,
  },

  avatarImage: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    border: "2px solid rgba(255,255,255,0.08)",
  },

  chatMeta: {
    flex: 1,
    minWidth: 0,
  },

  chatNameRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },

  chatName: {
    margin: 0,
    fontWeight: "700",
    color: "var(--text-primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  unreadBadge: {
    minWidth: "20px",
    height: "20px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "700",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 6px",
    flexShrink: 0,
  },

  chatPreview: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "var(--text-secondary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  chatWindow: {
    ...glass,
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    minWidth: 0,
    overflow: "hidden",
  },

  chatHeader: {
    padding: "12px",
    borderBottom: "1px solid var(--border-color)",
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    flexWrap: "nowrap",
  },

  chatHeaderLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    width: "100%",
    minWidth: 0,
  },

  mobileMenuButton: {
    border: "none",
    background: "transparent",
    color: "var(--text-primary)",
    cursor: "pointer",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  headerUser: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    minWidth: 0,
    width: "100%",
  },

  headerAvatarImage: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    objectFit: "cover",
  },

  headerAvatarFallback: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    flexShrink: 0,
  },

  headerRow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "8px",
    minWidth: 0,
    flex: 1,
  },

  inlineActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    width: "100%",
  },

  blockUserButton: {
    border: "1px solid #dc2626",
    background: "transparent",
    color: "#dc2626",
    borderRadius: "12px",
    padding: "8px 12px",
    fontWeight: "700",
    cursor: "pointer",
    marginLeft: "auto",
  },

  unblockUserButton: {
    border: "1px solid #16a34a",
    color: "#16a34a",
  },

  smallButton: {
    border: "1px solid var(--border-color)",
    background: "var(--bg-surface-soft)",
    color: "var(--text-primary)",
    borderRadius: "12px",
    padding: "9px 12px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  messagesArea: {
    flex: 1,
    minHeight: 0,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    background: "transparent",
    overflowY: "auto",
  },

  emptyStateCenter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },

  messageBubbleOther: {
    alignSelf: "flex-start",
    background: "var(--bg-surface-soft)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    padding: "12px 14px",
    borderRadius: "14px",
    maxWidth: "70%",
    lineHeight: 1.5,
  },

  messageBubbleMe: {
    alignSelf: "flex-end",
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    padding: "12px 14px",
    borderRadius: "14px",
    maxWidth: "70%",
    lineHeight: 1.5,
  },

  inputRow: {
    display: "grid",
    gridTemplateColumns: "48px minmax(0, 1fr) 48px",
    gap: "10px",
    padding: "12px",
    borderTop: "1px solid var(--border-color)",
    background: "var(--glass-bg)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    alignItems: "center",
    boxSizing: "border-box",
    width: "100%",
  },

  input: {
    flex: 1,
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: "14px 16px",
    outline: "none",
    fontSize: "14px",
    background: "var(--input-bg)",
    color: "var(--text-primary)",
  },

  sendButton: {
    width: "48px",
    minWidth: "48px",
    height: "48px",
    border: "none",
    borderRadius: "14px",
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    cursor: "pointer",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  emojiWrapper: {
    position: "relative",
    flexShrink: 0,
  },

  emojiButton: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "var(--input-bg)",
    border: "1px solid var(--border-color)",
    color: "var(--text-primary)",
    cursor: "pointer",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  emojiPickerBox: {
    position: "absolute",
    bottom: "58px",
    left: 0,
    zIndex: 50,
  },

  emptyText: {
    margin: 0,
    color: "var(--text-secondary)",
  },
};

export default MessagesPage;
