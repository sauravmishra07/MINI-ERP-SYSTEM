import { User } from "@prisma/client";
import { Profile } from "passport-google-oauth20";
import prisma from "../lib/prisma";

export const findOrCreateUser = async (profile: Profile): Promise<User> => {
  const email = profile.emails?.[0]?.value;
  if (!email) {
    throw new Error("Email not provided by Google");
  }

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

  return prisma.user.create({
    data: { email, name, avatar },
  });
};

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
