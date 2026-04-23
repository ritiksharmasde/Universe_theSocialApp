import React, { useEffect, useMemo, useRef, useState } from "react";
import socket from "./socket";


import {
    FiArrowLeft,
    FiSend,
    FiUsers,
    FiX,
    FiRefreshCw,
} from "react-icons/fi";
import API_BASE_URL , { SERVER_BASE_URL } from "./api";
const authHeaders = (includeJson = true) => ({
  ...(includeJson ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});
const parseJsonSafely = async (response) => {
    const text = await response.text();

    try {
        return JSON.parse(text);
    } catch (error) {
        console.error("Non-JSON response:", text);
        throw new Error(text.slice(0, 120) || "Invalid JSON response");
    }
};

function GroupChatPage({ group, currentUserEmail, onBack }) {
    const [messages, setMessages] = useState([]);
    const [members, setMembers] = useState([]);
    const [messageText, setMessageText] = useState("");
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    //   const {isMobile, isTablet} = useBreakpoint();
    const [showMembersPanel, setShowMembersPanel] = useState(false);
    const [screenWidth, setScreenWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1200
    );
    const isMobile = screenWidth < 768;
    const isTablet = screenWidth >= 768 && screenWidth < 1024;

    // const pageHeight = isMobile
    //     ? "calc(100dvh - 96px)"
    //     : isTablet
    //         ? "calc(100dvh - 108px)"
    //         : "calc(100dvh - 48px)";


    const messagesEndRef = useRef(null);

    const normalizedCurrentUserEmail = useMemo(
        () => (currentUserEmail || "").toLowerCase().trim(),
        [currentUserEmail]
    );

    //   const isMobile = screenWidth < 768;
    const isSmallMobile = screenWidth < 480;

    useEffect(() => {
        const handleResize = () => setScreenWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (!group?.id || !normalizedCurrentUserEmail) return;

        fetchMessages();
        fetchMembers();
    }, [group?.id, normalizedCurrentUserEmail]);
    useEffect(() => {
        if (!group?.id) return;

        // join room
        socket.emit("join_group", group.id);

        const handleIncomingMessage = (newMessage) => {
            setMessages((prev) => {
                const exists = prev.some((msg) => msg.id === newMessage.id);
                if (exists) return prev;
                return [...prev, newMessage];
            });
        };

        socket.on("group_message", handleIncomingMessage);

        return () => {
            socket.emit("leave_group", group.id);
            socket.off("group_message", handleIncomingMessage);
        };
    }, [group?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        if (!group?.id || !normalizedCurrentUserEmail) return;

        try {
            setLoadingMessages(true);
            setError("");

            const response = await fetch(
  `${API_BASE_URL}/groups/${group.id}/messages`,
  {
    headers: authHeaders(false),
  }
);

            const data = await parseJsonSafely(response);

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch messages");
            }

            setMessages(Array.isArray(data.messages) ? data.messages : []);
        } catch (err) {
            console.error("fetch messages error:", err);
            setError(err.message || "Failed to fetch messages");
        } finally {
            setLoadingMessages(false);
        }
    };

    const fetchMembers = async () => {
        if (!group?.id || !normalizedCurrentUserEmail) return;

        try {
            setLoadingMembers(true);

            const response = await fetch(
  `${API_BASE_URL}/groups/${group.id}/members`,
  {
    headers: authHeaders(false),
  }
);

            const data = await parseJsonSafely(response);

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch members");
            }

            setMembers(Array.isArray(data.members) ? data.members : []);
        } catch (err) {
            console.error("fetch members error:", err);
            setError(err.message || "Failed to fetch members");
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() || !group?.id || !normalizedCurrentUserEmail || sending) {
            return;
        }

        try {
            setSending(true);

            const myMemberData =
                members.find(
                    (member) =>
                        member.user_email?.toLowerCase() === normalizedCurrentUserEmail
                ) || null;

            const response = await fetch(`${API_BASE_URL}/groups/${group.id}/messages`, {
  method: "POST",
  headers: authHeaders(),
  body: JSON.stringify({
    messageText: messageText.trim(),
  }),
});
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to send message");
            }

            

            setMessageText("");
        } catch (err) {
            console.error("send message error:", err);
            alert(err.message || "Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (value) => {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const getAvatarUrl = (member) => {
        if (!member?.profile_image_url) return "";
        return member.profile_image_url.startsWith("http")
            ? member.profile_image_url
            : `${SERVER_BASE_URL}${member.profile_image_url}`;
    };

    const getInitial = (text) => {
        return (text || "U").trim().charAt(0).toUpperCase();
    };

    return (
        <div style={styles.page}>
            <div
                style={{
                    ...styles.chatShell,
                    borderRadius: isMobile ? 0 : 20,
                    border: isMobile ? "none" : "1px solid var(--border-color)",
                }}
            >
                <div
                    style={{
                        ...styles.header,
                        padding: isSmallMobile ? "8px 10px" : isMobile ? "10px 12px" : "14px 16px",
                    }}
                >
                    <div style={styles.headerLeft}>
                        <button type="button" onClick={onBack} style={styles.backButton}>
                            <FiArrowLeft />
                            {!isSmallMobile && <span>Back</span>}
                        </button>

                        <div style={styles.groupInfo}>
                            <h2
  style={{
    ...styles.groupName,
    fontSize: isSmallMobile ? "16px" : isMobile ? "18px" : "22px",
  }}
>
  {group?.name || "Group Chat"}
</h2>
                            <p style={styles.groupMeta}>
                                {(members?.length || group?.members_count || 0)}/5 members
                            </p>
                        </div>
                    </div>

                    <div style={styles.headerRight}>
                        <button
                            type="button"
                            onClick={() => {
                                fetchMessages();
                                fetchMembers();
                            }}
                            style={styles.iconButton}
                            title="Refresh"
                        >
                            <FiRefreshCw />
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowMembersPanel(true)}
                            style={styles.iconButton}
                            title="Members"
                        >
                            <FiUsers />
                        </button>
                    </div>
                </div>

                <div
  className="group-messages-scroll"
  style={{
    ...styles.messagesArea,
    padding: isSmallMobile ? "10px 6px 10px 10px" : isMobile ? "12px 8px 12px 12px" : "16px 10px 16px 16px",
  }}
>
                    {loadingMessages ? (
                        <div style={styles.stateWrap}>
                            <p style={styles.stateText}>Loading messages...</p>
                        </div>
                    ) : error ? (
                        <div style={styles.stateWrap}>
                            <p style={styles.errorText}>{error}</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div style={styles.stateWrap}>
                            <p style={styles.stateText}>No messages yet. Start the conversation.</p>
                        </div>
                    ) : (
                        <div style={styles.messagesList}>
                            {messages.map((msg) => {
                                const isMe =
                                    msg.sender_email?.toLowerCase() === normalizedCurrentUserEmail;

                                return (
                                    <div
                                        key={msg.id}
                                        style={{
                                            ...styles.messageRow,
                                            justifyContent: isMe ? "flex-end" : "flex-start",
                                        }}
                                    >
                                        <div
                                            style={{
                                                ...styles.messageBubble,
                                                maxWidth: isSmallMobile
                                                    ? "92%"
                                                    : isMobile
                                                        ? "86%"
                                                        : "min(78%, 720px)",
                                                ...(isMe ? styles.myMessageBubble : styles.otherMessageBubble),
                                            }}
                                        >
                                            {!isMe ? (
                                                <p style={styles.senderName}>
                                                    {msg.sender_name || "Student"}
                                                </p>
                                            ) : null}

                                            <p style={styles.messageText}>{msg.message_text}</p>

                                            <p
                                                style={{
                                                    ...styles.messageTime,
                                                    textAlign: isMe ? "right" : "left",
                                                }}
                                            >
                                                {formatTime(msg.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                <div
                    style={{
                        ...styles.inputBar,
                        padding: isSmallMobile ? "8px" : "12px",
                        gap: isSmallMobile ? "8px" : "10px",
                    }}
                >
                    <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        style={styles.input}
                        rows={1}
                    />

                    <button
                        type="button"
                        onClick={handleSendMessage}
                        style={{
                            ...styles.sendButton,
                            ...(sending || !messageText.trim() ? styles.sendButtonDisabled : {}),
                        }}
                        disabled={sending || !messageText.trim()}
                    >
                        <FiSend />
                    </button>
                </div>

                <div
                    style={{
                        ...styles.membersPanel,
                        width: isSmallMobile ? "100vw" : isMobile ? "88vw" : "360px",
                        ...(showMembersPanel ? styles.membersPanelOpen : {}),
                    }}
                >
                    <div style={styles.membersHeader}>
                        <div>
                            <h3 style={styles.membersTitle}>Group Members</h3>
                            <p style={styles.membersSubtitle}>
                                {members.length}/5 active members
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowMembersPanel(false)}
                            style={styles.iconButton}
                        >
                            <FiX />
                        </button>
                    </div>

                    <div style={styles.membersList}>
                        {loadingMembers ? (
                            <p style={styles.stateText}>Loading members...</p>
                        ) : members.length === 0 ? (
                            <p style={styles.stateText}>No members found.</p>
                        ) : (
                            members.map((member, index) => {
                                const isMe =
                                    member.user_email?.toLowerCase() === normalizedCurrentUserEmail;

                                return (
                                    <div key={`${member.user_email}-${index}`} style={styles.memberItem}>
                                        {getAvatarUrl(member) ? (
                                            <img
                                                src={getAvatarUrl(member)}
                                                alt={member.full_name || member.username || "User"}
                                                style={styles.memberAvatarImage}
                                            />
                                        ) : (
                                            <div style={styles.memberAvatarFallback}>
                                                {getInitial(member.full_name || member.username || member.user_email)}
                                            </div>
                                        )}

                                        <div style={styles.memberMeta}>
                                            <p style={styles.memberName}>
                                                {member.full_name || member.username || member.user_email}
                                                {isMe ? " (You)" : ""}
                                            </p>
                                            <p style={styles.memberEmail}>{member.user_email}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {showMembersPanel ? (
                    <div
                        style={styles.backdrop}
                        onClick={() => setShowMembersPanel(false)}
                    />
                ) : null}
            </div>
        </div>
    );
}

const styles = {
    page: {
  height: "calc(100dvh - 48px)",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  width: "100%",
  minWidth: 0,
  overflow: "hidden",
  background: "transparent",
},

    chatShell: {
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  background: "rgba(10, 20, 35, 0.85)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  border: "1px solid var(--border-color)",
  borderRadius: "20px",
},
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        borderBottom: "1px solid var(--border-color)",
        background: "rgba(20, 30, 50, 0.72)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
        flexWrap: "nowrap",
        flexShrink: 0,
        minWidth: 0,
    },

    headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minWidth: 0,
        flex: 1,
    },

    headerRight: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexShrink: 0,
    },

    backButton: {
        border: "none",
        background: "transparent",
        color: "var(--text-primary)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        cursor: "pointer",
        fontSize: "14px",
        padding: "6px 8px",
        borderRadius: "10px",
        flexShrink: 0,
    },

    groupInfo: {
        minWidth: 0,
        flex: 1,
    },

    groupName: {
        margin: 0,
        fontSize: "20px",
        color: "var(--text-primary)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        lineHeight: 1.1,
    },

    groupMeta: {
        margin: "4px 0 0 0",
        fontSize: "13px",
        color: "var(--text-secondary)",
    },

    iconButton: {
        border: "1px solid var(--border-color)",
        background: "var(--bg-surface)",
        color: "var(--text-primary)",
        width: "40px",
        height: "40px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "18px",
        flexShrink: 0,
    },

    messagesArea: {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  scrollbarGutter: "stable",
},

    messagesList: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },

    messageRow: {
        display: "flex",
        width: "100%",
    },

    messageBubble: {
        borderRadius: "18px",
        padding: "12px 14px",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
    },

    myMessageBubble: {
        background: "var(--button-primary)",
        color: "var(--button-primary-text)",
        borderBottomRightRadius: "6px",
    },

    otherMessageBubble: {
        background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
        color: "var(--text-primary)",
        border: "1px solid var(--border-color)",
        borderBottomLeftRadius: "6px",
    },

    senderName: {
        margin: "0 0 6px 0",
        fontSize: "12px",
        fontWeight: "700",
        opacity: 0.8,
    },

    messageText: {
        margin: 0,
        lineHeight: 1.5,
        fontSize: "15px",
    },

    messageTime: {
        margin: "8px 0 0 0",
        fontSize: "11px",
        opacity: 0.75,
    },

    inputBar: {
        display: "flex",
        borderTop: "1px solid var(--border-color)",
        background: "rgba(20, 30, 50, 0.72)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
        flexShrink: 0,       // ⭐ keeps it at bottom
    },

    input: {
        flex: 1,
        resize: "none",
        minHeight: "46px",
        maxHeight: "120px",
        borderRadius: "14px",
        border: "1px solid var(--border-color)",
        background: "var(--bg-page)",
        color: "var(--text-primary)",
        padding: "12px 14px",
        fontSize: "15px",
        outline: "none",
        fontFamily: "inherit",
        overflowY: "auto",
        minWidth: 0,
    },

    sendButton: {
        width: "48px",
        height: "48px",
        borderRadius: "14px",
        border: "none",
        background: "var(--button-primary)",
        color: "var(--button-primary-text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "18px",
        flexShrink: 0,
    },

    sendButtonDisabled: {
        opacity: 0.6,
        cursor: "not-allowed",
    },

    membersPanel: {
        position: "fixed",
        top: 0,
        right: 0,
        height: "100dvh",
        maxWidth: "100vw",
        background: "rgba(20, 30, 50, 0.9)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
        borderLeft: "1px solid var(--border-color)",
        transform: "translateX(100%)",
        transition: "transform 0.25s ease",
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.12)",
    },

    membersPanelOpen: {
        transform: "translateX(0)",
    },

    membersHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px",
        padding: "16px",
        borderBottom: "1px solid var(--border-color)",
        flexShrink: 0,
    },

    membersTitle: {
        margin: 0,
        fontSize: "20px",
        color: "var(--text-primary)",
    },

    membersSubtitle: {
        margin: "4px 0 0 0",
        fontSize: "13px",
        color: "var(--text-secondary)",
    },

    membersList: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "12px",
        overflowY: "auto",
        minHeight: 0,
    },

    memberItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px",
        borderRadius: "14px",
        background: "var(--bg-page)",
        border: "1px solid var(--border-color)",
    },

    memberAvatarImage: {
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
    },

    memberAvatarFallback: {
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

    memberMeta: {
        minWidth: 0,
        flex: 1,
    },

    memberName: {
        margin: 0,
        fontSize: "14px",
        fontWeight: "700",
        color: "var(--text-primary)",
        wordBreak: "break-word",
    },

    memberEmail: {
        margin: "4px 0 0 0",
        fontSize: "12px",
        color: "var(--text-secondary)",
        wordBreak: "break-word",
    },

    stateWrap: {
        minHeight: "240px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    stateText: {
        margin: 0,
        color: "var(--text-secondary)",
        fontSize: "14px",
        textAlign: "center",
    },

    errorText: {
        margin: 0,
        color: "red",
        fontSize: "14px",
        textAlign: "center",
    },

    backdrop: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.25)",
        zIndex: 20,
    },
};

export default GroupChatPage;
