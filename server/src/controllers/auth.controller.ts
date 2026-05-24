import { NextFunction, Request, Response } from "express";
import passport from "passport";
import { Role, User } from "@prisma/client";
import { authConfig } from "../config/auth.config";
import { toPublicUser, registerUser, loginUser } from "../services/auth.service";
import { generateToken } from "../utils/helpers/jwt";
import { AuthenticatedRequest } from "../types/auth.types";
import { registerSchema, loginSchema } from "../validators/auth.validator";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,                          // must be true for sameSite: "none"
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

const setTokenCookie = (res: Response, user: User) => {
  const token = generateToken(user);
  res.cookie(authConfig.cookieName, token, cookieOptions);
  return token;
};

const redirectWithError = (res: Response, message: string) => {
  const url = `${authConfig.frontendUrl}/login?error=${encodeURIComponent(message)}`;
  return res.redirect(url);
};

// ─── Google OAuth ────────────────────────────────────────────────────────────

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
      if (err) return redirectWithError(res, err.message);
      if (!user) return redirectWithError(res, "Authentication failed");

      setTokenCookie(res, user);
      return res.redirect(authConfig.frontendUrl);
    }
  )(req, res, next);
};

// ─── Email / Password ────────────────────────────────────────────────────────

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, role } = registerSchema.parse(req.body);
    const user = await registerUser(name, email, password, role as Role);
    setTokenCookie(res, user);
    res.status(201).json({
      success: true,
      data: { user: toPublicUser(user) },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, role } = loginSchema.parse(req.body);
    const user = await loginUser(email, password, role as Role);
    setTokenCookie(res, user);
    res.status(200).json({
      success: true,
      data: { user: toPublicUser(user) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Shared ──────────────────────────────────────────────────────────────────

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
