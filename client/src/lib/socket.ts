import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (_socket) return _socket;
  _socket = io("/", {
    path: "/socket.io",
    transports: ["websocket"],
    auth: { token },
    forceNew: true,
    reconnection: true,
  });
  return _socket;
}

export function getSocket(): Socket | null {
  return _socket;
}

export function disconnectSocket() {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}

