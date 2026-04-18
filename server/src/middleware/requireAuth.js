const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

module.exports = requireAuth;
