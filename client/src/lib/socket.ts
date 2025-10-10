import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (_socket) return _socket;
  _socket = io("/", {
    path: "/socket.io",
    transports: ["websocket"],
    auth: { token },
    forceNew: true,
  });
  return _socket;
}
