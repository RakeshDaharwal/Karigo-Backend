import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/db.conn";
import { Role } from "../generated/prisma/enums";

const createError = (message: string, statusCode: number) => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
};

const decodeAuthToken = (authorizationHeader?: string) => {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    throw createError("Authorization token is required", 401);
  }

  const token = authorizationHeader.slice(7).trim();

  if (!token) {
    throw createError("Authorization token is required", 401);
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
      throw createError("User not found", 401);
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
      return next(createError("Invalid or expired token", 401));
    }

    next(error);
  }
};


export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as Request & { user?: { userId: number; role: Role } }).user;

  if (!user) {
    return next(createError("Unauthorized", 401));
  }

  if (user.role !== Role.SUPER_ADMIN) {
    return next(createError("Access denied. Super admin only", 403));
  }

  next();
};