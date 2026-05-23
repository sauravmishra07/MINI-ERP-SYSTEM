import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { authConfig } from "../../config/auth.config";

export type TokenPayload = {
  id: string;
  email: string;
  role: string;
};

export const generateToken = (user: User): string => {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.tokenExpiresIn,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, authConfig.jwtSecret) as TokenPayload;
};
