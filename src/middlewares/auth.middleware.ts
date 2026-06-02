import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/db.conn";
import { Role } from "../generated/prisma/enums";
import { countApprovedBusinessesByUserId } from "../repositories/business.repository";

const decodeAuthToken = (authorizationHeader?: string) => {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    const error = new Error("Authorization token is required") as Error & {
      statusCode: number;
    };
    error.statusCode = 401;
    throw error;
  }

  const token = authorizationHeader.slice(7).trim();

  if (!token) {
    const error = new Error("Authorization token is required") as Error & {
      statusCode: number;
    };
    error.statusCode = 401;
    throw error;
  }

  return jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET as string
  ) as jwt.JwtPayload & { userId: string | number; role: Role };
};

const userIdFromDecoded = (
  decoded: jwt.JwtPayload & { userId?: string | number; role: Role }
) => {
  const raw = decoded.userId;
  if (raw === undefined || raw === null || raw === "") {
    const error = new Error("Invalid token payload") as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }
  return String(raw);
};

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const decoded = decodeAuthToken(req.headers.authorization);
    const userId = userIdFromDecoded(decoded);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error = new Error("User not found") as Error & { statusCode: number };
      error.statusCode = 401;
      throw error;
    }

    (req as Request & { user?: { userId: string; role: Role } }).user = {
      userId: user.id,
      role: user.role,
    };

    next();
  } catch (error: any) {
    if (
      error?.name === "TokenExpiredError" ||
      error?.name === "JsonWebTokenError"
    ) {
      const authError = new Error("Invalid or expired token") as Error & {
        statusCode: number;
      };
      authError.statusCode = 401;
      return next(authError);
    }

    next(error);
  }
};


export const requireSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const decoded = decodeAuthToken(req.headers.authorization);
    const userId = userIdFromDecoded(decoded);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error = new Error("User not found") as Error & { statusCode: number };
      error.statusCode = 401;
      throw error;
    }

    if (user.role !== Role.SUPER_ADMIN) {
      const error = new Error("Access denied. Super admin only") as Error & {
        statusCode: number;
      };
      error.statusCode = 403;
      return next(error);
    }

    (req as Request & { user?: { userId: string; role: Role } }).user = {
      userId: user.id,
      role: user.role,
    };

    next();
  } catch (error: any) {
    if (
      error?.name === "TokenExpiredError" ||
      error?.name === "JsonWebTokenError"
    ) {
      const authError = new Error("Invalid or expired token") as Error & {
        statusCode: number;
      };
      authError.statusCode = 401;
      return next(authError);
    }

    next(error);
  }
};

// Authorizes a request as a business owner: valid token + at least one
// APPROVED business owned by the user. Used by /web business endpoints.
export const requireBusinessUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const decoded = decodeAuthToken(req.headers.authorization);
    const userId = userIdFromDecoded(decoded);

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      const error = new Error("User not found") as Error & {
        statusCode: number;
      };
      error.statusCode = 401;
      throw error;
    }

    const approvedCount = await countApprovedBusinessesByUserId(user.id);
    if (approvedCount === 0) {
      const error = new Error(
        "Business not registered or not approved"
      ) as Error & { statusCode: number };
      error.statusCode = 403;
      return next(error);
    }

    (req as Request & { user?: { userId: string; role: Role } }).user = {
      userId: user.id,
      role: user.role,
    };

    next();
  } catch (error: any) {
    if (
      error?.name === "TokenExpiredError" ||
      error?.name === "JsonWebTokenError"
    ) {
      const authError = new Error("Invalid or expired token") as Error & {
        statusCode: number;
      };
      authError.statusCode = 401;
      return next(authError);
    }

    next(error);
  }
};