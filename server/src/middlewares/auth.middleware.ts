import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import {
  ForbiddenError,
  UnauthorizedError,
} from "../utils/errors/app.error";
import { verifyToken } from "../utils/helpers/jwt";
import { getUserById } from "../services/auth.service";
import { authConfig } from "../config/auth.config";
import { AuthenticatedRequest } from "../types/auth.types";

const getTokenFromRequest = (req: Request): string | undefined => {
  const cookieToken = req.cookies?.[authConfig.cookieName];
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return undefined;
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return next(new UnauthorizedError("Authentication required"));
    }

    const payload = verifyToken(token);
    const user = await getUserById(payload.id);

    if (!user) {
      return next(new UnauthorizedError("User not found"));
    }

    (req as AuthenticatedRequest).authenticatedUser = user;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
};

export const isAuthenticated = authenticate;

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).authenticatedUser;

    if (!roles.includes(user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }

    next();
  };
