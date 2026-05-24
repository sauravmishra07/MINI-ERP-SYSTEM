import bcrypt from "bcryptjs";
import { Role, User } from "@prisma/client";
import { Profile } from "passport-google-oauth20";
import prisma from "../lib/prisma";
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
} from "../utils/errors/app.error";
import { authConfig } from "../config/auth.config";

// ─── Google OAuth ────────────────────────────────────────────────────────────

export const findOrCreateUser = async (profile: Profile): Promise<User> => {
  const email = profile.emails?.[0]?.value;
  if (!email) throw new Error("Email not provided by Google");

  const name = profile.displayName || email.split("@")[0];
  const avatar = profile.photos?.[0]?.value ?? null;

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (avatar && (existing.avatar !== avatar || existing.name !== name)) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { avatar, name },
      });
    }
    return existing;
  }

  return prisma.user.create({ data: { email, name, avatar } });
};

// ─── Email / Password ────────────────────────────────────────────────────────

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: Role
): Promise<User> => {
  if (!email.endsWith(authConfig.allowedEmailDomain)) {
    throw new ForbiddenError(
      `Only ${authConfig.allowedEmailDomain} accounts are allowed`
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const hashed = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: { name, email, password: hashed, role },
  });
};

export const loginUser = async (
  email: string,
  password: string,
  role: Role
): Promise<User> => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Validate that the role the user selected matches their actual role in DB
  if (user.role !== role) {
    throw new ForbiddenError(
      `Your account role is ${user.role}. You cannot sign in as ${role}.`
    );
  }

  return user;
};

// ─── Shared ──────────────────────────────────────────────────────────────────

export const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { id } });
};

export const toPublicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatar: user.avatar,
  role: user.role,
  createdAt: user.createdAt,
});
