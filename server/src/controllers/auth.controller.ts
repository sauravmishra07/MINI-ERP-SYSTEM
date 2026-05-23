import { NextFunction, Request, Response } from "express";
import passport from "passport";
import { User } from "@prisma/client";
import { authConfig } from "../config/auth.config";
import { toPublicUser } from "../services/auth.service";
import { generateToken } from "../utils/helpers/jwt";
import { AuthenticatedRequest } from "../types/auth.types";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

const redirectWithError = (res: Response, message: string) => {
  const url = `${authConfig.frontendUrl}/login?error=${encodeURIComponent(message)}`;
  return res.redirect(url);
};

export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false,
});

export const googleCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "google",
    { session: false },
    (err: Error | null, user?: User) => {
      if (err) {
        return redirectWithError(res, err.message);
      }

      if (!user) {
        return redirectWithError(res, "Authentication failed");
      }

      const token = generateToken(user);
      res.cookie(authConfig.cookieName, token, cookieOptions);
      return res.redirect(authConfig.frontendUrl);
    }
  )(req, res, next);
};

export const getCurrentUser = (req: Request, res: Response) => {
  const { authenticatedUser } = req as AuthenticatedRequest;
  res.status(200).json({
    success: true,
    data: { user: toPublicUser(authenticatedUser) },
  });
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie(authConfig.cookieName, cookieOptions);
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
