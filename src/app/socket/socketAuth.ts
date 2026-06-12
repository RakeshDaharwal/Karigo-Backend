import { type Socket } from "socket.io";
import { type ExtendedError } from "socket.io";
import jwt from "jsonwebtoken";

import { Role } from "../../generated/prisma/enums";

export type AuthedSocketData = {
  userId: string;
  role: Role;
};

// Socket.IO handshake authentication. The client must send the same JWT it uses
// for REST via `auth: { token }`. We never trust a client-supplied senderId.
export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: ExtendedError) => void
) => {
  try {
    const raw =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.headers.authorization as string | undefined);

    if (!raw) return next(new Error("unauthorized"));

    const token = raw.startsWith("Bearer ") ? raw.slice(7).trim() : raw.trim();
    if (!token) return next(new Error("unauthorized"));

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as jwt.JwtPayload & { userId?: string | number; role?: Role };

    if (decoded.userId === undefined || decoded.userId === null || decoded.userId === "") {
      return next(new Error("unauthorized"));
    }

    socket.data.userId = String(decoded.userId);
    socket.data.role = (decoded.role as Role) ?? Role.USER;
    next();
  } catch {
    next(new Error("unauthorized"));
  }
};
