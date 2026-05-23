import { Request } from "express";
import type { User } from "@prisma/client";

export type AuthenticatedRequest = Request & {
  authenticatedUser: User;
};
