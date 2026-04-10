import React from "react";
import {
  FiHeart,
  FiMessageCircle,

  FiBookmark,
  FiMoreHorizontal,
} from "react-icons/fi";

function PostCard({ post, onClick, onToggleLike, onOpenUserProfile }) {
  return (
    <article style={styles.postCard} onClick={() => onClick && onClick(post)}>
      <div style={styles.postHeader}>
        <div style={styles.postHeaderLeft}>
          <img
            src={post.avatar}
            alt={post.author}
            style={styles.avatar}
            onClick={(e) => {
              e.stopPropagation();
              onOpenUserProfile && onOpenUserProfile(post.email);
            }}
          />
          <div>
            <p
              style={styles.authorName}
              onClick={(e) => {
                e.stopPropagation();
                onOpenUserProfile && onOpenUserProfile(post.email);
              }}
            >
              {post.author}
            </p>
            <p style={styles.authorSub}>{post.subtitle}</p>
          </div>
        </div>

        <button style={styles.moreButton} onClick={(e) => e.stopPropagation()}>
          <FiMoreHorizontal color="var(--card-icon)" />
        </button>
      </div>

      {post.image ? (
        <img src={post.image} alt="post" style={styles.postImage} />
      ) : null}

      <div style={styles.postActions}>
        <div style={styles.leftPostActions}>
          <button
            style={{
              ...styles.iconOnlyButton,
              ...(post.isLiked ? styles.likedButton : {}),
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike && onToggleLike(post.id, post.isLiked);
            }}
          >
            <FiHeart color={post.isLiked ? "#dc2626" : "var(--card-icon)"} />
          </button>

          <button
            style={styles.iconOnlyButton}
            onClick={(e) => {
              e.stopPropagation();
              onClick && onClick(post);
            }}
          >
            <FiMessageCircle color="var(--card-icon)" />
          </button>

          <button
            style={styles.iconOnlyButton}
            onClick={(e) => e.stopPropagation()}
          >

          </button>
        </div>

        <button
          style={styles.iconOnlyButton}
          onClick={(e) => e.stopPropagation()}
        >
          {/* <FiBookmark color="var(--card-icon)" /> */}
        </button>
      </div>

      <div style={styles.postBody}>
        <p style={styles.likesText}>{post.likes} likes</p>
        <p style={styles.captionText}>
          <strong>{post.author}</strong> {post.caption}
        </p>
        <p style={styles.commentsText}>
          View all {post.comments} comments
        </p>
        <p style={styles.timeText}>{post.time}</p>
      </div>
    </article>
  );
}

const styles = {
  postCard: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "20px",
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  },
  postHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    background: "var(--bg-surface)",
  },
  postHeaderLeft: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  avatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    objectFit: "cover",
    cursor: "pointer",
  },
  authorName: {
    margin: 0,
    fontWeight: "700",
    cursor: "pointer",
    color: "var(--card-text)",
  },
  authorSub: {
    margin: "4px 0 0 0",
    fontSize: "12px",
    color: "var(--card-subtext)",
  },
  moreButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "var(--card-icon)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },
  postImage: {
    width: "100%",
    height: "420px",
    objectFit: "cover",
    background: "var(--bg-surface-soft)",
    display: "block",
  },
  postActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "var(--bg-surface)",
    color: "var(--card-icon)",
  },
  leftPostActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  iconOnlyButton: {
    border: "none",
    background: "transparent",
    fontSize: "20px",
    cursor: "pointer",
    color: "var(--card-icon)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  likedButton: {
    color: "#dc2626",
  },
  postBody: {
    padding: "0 16px 16px",
    background: "var(--bg-surface)",
  },
  likesText: {
    margin: 0,
    fontWeight: "700",
    color: "var(--card-text)",
  },
  captionText: {
    margin: "6px 0",
    color: "var(--card-text)",
    lineHeight: 1.5,
  },
  commentsText: {
    margin: "6px 0 0 0",
    color: "var(--card-subtext)",
  },
  timeText: {
    margin: "8px 0 0 0",
    fontSize: "11px",
    color: "var(--card-subtext)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
};

export default PostCard;