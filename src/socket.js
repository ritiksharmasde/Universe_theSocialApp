import { io } from "socket.io-client";
import API_BASE_URL from "./";

const socket = io(API_BASE_URL, {
  autoConnect: false,
  auth: {
    token: localStorage.getItem("token"),
  },
});

export default socket;
