import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireCompany } from "../../middlewares/company.middleware.js";

import {
  getSystemRolesController,
} from "./roles.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requireCompany,
  getSystemRolesController,
);

export default router;