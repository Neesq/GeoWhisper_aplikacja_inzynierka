import { io } from "socket.io-client";

export const socket = io("http://192.168.1.55:3001", {
  transports: ["websocket"],
});

socket.on("connect_error", (err) => {
  console.log(err.message);
});
