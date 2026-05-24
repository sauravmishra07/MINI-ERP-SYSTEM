import { z } from "zod";

export const createRequestSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  department: z.string().min(1, "Department is required"),
  requiredDate: z.string().datetime("requiredDate must be an ISO 8601 datetime"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export const filterRequestSchema = z.object({
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
  department: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const reviewRequestSchema = z.object({
  remarks: z.string().optional(),
});

export const requestIdParamSchema = z.object({
  id: z.string().uuid("Invalid request id"),
});
