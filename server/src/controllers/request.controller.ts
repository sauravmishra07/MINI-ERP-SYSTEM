import { NextFunction, Request, Response } from "express";
import { AuditAction, Status } from "@prisma/client";
import { Parser } from "json2csv";
import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../types/auth.types";
import {
  createRequestSchema,
  filterRequestSchema,
  reviewRequestSchema,
} from "../validators/request.validator";
import { buildRequestWhereClause } from "../utils/helpers/purchase-request.helpers";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/errors/app.error";

const getUser = (req: Request) =>
  (req as AuthenticatedRequest).authenticatedUser;

const writeAudit = async (
  requestId: string,
  performedById: string,
  action: AuditAction,
  oldStatus?: Status,
  newStatus?: Status,
  remarks?: string
) => {
  await prisma.auditLog.create({
    data: {
      requestId,
      performedById,
      action,
      oldStatus,
      newStatus,
      remarks,
    },
  });
};

const canAccessRequest = (
  user: AuthenticatedRequest["authenticatedUser"],
  createdById: string
) => user.role !== "EMPLOYEE" || user.id === createdById;

export const createRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getUser(req);
    const { requiredDate, ...rest } = createRequestSchema.parse(req.body);

    const request = await prisma.purchaseRequest.create({
      data: {
        ...rest,
        requiredDate: new Date(requiredDate),
        createdById: user.id,
      },
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    });

    await writeAudit(request.id, user.id, AuditAction.CREATED, undefined, Status.DRAFT);

    res.status(201).json({ success: true, data: { request } });
  } catch (error) {
    next(error);
  }
};

export const getAllRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getUser(req);
    const filters = filterRequestSchema.parse(req.query);
    const { page, limit } = filters;
    const where = buildRequestWhereClause(user, filters);

    const [requests, total] = await Promise.all([
      prisma.purchaseRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { name: true, email: true } },
        },
      }),
      prisma.purchaseRequest.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        requests,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getUser(req);
    const filters = filterRequestSchema.parse(req.query);
    const where = buildRequestWhereClause(user, filters);

    const requests = await prisma.purchaseRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    });

    const rows = requests.map((request) => ({
      id: request.id,
      itemName: request.itemName,
      quantity: request.quantity,
      unit: request.unit,
      department: request.department,
      requiredDate: request.requiredDate.toISOString(),
      priority: request.priority,
      status: request.status,
      reason: request.reason,
      createdByName: request.createdBy.name,
      createdByEmail: request.createdBy.email,
      createdAt: request.createdAt.toISOString(),
    }));

    const parser = new Parser({
      fields: [
        "id",
        "itemName",
        "quantity",
        "unit",
        "department",
        "requiredDate",
        "priority",
        "status",
        "reason",
        "createdByName",
        "createdByEmail",
        "createdAt",
      ],
    });

    const csv = parser.parse(rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="purchase_requests.csv"'
    );
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

export const getOneRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getUser(req);

    const request = await prisma.purchaseRequest.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { name: true, email: true, avatar: true } },
        auditLogs: {
          orderBy: { createdAt: "asc" },
          include: {
            performedBy: { select: { name: true } },
          },
        },
      },
    });

    if (!request) {
      return next(new NotFoundError("Purchase request not found"));
    }

    if (!canAccessRequest(user, request.createdById)) {
      return next(new ForbiddenError("You do not have access to this request"));
    }

    res.status(200).json({ success: true, data: { request } });
  } catch (error) {
    next(error);
  }
};

export const submitRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getUser(req);
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request) {
      return next(new NotFoundError("Purchase request not found"));
    }

    if (request.status !== Status.DRAFT) {
      return next(new BadRequestError("Only drafts can be submitted"));
    }

    if (request.createdById !== user.id) {
      return next(new ForbiddenError("Not your request"));
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id: req.params.id },
      data: { status: Status.SUBMITTED },
    });

    await writeAudit(
      request.id,
      user.id,
      AuditAction.SUBMITTED,
      Status.DRAFT,
      Status.SUBMITTED
    );

    res.status(200).json({ success: true, data: { request: updated } });
  } catch (error) {
    next(error);
  }
};

export const approveRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getUser(req);
    const { remarks } = reviewRequestSchema.parse(req.body);

    const request = await prisma.purchaseRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request) {
      return next(new NotFoundError("Purchase request not found"));
    }

    if (request.status !== Status.SUBMITTED) {
      return next(
        new BadRequestError("Only submitted requests can be approved")
      );
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id: req.params.id },
      data: { status: Status.APPROVED },
    });

    await writeAudit(
      request.id,
      user.id,
      AuditAction.APPROVED,
      Status.SUBMITTED,
      Status.APPROVED,
      remarks
    );

    res.status(200).json({ success: true, data: { request: updated } });
  } catch (error) {
    next(error);
  }
};

export const rejectRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getUser(req);
    const { remarks } = reviewRequestSchema.parse(req.body);

    const request = await prisma.purchaseRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request) {
      return next(new NotFoundError("Purchase request not found"));
    }

    if (request.status !== Status.SUBMITTED) {
      return next(
        new BadRequestError("Only submitted requests can be rejected")
      );
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id: req.params.id },
      data: { status: Status.REJECTED },
    });

    await writeAudit(
      request.id,
      user.id,
      AuditAction.REJECTED,
      Status.SUBMITTED,
      Status.REJECTED,
      remarks
    );

    res.status(200).json({ success: true, data: { request: updated } });
  } catch (error) {
    next(error);
  }
};
