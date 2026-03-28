import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/db.conn";
import { Role } from "../generated/prisma/enums";

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
  ) as jwt.JwtPayload & { userId: number; role: Role };
};

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const decoded = decodeAuthToken(req.headers.authorization);

    //  DB user check
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      const error = new Error("User not found") as Error & { statusCode: number };
      error.statusCode = 401;
      throw error;
    }

    (req as Request & { user?: { userId: number; role: Role } }).user = {
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


export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const decoded = decodeAuthToken(req.headers.authorization);

    if (decoded.role !== Role.SUPER_ADMIN) {
      const error = new Error("Access denied. Super admin only") as Error & {
        statusCode: number;
      };
      error.statusCode = 403;
      return next(error);
    }

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