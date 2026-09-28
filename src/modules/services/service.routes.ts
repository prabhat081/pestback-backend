import { Router } from "express";

import {
  createService,
  deleteService,
  getService,
  getServices,
  toggleServiceStatus,
  updateService,
} from "./service.controller.js";

import { asyncHandler } from "../../middlewares/async-handler.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireCompany } from "../../middlewares/company.middleware.js";

const router = Router();

router.use(authenticate);
router.use(requireCompany);

router.get("/", asyncHandler(getServices));

router.post("/", asyncHandler(createService));

router.get("/:id", asyncHandler(getService));

router.patch("/:id", asyncHandler(updateService));

router.patch("/:id/status", asyncHandler(toggleServiceStatus));

router.delete("/:id", asyncHandler(deleteService));

export default router;
