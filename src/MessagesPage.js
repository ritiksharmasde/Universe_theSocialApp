import React, { useEffect, useMemo, useState } from "react";
import { FiSend, FiSearch, FiMenu } from "react-icons/fi";
import { io } from "socket.io-client";
import API_BASE_URL, {SERVER_BASE_URL} from "./api";
import useBreakpoint from "./useBreakpoint";
const socket = io(SERVER_BASE_URL);

function MessagesPage({
  currentUserEmail = "ritik.17886@stu.upes.ac.in",
  activeConversationId,
  onOpenUserProfile,
}) {
  const { isMobile, isTablet } = useBreakpoint();

  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [showChatList, setShowChatList] = useState(!isMobile);
  const [searchText, setSearchText] = useState("");
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  const normalizedSelectedChatId =
    selectedChatId !== null ? Number(selectedChatId) : null;

  const deletedChatsKey = `deletedChats_${currentUserEmail?.toLowerCase?.() || "guest"}`;

  const getDeletedChatIds = () => {
    try {
      return JSON.parse(localStorage.getItem(deletedChatsKey) || "[]");
    } catch {
      return [];
    }
  };

  const filteredChats = useMemo(() => {
    const deletedChatIds = getDeletedChatIds();

    return conversations.filter((chat) => {
      const isActiveConversation =
        activeConversationId && Number(chat.id) === Number(activeConversationId);

      if (deletedChatIds.includes(Number(chat.id)) && !isActiveConversation) {
        return false;
      }

      const text = `${chat.name || ""} ${chat.displayName || ""}`.toLowerCase();
      return text.includes(searchText.toLowerCase());
    });
  }, [conversations, searchText, activeConversationId]);

  const selectedChat =
    filteredChats.find((chat) => Number(chat.id) === normalizedSelectedChatId) ||
    null;

  useEffect(() => {
    if (filteredChats.length === 0) {
      setSelectedChatId(null);
      setMessages([]);
      return;
    }

    const selectedStillExists = filteredChats.some(
      (chat) => Number(chat.id) === Number(normalizedSelectedChatId)
    );

    if (!selectedStillExists) {
      setSelectedChatId(Number(filteredChats[0].id));
    }
  }, [filteredChats, normalizedSelectedChatId]);

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

  useEffect(() => {
    const fetchBlockStatus = async () => {
      if (!selectedChat?.otherEmail || !currentUserEmail) {
        setIsBlocked(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/user/block-status?currentUserEmail=${encodeURIComponent(
            currentUserEmail
          )}&otherUserEmail=${encodeURIComponent(selectedChat.otherEmail)}`
        );
        const data = await response.json();

        if (!response.ok) {
          return;
        }

        setIsBlocked(Boolean(data.isBlocked));
      } catch (error) {
        console.error("fetch block status error:", error);
      }
    };

    fetchBlockStatus();
  }, [selectedChat, currentUserEmail]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/chat/conversations/${encodeURIComponent(currentUserEmail)}`
        );
        const data = await response.json();

        if (!response.ok) {
          console.error(data.error || "Failed to fetch conversations");
          return;
        }

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

          const parts = (chat.name || "").split("-");
          const otherEmail =
            parts.find(
              (part) => part.toLowerCase() !== currentUserEmail.toLowerCase()
            ) || "";

          const shortName = otherEmail ? otherEmail.split("@")[0] : "Conversation";

          return {
            ...chat,
            id: Number(chat.id),
            displayName: shortName,
            otherEmail,
            avatarUrl: "",
          };
        });

        setConversations(mappedConversations);

        setUnreadCounts((prev) => {
          const next = { ...prev };
          mappedConversations.forEach((chat) => {
            if (typeof next[Number(chat.id)] !== "number") {
              next[Number(chat.id)] = 0;
            }
          });
          return next;
        });

        if (activeConversationId) {
  setSelectedChatId(Number(activeConversationId));
} else if (!selectedChatId && mappedConversations.length > 0) {
  setSelectedChatId(Number(mappedConversations[0].id));
}
      } catch (error) {
        console.error("fetchConversations error:", error);
      }
    };

    if (currentUserEmail) {
      fetchConversations();
    }
  }, [currentUserEmail, activeConversationId]);

  useEffect(() => {
    const enrichConversations = async () => {
      try {
        const updated = await Promise.all(
          conversations.map(async (chat) => {
            if (chat.is_group || !chat.otherEmail) {
              return chat;
            }

            try {
              const response = await fetch(
                `${API_BASE_URL}/user/public/${encodeURIComponent(chat.otherEmail)}`
              );

              if (!response.ok) {
                return {
                  ...chat,
                  displayName: chat.displayName || chat.otherEmail.split("@")[0],
                  avatarUrl: chat.avatarUrl || "",
                  course: chat.course || "",
                  year: chat.year || "",
                };
              }

              const data = await response.json();

              return {
                ...chat,
                displayName:
                  data?.user?.full_name ||
                  data?.user?.username ||
                  chat.displayName ||
                  chat.otherEmail.split("@")[0],
                avatarUrl: data?.user?.profile_image_url
                  ? data.user.profile_image_url.startsWith("http")
                    ? data.user.profile_image_url
                    : `${SERVER_BASE_URL}${data.user.profile_image_url}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(data?.user?.full_name || chat.otherEmail.split("@")[0])}`,
                course: data?.user?.course || chat.course || "",
                year: data?.user?.year || chat.year || "",
              };
            } catch {
              return {
                ...chat,
                displayName: chat.displayName || chat.otherEmail.split("@")[0],
                avatarUrl: chat.avatarUrl || "",
                course: chat.course || "",
                year: chat.year || "",
              };
            }
          })
        );

        const changed =
          JSON.stringify(updated) !== JSON.stringify(conversations);

        if (changed) {
          setConversations(updated);
        }
      } catch (error) {
        console.error("enrichConversations error:", error);
      }
    };

    if (conversations.length > 0) {
      enrichConversations();
    }
  }, [conversations]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!normalizedSelectedChatId) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/chat/messages/${normalizedSelectedChatId}`
        );
        const data = await response.json();

        if (!response.ok) {
          console.error(data.error || "Failed to fetch messages");
          return;
        }

        setMessages(data.messages || []);
        setUnreadCounts((prev) => ({
          ...prev,
          [normalizedSelectedChatId]: 0,
        }));
      } catch (error) {
        console.error("fetchMessages error:", error);
      }
    };

    fetchMessages();
  }, [normalizedSelectedChatId]);

  useEffect(() => {
    if (!normalizedSelectedChatId) return;

    socket.emit("join_conversation", normalizedSelectedChatId);

    const handleReceiveMessage = (message) => {
      const incomingConversationId = Number(message.conversation_id);

      if (incomingConversationId === Number(normalizedSelectedChatId)) {
        setMessages((prev) => [...prev, message]);

        if (message.sender_email !== currentUserEmail) {
          setUnreadCounts((prev) => ({
            ...prev,
            [incomingConversationId]: 0,
          }));
        }
      } else if (message.sender_email !== currentUserEmail) {
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
  }, [normalizedSelectedChatId, currentUserEmail]);

  const handleSend = () => {
    if (!messageText.trim() || !normalizedSelectedChatId) return;

    socket.emit("send_message", {
      conversationId: normalizedSelectedChatId,
      senderEmail: currentUserEmail,
      messageText,
    });

    setMessageText("");
  };

  const handleSelectChat = (chatId) => {
    const numericId = Number(chatId);
    setSelectedChatId(numericId);
    setUnreadCounts((prev) => ({
      ...prev,
      [numericId]: 0,
    }));

    if (isMobile) {
      setShowChatList(false);
    }
  };

  const handleBlockUser = async () => {
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
        },
        body: JSON.stringify({
          blockerEmail: currentUserEmail,
          blockedEmail: selectedChat.otherEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || `Failed to ${action} user`);
        return;
      }

      setIsBlocked(!isBlocked);
      alert(isBlocked ? "User unblocked successfully." : "User blocked successfully.");
    } catch (error) {
      console.error(`${action} user error:`, error);
      alert("Server error");
    }
  };

  const handleDeleteChat = () => {
    if (!selectedChat) return;

    if (
      !window.confirm(
        "Delete this chat from your messages list? This will only remove it for you on this device."
      )
    ) {
      return;
    }

    const deletedChatIds = getDeletedChatIds();
    const updatedDeletedChatIds = Array.from(
      new Set([...deletedChatIds, Number(selectedChat.id)])
    );

    localStorage.setItem(deletedChatsKey, JSON.stringify(updatedDeletedChatIds));

    const remainingChats = conversations.filter(
      (chat) => !updatedDeletedChatIds.includes(Number(chat.id))
    );

    setConversations((prev) =>
      prev.filter((chat) => Number(chat.id) !== Number(selectedChat.id))
    );

    setUnreadCounts((prev) => {
      const next = { ...prev };
      delete next[Number(selectedChat.id)];
      return next;
    });

    if (remainingChats.length > 0) {
      setSelectedChatId(Number(remainingChats[0].id));
    } else {
      setSelectedChatId(null);
      setMessages([]);
    }

    if (isMobile) {
      setShowChatList(true);
    }
  };

  const handleOpenChats = () => {
    setShowChatList(true);
  };

  return (
    <div style={styles.page}>
      <div
        style={{
          ...styles.layout,
          gridTemplateColumns: isMobile ? "1fr" : "minmax(280px, 360px) minmax(0, 1fr)",
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

        {(!isMobile || !showChatList) && (
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
                  <button style={styles.mobileMenuButton} onClick={handleOpenChats}>
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
                      {(selectedChat?.displayName || "C").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={styles.headerRow}>
                    <span>{selectedChat?.displayName || "Select a chat"}</span>

                    {selectedChat?.otherEmail && (
                      <div style={styles.inlineActions}>
                        <button
                          style={{
                            ...styles.smallButton,
                            ...(isBlocked ? styles.unblockUserButton : styles.blockUserButton),
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
              {!selectedChat ? (
                <p style={styles.emptyText}>Choose a conversation to start chatting.</p>
              ) : messages.length === 0 ? (
                <p style={styles.emptyText}>No messages yet.</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    style={
                      message.sender_email === currentUserEmail
                        ? styles.messageBubbleMe
                        : styles.messageBubbleOther
                    }
                  >
                    {message.message_text}
                  </div>
                ))
              )}
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
                placeholder={isBlocked ? "You have blocked this user." : "Type a message..."}
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
    background: "var(--bg-page)",
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
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  unblockUserButton: {
    border: "1px solid #16a34a",
    color: "#16a34a",
  },
  deleteChatButton: {
    border: "1px solid #6b7280",
    background: "transparent",
    color: "#374151",
    borderRadius: "12px",
    padding: "8px 12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  chatList: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
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
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
  },
  chatHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
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
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
    flexWrap: "wrap",
  },

  inlineActions: {
    display: "flex",
    gap: "6px",
  },

  smallButton: {
    border: "1px solid var(--border-color)",
    background: "transparent",
    borderRadius: "8px",
    padding: "6px 10px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
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
  },
  activeChatItem: {
    background: "var(--bg-surface-soft)",
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
    background: "#dc2626",
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
    background: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    minWidth: 0,
    overflow: "hidden",
  },
  headerUser: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
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
  chatHeader: {
    padding: "12px 14px",
    borderBottom: "1px solid var(--border-color)",
    fontWeight: "700",
    justifyContent: "space-between",
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
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
  messagesArea: {
    flex: 1,
    minHeight: 0,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    background: "var(--bg-page)",
    overflowY: "auto",
  },
  messageBubbleOther: {
    alignSelf: "flex-start",
    background: "var(--bg-surface-soft)",
    color: "var(--text-primary)",
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
    display: "flex",
    gap: "10px",
    padding: "12px",
    borderTop: "1px solid var(--border-color)",
    background: "var(--bg-surface)",
    alignItems: "center",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: "14px 16px",
    outline: "none",
    fontSize: "14px",
    background: "var(--bg-surface)",
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
  emptyText: {
    margin: 0,
    color: "var(--text-secondary)",
  },
};

export default MessagesPage;
