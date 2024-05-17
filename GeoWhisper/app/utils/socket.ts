import { io } from "socket.io-client";

// const url = "http://192.168.1.55:3000";
const url = "https://geowhisper-aplikacja-inzynierka.onrender.com";

export const socket = io(url, {
  transports: ["websocket"],
});

socket.on("connect_error", (err) => {
  console.log(err.message);
});
