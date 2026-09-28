import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireCompany } from "../../middlewares/company.middleware.js";

import {
  createScheduleController,
  deleteScheduleController,
  getScheduleController,
  listSchedulesController,
  reassignScheduleTechnicianController,
  rescheduleScheduleController,
  updateScheduleController,
  updateScheduleStatusController,
} from "./schedule.controller.js";

const router = Router();

// Authentication + Company context
router.use(authenticate);
router.use(requireCompany);

// List / Create
router.get("/", listSchedulesController);
router.post("/", createScheduleController);

// Specific actions
router.patch(
  "/:id/status",
  updateScheduleStatusController,
);

router.patch(
  "/:id/reschedule",
  rescheduleScheduleController,
);

router.patch(
  "/:id/technician",
  reassignScheduleTechnicianController,
);

// Generic operations
router.get(
  "/:id",
  getScheduleController,
);

router.patch(
  "/:id",
  updateScheduleController,
);

router.delete(
  "/:id",
  deleteScheduleController,
);

export default router;