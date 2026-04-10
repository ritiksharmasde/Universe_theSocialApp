require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { initializeSocket } = require("./socket");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  },
});

initializeSocket(io);
app.set("io", io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});