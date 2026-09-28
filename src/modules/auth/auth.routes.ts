import { Router } from "express";

import {
  login,
  refresh,
  register,
  resendVerification,
  verifyEmailController,
  logout,
  me,
} from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);

router.post("/verify-email", verifyEmailController);

router.post("/resend-verification", resendVerification);

router.post("/login", login);

router.post("/refresh", refresh);

router.post("/logout", logout);

router.get("/me", authenticate, me);
export default router;
