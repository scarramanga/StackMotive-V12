import { io, Socket } from "socket.io-client";

function resolveApiBase(): string {
  const envBase = import.meta.env.VITE_API_BASE as string | undefined;
  if (envBase && envBase.trim().length) return envBase;
  return "http://backend:8000";
}

export function connectSocket(token: string): Socket {
  const base = resolveApiBase();
  return io(base, {
    path: "/socket.io",
    transports: ["websocket"],
    auth: { token },
  });
}
