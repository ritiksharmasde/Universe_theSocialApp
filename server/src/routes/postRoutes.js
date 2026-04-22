const express = require("express");
const {
  getPosts,
  likePost,
  unlikePost,
  getComments,
  addComment,
} = require("../controllers/postController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/", requireAuth, getPosts);
router.post("/:postId/like", requireAuth, likePost);
router.delete("/:postId/like", requireAuth, unlikePost);
router.get("/:postId/comments", requireAuth, getComments);
router.post("/:postId/comments", requireAuth, addComment);

module.exports = router;
