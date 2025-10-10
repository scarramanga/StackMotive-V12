import { io, Socket } from "socket.io-client";

export function connectSocket(token: string): Socket {
  return io("/", {
    path: "/socket.io",
    transports: ["websocket"],
    auth: { token },
  });
}
