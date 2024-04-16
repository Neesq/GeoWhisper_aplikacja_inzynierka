import { io } from "socket.io-client";

export const socket = io(
  "https://geowhisper-aplikacja-inzynierka.onrender.com",
  {
    transports: ["websocket"],
  }
);

socket.on("connect_error", (err) => {
  console.log(err.message);
});
