import { io, Socket } from "socket.io-client";

export function connectSocket(token: string): Socket {
  const base = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
  
  return io(base, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: { token }
  });
}
