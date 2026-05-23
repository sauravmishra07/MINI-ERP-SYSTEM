import express from "express";
import {
  getCurrentUser,
  googleAuth,
  googleCallback,
  logout,
} from "../../controllers/auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const authRouter = express.Router();

authRouter.get("/google", googleAuth);
authRouter.get("/google/callback", googleCallback);
authRouter.get("/me", authenticate, getCurrentUser);
authRouter.post("/logout", authenticate, logout);

export default authRouter;
