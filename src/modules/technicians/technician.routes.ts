import { Router } from "express";

import { asyncHandler } from "../../middlewares/async-handler.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireCompany } from "../../middlewares/company.middleware.js";

import {
  createTechnicianController,
  deleteTechnicianController,
  getTechnicianController,
  getTechnicianList,
  getTechnicianServicesController,
  updateTechnicianController,
  updateTechnicianServicesController,
  updateTechnicianStatusController,
} from "./technician.controller.js";

const router = Router();

/**
 * Authentication + company context
 */
router.use(authenticate);
router.use(requireCompany);

/**
 * Technician CRUD
 */
router.get("/", asyncHandler(getTechnicianList));

router.post("/", asyncHandler(createTechnicianController));

router.get("/:id", asyncHandler(getTechnicianController));

router.patch("/:id", asyncHandler(updateTechnicianController));

router.patch("/:id/status", asyncHandler(updateTechnicianStatusController));

router.delete("/:id", asyncHandler(deleteTechnicianController));

/**
 * Technician services
 */
router.get("/:id/services", asyncHandler(getTechnicianServicesController));

router.put("/:id/services", asyncHandler(updateTechnicianServicesController));

export default router;
