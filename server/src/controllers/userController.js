const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");
const moderateImage = require("../utils/moderateImage");
const streamifier = require("streamifier");

const saveProfile = async (req, res) => {
  try {
    const {
      email,
      fullName,
      username,
      course,
      year,
      section,
      bio,
      interests,
      skills,
      city,
      linkedin,
      github,
      profileImage,
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    await pool.query(
      `
      UPDATE users
      SET
        full_name = $1,
        username = $2,
        course = $3,
        year = $4,
        section = $5,
        bio = $6,
        interests = $7,
        skills = $8,
        city = $9,
        linkedin = $10,
        github = $11,
        profile_image_url = $12
      WHERE email = $13
      `,
      [
        fullName,
        username,
        course,
        year,
        section,
        bio,
        interests,
        skills,
        city,
        linkedin,
        github,
        profileImage,
        email,
      ]
    );

    res.status(200).json({
      message: "Profile saved successfully",
    });
  } catch (error) {
    console.error("saveProfile error:", error);
    res.status(500).json({ error: error.message });
  }
};

const uploadProfileImage = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const uploadStream = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "universe/profile",
            resource_type: "image",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

const moderation = await moderateImage(req.file);

if (!moderation.isSafe) {
  return res.status(400).json({
    error: "Profile image violates guidelines",
  });
}

const result = await uploadStream();
const imageUrl = result.secure_url;

    await pool.query(
      `
      UPDATE users
      SET profile_image_url = $1
      WHERE LOWER(email) = LOWER($2)
      `,
      [imageUrl, email]
    );

    res.status(200).json({
      message: "Profile image uploaded",
      imageUrl,
    });
  } catch (error) {
    console.error("uploadProfileImage error:", error);
    res.status(500).json({ error: error.message });
  }
};
const getMyProfile = async (req, res) => {
  try {
    const email = req.user.email.toLowerCase().trim();

    const result = await pool.query(
      `
      SELECT *
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error("getMyProfile error:", error);
    return res.status(500).json({ error: error.message });
  }
};
const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error("getUserByEmail error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getPublicUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const result = await pool.query(
      `
      SELECT email, full_name, username, profile_image_url, course, year, section, bio, interests, skills, city, linkedin, github
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error("getPublicUserByEmail error:", error);
    res.status(500).json({ error: error.message });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const { requesterEmail, recipientEmail } = req.body;

    if (!requesterEmail || !recipientEmail) {
      return res.status(400).json({
        error: "Both requesterEmail and recipientEmail are required.",
      });
    }

    const requester = requesterEmail.toLowerCase().trim();
    const recipient = recipientEmail.toLowerCase().trim();

    if (requester === recipient) {
      return res.status(400).json({
        error: "You cannot send a friend request to yourself.",
      });
    }

    const existing = await pool.query(
      `
      SELECT *
      FROM friendships
      WHERE
        (LOWER(requester_email) = LOWER($1) AND LOWER(recipient_email) = LOWER($2))
        OR
        (LOWER(requester_email) = LOWER($2) AND LOWER(recipient_email) = LOWER($1))
      LIMIT 1
      `,
      [requester, recipient]
    );

    if (existing.rows.length > 0) {
      const friendship = existing.rows[0];

      if (friendship.status === "accepted") {
        return res.status(200).json({
          message: "Users are already friends.",
          status: "friends",
        });
      }

      if (
        friendship.status === "pending" &&
        friendship.requester_email.toLowerCase() === requester
      ) {
        return res.status(200).json({
          message: "Friend request already sent.",
          status: "sent",
        });
      }

      if (
        friendship.status === "pending" &&
        friendship.requester_email.toLowerCase() === recipient
      ) {
        return res.status(200).json({
          message: "This user has already sent you a friend request.",
          status: "received",
        });
      }
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `
        INSERT INTO friendships (requester_email, recipient_email, status)
        VALUES ($1, $2, 'pending')
        `,
        [requester, recipient]
      );

      await client.query(
        `
        INSERT INTO notifications (user_email, type, title, actor_email, entity_type)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          recipient,
          "friend_request",
          `${requester} sent you a friend request`,
          requester,
          "friend_request",
        ]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        message: "Friend request sent successfully.",
        status: "sent",
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Transaction error:", err);
      return res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("sendFriendRequest error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const getRandomSuggestions = async (req, res) => {
  const { currentUserEmail, limit = 10 } = req.query;

  try {
    const result = await pool.query(
      `
      SELECT id, email, full_name, username, course, year, profile_image_url
      FROM users
      WHERE LOWER(email) <> LOWER($1)
      ORDER BY RANDOM()
      LIMIT $2
      `,
      [currentUserEmail, Number(limit)]
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error("random suggestions error:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const currentUserEmail = (req.query.currentUserEmail || "").toLowerCase().trim();

    const result = await pool.query(
      `
      SELECT
        email,
        full_name,
        username,
        course,
        year,
        section,
        profile_image_url
      FROM users
      WHERE ($1 = '' OR LOWER(email) <> LOWER($1))
      ORDER BY
        COALESCE(username, '') ASC,
        COALESCE(full_name, '') ASC,
        email ASC
      `,
      [currentUserEmail]
    );

    res.status(200).json({
      users: result.rows,
    });
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getFriendStatus = async (req, res) => {
  try {
    const { currentUserEmail, otherUserEmail } = req.query;

    if (!currentUserEmail || !otherUserEmail) {
      return res.status(400).json({
        error: "currentUserEmail and otherUserEmail are required.",
      });
    }

    const current = currentUserEmail.toLowerCase().trim();
    const other = otherUserEmail.toLowerCase().trim();

    if (current === other) {
      return res.status(200).json({
        status: "self",
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM friendships
      WHERE
        (LOWER(requester_email) = LOWER($1) AND LOWER(recipient_email) = LOWER($2))
        OR
        (LOWER(requester_email) = LOWER($2) AND LOWER(recipient_email) = LOWER($1))
      LIMIT 1
      `,
      [current, other]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        status: "none",
      });
    }

    const friendship = result.rows[0];

    if (friendship.status === "accepted") {
      return res.status(200).json({
        status: "friends",
      });
    }

    if (
      friendship.status === "pending" &&
      friendship.requester_email.toLowerCase() === current
    ) {
      return res.status(200).json({
        status: "sent",
      });
    }

    if (
      friendship.status === "pending" &&
      friendship.recipient_email.toLowerCase() === current
    ) {
      return res.status(200).json({
        status: "received",
      });
    }

    res.status(200).json({
      status: "none",
    });
  } catch (error) {
    console.error("getFriendStatus error:", error);
    res.status(500).json({ error: error.message });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const { currentUserEmail, otherUserEmail } = req.body;

    if (!currentUserEmail || !otherUserEmail) {
      return res.status(400).json({
        error: "currentUserEmail and otherUserEmail are required.",
      });
    }

    const current = currentUserEmail.toLowerCase().trim();
    const other = otherUserEmail.toLowerCase().trim();

    const result = await pool.query(
      `
      UPDATE friendships
      SET status = 'accepted',
          updated_at = CURRENT_TIMESTAMP
      WHERE LOWER(requester_email) = LOWER($1)
        AND LOWER(recipient_email) = LOWER($2)
        AND status = 'pending'
      RETURNING *
      `,
      [other, current]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Friend request not found.",
      });
    }

    res.status(200).json({
      message: "Friend request accepted.",
      status: "friends",
    });
  } catch (error) {
    console.error("acceptFriendRequest error:", error);
    res.status(500).json({ error: error.message });
  }
};

