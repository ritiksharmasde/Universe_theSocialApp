import { io } from "socket.io-client";
import API_BASE_URL, { SERVER_BASE_URL } from "./api";

const socket = io(SERVER_BASE_URL, {
  autoConnect: true,
});

export default socket;