import express from "express";
import {
  getCurrentUser,
  googleAuth,
  googleCallback,
  login,
  logout,
  register,
} from "../../controllers/auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const authRouter = express.Router();

// Email / password auth
authRouter.post("/register", register);
authRouter.post("/login", login);

// Google OAuth (kept for optional use)
authRouter.get("/google", googleAuth);
authRouter.get("/google/callback", googleCallback);

// Session
authRouter.get("/me", authenticate, getCurrentUser);
authRouter.post("/logout", authenticate, logout);

export default authRouter;