const rejectFriendRequest = async (req, res) => {
  try {
    const { currentUserEmail, otherUserEmail } = req.body;

    if (!currentUserEmail || !otherUserEmail) {
      return res.status(400).json({
        error: "currentUserEmail and otherUserEmail are required.",
      });
    }

    const current = currentUserEmail.toLowerCase().trim();
    const other = otherUserEmail.toLowerCase().trim();

    const result = await pool.query(
      `
      DELETE FROM friendships
      WHERE LOWER(requester_email) = LOWER($1)
        AND LOWER(recipient_email) = LOWER($2)
        AND status = 'pending'
      RETURNING *
      `,
      [other, current]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Friend request not found.",
      });
    }

    res.status(200).json({
      message: "Friend request rejected.",
      status: "none",
    });
  } catch (error) {
    console.error("rejectFriendRequest error:", error);
    res.status(500).json({ error: error.message });
  }
};

const blockUser = async (req, res) => {
  try {
    const { blockerEmail, blockedEmail } = req.body;

    if (!blockerEmail || !blockedEmail) {
      return res.status(400).json({
        error: "blockerEmail and blockedEmail are required.",
      });
    }

    const blocker = blockerEmail.toLowerCase().trim();
    const blocked = blockedEmail.toLowerCase().trim();

    if (blocker === blocked) {
      return res.status(400).json({
        error: "You cannot block yourself.",
      });
    }

    await pool.query(
      `
      INSERT INTO blocked_users (blocker_email, blocked_email)
      VALUES ($1, $2)
      ON CONFLICT (blocker_email, blocked_email) DO NOTHING
      `,
      [blocker, blocked]
    );

    await pool.query(
      `
      DELETE FROM friendships
      WHERE
        (LOWER(requester_email) = LOWER($1) AND LOWER(recipient_email) = LOWER($2))
        OR
        (LOWER(requester_email) = LOWER($2) AND LOWER(recipient_email) = LOWER($1))
      `,
      [blocker, blocked]
    );

    res.status(200).json({
      message: "User blocked successfully.",
      status: "blocked",
    });
  } catch (error) {
    console.error("blockUser error:", error);
    res.status(500).json({ error: error.message });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { blockerEmail, blockedEmail } = req.body;

    if (!blockerEmail || !blockedEmail) {
      return res.status(400).json({
        error: "blockerEmail and blockedEmail are required.",
      });
    }

    const blocker = blockerEmail.toLowerCase().trim();
    const blocked = blockedEmail.toLowerCase().trim();

    const result = await pool.query(
      `
      DELETE FROM blocked_users
      WHERE LOWER(blocker_email) = LOWER($1)
        AND LOWER(blocked_email) = LOWER($2)
      RETURNING *
      `,
      [blocker, blocked]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User is not blocked.",
      });
    }

    res.status(200).json({
      message: "User unblocked successfully.",
      status: "unblocked",
    });
  } catch (error) {
    console.error("unblockUser error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getBlockStatus = async (req, res) => {
  try {
    const { currentUserEmail, otherUserEmail } = req.query;

    if (!currentUserEmail || !otherUserEmail) {
      return res.status(400).json({
        error: "currentUserEmail and otherUserEmail are required.",
      });
    }

    const current = currentUserEmail.toLowerCase().trim();
    const other = otherUserEmail.toLowerCase().trim();

    const result = await pool.query(
      `
      SELECT *
      FROM blocked_users
      WHERE LOWER(blocker_email) = LOWER($1)
        AND LOWER(blocked_email) = LOWER($2)
      LIMIT 1
      `,
      [current, other]
    );

    res.status(200).json({
      isBlocked: result.rows.length > 0,
    });
  } catch (error) {
    console.error("getBlockStatus error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  saveProfile,
  uploadProfileImage,
  getUserByEmail,
  getPublicUserByEmail,
  sendFriendRequest,
  getMyProfile,
  getFriendStatus,
  acceptFriendRequest,
  rejectFriendRequest,
  blockUser,
  getBlockStatus,
  unblockUser,
  getAllUsers,
  getRandomSuggestions,
};
