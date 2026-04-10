const express = require("express");
const {
  getPosts,
  likePost,
  unlikePost,
  getComments,
  addComment,
} = require("../controllers/postController");

const router = express.Router();

router.get("/", getPosts);
router.post("/:postId/like", likePost);
router.delete("/:postId/like", unlikePost);
router.get("/:postId/comments", getComments);
router.post("/:postId/comments", addComment);

module.exports = router;