import React, { useEffect, useState } from "react";
import useBreakpoint from "./useBreakpoint";
import {
  FiHeart,
  FiMessageCircle,
  FiSend,
  FiBookmark,
} from "react-icons/fi";
import API_BASE_URL from "./api";
const authHeaders = (includeJson = true) => ({
  ...(includeJson ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});
const glass = {
  background: "rgba(15, 25, 45, 0.75)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.08)",
};

function PostDetailPage({
  post,
  onBack,
  currentUserEmail,
  currentUserName,
  currentUserProfileImage,
  onToggleLike,
  onCommentAdded,
}) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const { isMobile, isTablet } = useBreakpoint();
  const styles = getStyles(isMobile, isTablet);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/posts/${post.id}/comments`, {
  headers: authHeaders(false),
});
        const data = await response.json();

        if (!response.ok) {
          console.error(data.error || "Failed to fetch comments");
          return;
        }

        setComments(data.comments || []);
      } catch (error) {
        console.error("fetch comments error:", error);
      }
    };

    if (post?.id) {
      fetchComments();
    }
  }, [post?.id]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${post.id}/comments`, {
  method: "POST",
  headers: authHeaders(),
  body: JSON.stringify({
    commentText,
  }),
});

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to add comment");
        return;
      }

      setComments((prev) => [...prev, data.comment]);
      setCommentText("");

      if (onCommentAdded) {
        onCommentAdded(post.id, data.comment);
      }
    } catch (error) {
      console.error("add comment error:", error);
      alert("Server error");
    }
  };

  if (!post) return null;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button style={styles.backButton} onClick={onBack}>
          ← Back
        </button>

        <div style={styles.content}>
          {post.image ? (
            <img src={`${post.image}`} alt="post" style={styles.image} />
          ) : (
            <div style={styles.noImage}>No image</div>
          )}

          <div style={styles.side}>
            <div style={styles.header}>
              <img src={`${post.avatar}`} alt={post.author} style={styles.avatar} />
              <div>
                <p style={styles.name}>{post.author}</p>
                <p style={styles.sub}>{post.subtitle}</p>
              </div>
            </div>

            <div style={styles.captionBox}>
              <p style={styles.captionText}>
                <strong>{post.author}</strong> {post.caption}
              </p>
            </div>

            <div style={styles.actions}>
              <button
                style={{
                  ...styles.actionButton,
                  ...(post.isLiked ? styles.likedButton : {}),
                }}
                onClick={() => onToggleLike && onToggleLike(post.id, post.isLiked)}
              >
                <FiHeart color={post.isLiked ? "#dc2626" : "var(--card-icon)"} />
              </button>

              <button style={styles.actionButton}>
                <FiMessageCircle color="var(--card-icon)" />
              </button>

              <button style={styles.actionButton}>
                {/* <FiSend color="var(--card-icon)" /> */}
              </button>

              <button style={styles.actionButton}>
                {/* <FiBookmark color="var(--card-icon)" /> */}
              </button>
            </div>

            <p style={styles.likesText}>{post.likes} likes</p>

            <div style={styles.comments}>
              {comments.length === 0 ? (
                <p style={styles.emptyComments}>No comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} style={styles.commentItem}>
                    <p style={styles.commentName}>
  {comment.full_name || comment.username || comment.user_name || comment.user_email}
</p>
                    <p style={styles.commentText}>{comment.comment_text}</p>
                  </div>
                ))
              )}
            </div>

            <div style={styles.commentInputRow}>
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                style={styles.commentInput}
              />
              <button style={styles.commentButton} onClick={handleAddComment}>
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// const {isMobile , isDesktop,isTablet} =useBreakpoint();

const getStyles = (isMobile, isTablet) => ({
  
    page: {
  minHeight: "100dvh",
  background: "transparent",
  padding: isMobile ? "10px" : "30px",
  color: "var(--text-primary)",
},
  
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  backButton: {
    marginBottom: "20px",
    cursor: "pointer",
    border: "none",
    background: "transparent",
    fontSize: "16px",
    color: "var(--text-primary)",
  },
  content: {
  ...glass,
  display: "grid",
  gridTemplateColumns: isMobile
    ? "1fr"
    : "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "20px",
  borderRadius: "20px",
  overflow: "hidden",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
},
  image: {
    width: "100%",
    height: "auto",
    maxHeight: isMobile ? "300px" : "600px",
    objectFit: "cover",
    background: "var(--bg-surface-soft)",
  },
 noImage: {
  minHeight: "500px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(8, 15, 30, 0.45)",
  color: "var(--text-secondary)",
  fontWeight: "600",
},
  side: {
  padding: isMobile ? "16px" : "20px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  background: "rgba(8, 15, 30, 0.45)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  minWidth: 0,
  boxSizing: "border-box",
},
  header: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  avatar: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  name: {
    margin: 0,
    fontWeight: "700",
    color: "var(--card-text)",
  },
  sub: {
    margin: "4px 0 0 0",
    fontSize: "12px",
    color: "var(--card-subtext)",
  },
  captionBox: {
    borderTop: "1px solid var(--border-color)",
    paddingTop: "10px",
  },
  captionText: {
    margin: 0,
    color: "var(--card-text)",
    lineHeight: 1.6,
  },
  actions: {
    display: "flex",
    gap: "16px",
    fontSize: "22px",
    color: "var(--card-icon)",
  },
  actionButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "22px",
    color: "var(--card-icon)",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  likedButton: {
    color: "#dc2626",
  },
  likesText: {
    margin: 0,
    fontWeight: "700",
    color: "var(--card-text)",
  },
  comments: {
    flex: 1,
    overflowY: "auto",
maxHeight: isMobile ? "200px" : "300px",
    borderTop: "1px solid var(--border-color)",
    borderBottom: "1px solid var(--border-color)",
    padding: "12px 0",
  },
  emptyComments: {
    color: "var(--card-subtext)",
    margin: 0,
  },
  commentItem: {
    marginBottom: "12px",
  },
  commentName: {
    margin: "0 0 4px 0",
    fontWeight: "700",
    fontSize: "14px",
    color: "var(--card-text)",
  },
  commentText: {
    margin: 0,
    color: "var(--card-subtext)",
    lineHeight: 1.5,
  },
 commentInputRow: {
  display: "flex",
  gap: isMobile ? "8px" : "10px",
  alignItems: "center",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
},
 commentInput: {
  flex: 1,
  minWidth: 0,
  width: 0,
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: isMobile ? "10px 12px" : "12px 14px",
  outline: "none",
  background: "rgba(8, 15, 30, 0.6)",
  color: "var(--text-primary)",
  boxSizing: "border-box",
},
  commentButton: {
  border: "none",
  background: "var(--button-primary)",
  color: "var(--button-primary-text)",
  borderRadius: "12px",
  padding: isMobile ? "10px 12px" : "12px 16px",
  cursor: "pointer",
  fontWeight: "600",
  flexShrink: 0,
  whiteSpace: "nowrap",
},
});

export default PostDetailPage;
