const pool = require("../config/db");

const createPost = async (req, res) => {
  try {
    const {
      email,
      authorName,
      authorCourse,
      authorYear,
      authorProfileImageUrl,
      postType,
      caption,
    } = req.body;

    if (!email || !authorName || !postType || !caption) {
      return res.status(400).json({
        error: "Missing required post fields.",
      });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      `
      INSERT INTO posts (
        email,
        author_name,
        author_course,
        author_year,
        author_profile_image_url,
        post_type,
        caption,
        image_url,
        likes_count,
        comments_count
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,0)
      RETURNING *
      `,
      [
        email,
        authorName,
        authorCourse,
        authorYear,
        authorProfileImageUrl || null,
        postType,
        caption,
        imageUrl,
      ]
    );

    res.status(201).json({
      message: "Post created successfully",
      post: result.rows[0],
    });
  } catch (error) {
    console.error("createPost error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const currentUserEmail = (req.query.currentUserEmail || "").toLowerCase();
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 20);
const offset = parseInt(req.query.offset, 10) || 0;

    const result = await pool.query(
  `
  SELECT
    p.*,
    u.profile_image_url,
    EXISTS (
      SELECT 1
      FROM post_likes pl
      WHERE pl.post_id = p.id
        AND LOWER(pl.user_email) = LOWER($1)
    ) AS is_liked
  FROM posts p
  JOIN users u ON p.email = u.email
  ORDER BY p.created_at DESC
  LIMIT $2 OFFSET $3
  `,
  [currentUserEmail, limit, offset]
);

    res.status(200).json({
  posts: result.rows,
  limit,
  offset,
  hasMore: result.rows.length === limit,
});
  } catch (error) {
    console.error("getPosts error:", error);
    res.status(500).json({ error: error.message });
  }
};

const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: "userEmail is required." });
    }

    const normalizedEmail = userEmail.toLowerCase().trim();

    const postResult = await pool.query(
      `SELECT email FROM posts WHERE id = $1`,
      [postId]
    );

    if (!postResult.rows.length) {
      return res.status(404).json({ error: "Post not found" });
    }

    const postOwnerEmail = postResult.rows[0].email.toLowerCase();

    await pool.query(
      `
      INSERT INTO post_likes (post_id, user_email)
      VALUES ($1, $2)
      ON CONFLICT (post_id, user_email) DO NOTHING
      `,
      [postId, normalizedEmail]
    );

    await pool.query(
      `
      UPDATE posts
      SET likes_count = (
        SELECT COUNT(*)
        FROM post_likes
        WHERE post_id = $1
      )
      WHERE id = $1
      `,
      [postId]
    );

    if (postOwnerEmail !== normalizedEmail) {
      await pool.query(
        `
        INSERT INTO notifications (user_email, type, title, actor_email, entity_type, entity_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          postOwnerEmail,
          "like",
          `${normalizedEmail} liked your post`,
          normalizedEmail,
          "post",
          postId,
        ]
      );
    }

    const updatedPost = await pool.query(
      `
      SELECT p.*, TRUE AS is_liked
      FROM posts p
      WHERE p.id = $1
      `,
      [postId]
    );

    return res.status(200).json({
      message: "Post liked successfully",
      post: updatedPost.rows[0],
    });
  } catch (error) {
    console.error("likePost error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: "userEmail is required." });
    }

    await pool.query(
      `
      DELETE FROM post_likes
      WHERE post_id = $1
        AND LOWER(user_email) = LOWER($2)
      `,
      [postId, userEmail.toLowerCase()]
    );

    await pool.query(
      `
      UPDATE posts
      SET likes_count = (
        SELECT COUNT(*)
        FROM post_likes
        WHERE post_id = $1
      )
      WHERE id = $1
      `,
      [postId]
    );

    const updatedPost = await pool.query(
      `
      SELECT
        p.*,
        FALSE AS is_liked
      FROM posts p
      WHERE p.id = $1
      `,
      [postId]
    );

    res.status(200).json({
      message: "Post unliked successfully",
      post: updatedPost.rows[0],
    });
  } catch (error) {
    console.error("unlikePost error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM post_comments
      WHERE post_id = $1
      ORDER BY created_at ASC
      `,
      [postId]
    );

    res.status(200).json({
      comments: result.rows,
    });
  } catch (error) {
    console.error("getComments error:", error);
    res.status(500).json({ error: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userEmail, userName, userProfileImageUrl, commentText } = req.body;

    if (!userEmail || !commentText?.trim()) {
      return res.status(400).json({
        error: "userEmail and commentText are required.",
      });
    }

    const commentResult = await pool.query(
      `
      INSERT INTO post_comments (
        post_id,
        user_email,
        user_name,
        user_profile_image_url,
        comment_text
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        postId,
        userEmail.toLowerCase(),
        userName || "Student",
        userProfileImageUrl || null,
        commentText.trim(),
      ]
    );

    await pool.query(
      `
      UPDATE posts
      SET comments_count = (
        SELECT COUNT(*)
        FROM post_comments
        WHERE post_id = $1
      )
      WHERE id = $1
      `,
      [postId]
    );

    res.status(201).json({
      message: "Comment added successfully",
      comment: commentResult.rows[0],
    });
  } catch (error) {
    console.error("addComment error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPost,
  getPosts,
  likePost,
  unlikePost,
  getComments,
  addComment,
};
