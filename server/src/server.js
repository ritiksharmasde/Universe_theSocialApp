const dns = require("node:dns");
dns.setDefaultResultOrder("ipv4first");
console.log("✅ DNS result order set to ipv4first");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { initializeSocket } = require("./socket");
const pool = require("./config/db");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
app.get("/ping", (req, res) => {
  res.send("OK");
});
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      ok: true,
      backend: "awake",
      database: "connected",
      time: new Date(),
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

const allowedOrigins = [
  "http://localhost:3000",
  "https://joinuniverse.co.in",
  "https://www.joinuniverse.co.in",
  process.env.CLIENT_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initializeSocket(io);
app.set("io", io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
