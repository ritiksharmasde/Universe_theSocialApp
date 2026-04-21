import { io } from "socket.io-client";
import { SERVER_BASE_URL } from "./api";

const socket = io(SERVER_BASE_URL, {
  autoConnect: false,
  auth: {
    token: localStorage.getItem("token"),
  },
  transports: ["websocket", "polling"],
});

export default socket;
