import { Prisma, Role, User } from "@prisma/client";
import { z } from "zod";
import { filterRequestSchema } from "../../validators/request.validator";

export type FilterRequestInput = z.infer<typeof filterRequestSchema>;

export const buildRequestWhereClause = (
  user: User,
  filters: FilterRequestInput
): Prisma.PurchaseRequestWhereInput => {
  const { status, department, priority, from, to } = filters;
  const where: Prisma.PurchaseRequestWhereInput = {};

  if (user.role === Role.EMPLOYEE) {
    where.createdById = user.id;
  }

  if (status) {
    where.status = status;
  }

  if (department) {
    where.department = { contains: department, mode: "insensitive" };
  }

  if (priority) {
    where.priority = priority;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) {
      where.createdAt.gte = new Date(from);
    }
    if (to) {
      where.createdAt.lte = new Date(to);
    }
  }

  return where;
};
