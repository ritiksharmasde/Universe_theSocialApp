const dns = require("node:dns");
dns.setDefaultResultOrder("ipv4first");
console.log("✅ DNS result order set to ipv4first");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { initializeSocket } = require("./socket");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

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
