import express from "express";
import {
  approveRequest,
  createRequest,
  exportRequests,
  getAllRequests,
  getOneRequest,
  rejectRequest,
  submitRequest,
} from "../../controllers/request.controller";
import {
  isAuthenticated,
  requireRole,
} from "../../middlewares/auth.middleware";
import { validateRequestBody } from "../../validators";
import { validateQueryParams } from "../../validators";
import {
  createRequestSchema,
  filterRequestSchema,
} from "../../validators/request.validator";
import { Role } from "@prisma/client";

const requestRouter = express.Router();

requestRouter.use(isAuthenticated);

requestRouter.post("/", validateRequestBody(createRequestSchema), createRequest);
requestRouter.get(
  "/export",
  validateQueryParams(filterRequestSchema),
  exportRequests
);
requestRouter.get("/", validateQueryParams(filterRequestSchema), getAllRequests);
requestRouter.get("/:id", getOneRequest);
requestRouter.patch("/:id/submit", submitRequest);
requestRouter.patch(
  "/:id/approve",
  requireRole(Role.MANAGER, Role.ADMIN),
  approveRequest
);
requestRouter.patch(
  "/:id/reject",
  requireRole(Role.MANAGER, Role.ADMIN),
  rejectRequest
);

export default requestRouter;
