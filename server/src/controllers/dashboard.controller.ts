import { NextFunction, Request, Response } from "express";
import { Role, Status } from "@prisma/client";
import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../types/auth.types";

const getUser = (req: Request) =>
  (req as AuthenticatedRequest).authenticatedUser;

export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getUser(req);
    const isManager =
      user.role === Role.MANAGER || user.role === Role.ADMIN;
    const where = isManager ? {} : { createdById: user.id };

    const [total, pending, approved, rejected] = await Promise.all([
      prisma.purchaseRequest.count({ where }),
      prisma.purchaseRequest.count({
        where: { ...where, status: Status.SUBMITTED },
      }),
      prisma.purchaseRequest.count({
        where: { ...where, status: Status.APPROVED },
      }),
      prisma.purchaseRequest.count({
        where: { ...where, status: Status.REJECTED },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: { total, pending, approved, rejected },
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getUser(req);
    const isManager =
      user.role === Role.MANAGER || user.role === Role.ADMIN;

    const logs = await prisma.auditLog.findMany({
      where: isManager
        ? undefined
        : { request: { createdById: user.id } },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        performedBy: { select: { name: true, avatar: true } },
        request: { select: { itemName: true } },
      },
    });

    res.status(200).json({ success: true, data: { logs } });
  } catch (error) {
    next(error);
  }
};
