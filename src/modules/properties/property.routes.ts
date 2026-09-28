import { Router } from "express";

import {
  createProperty,
  deleteProperty,
  getProperties,
  getProperty,
  togglePropertyStatus,
  updateProperty,
} from "./property.controller.js";

import { asyncHandler } from "../../middlewares/async-handler.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireCompany } from "../../middlewares/company.middleware.js";

const router = Router();

router.use(authenticate);
router.use(requireCompany);

router.get("/", asyncHandler(getProperties));

router.post("/", asyncHandler(createProperty));

router.get("/:id", asyncHandler(getProperty));

router.patch("/:id", asyncHandler(updateProperty));

router.patch("/:id/status", asyncHandler(togglePropertyStatus));

router.delete("/:id", asyncHandler(deleteProperty));

export default router;
