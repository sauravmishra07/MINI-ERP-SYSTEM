import express from "express";
import {
  getRecentActivity,
  getStats,
} from "../../controllers/dashboard.controller";
import { isAuthenticated } from "../../middlewares/auth.middleware";

const dashboardRouter = express.Router();

dashboardRouter.use(isAuthenticated);
dashboardRouter.get("/stats", getStats);
dashboardRouter.get("/activity", getRecentActivity);

export default dashboardRouter;
