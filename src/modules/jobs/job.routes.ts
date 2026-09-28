import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireCompany } from "../../middlewares/company.middleware.js";

import {
  listJobsController,
  createJobController,
  getJobController,
  updateJobController,
  updateJobStatusController,
  assignTechnicianController,
  completeJobController,
  cancelJobController,
  deleteJobController,
} from "./job.controller.js";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                              AUTHENTICATION                                */
/* -------------------------------------------------------------------------- */

router.use(authenticate);
router.use(requireCompany);

/* -------------------------------------------------------------------------- */
/*                                    LIST                                    */
/* -------------------------------------------------------------------------- */

router.get(
  "/",
  listJobsController,
);

/* -------------------------------------------------------------------------- */
/*                                   CREATE                                   */
/* -------------------------------------------------------------------------- */

router.post(
  "/",
  createJobController,
);

/* -------------------------------------------------------------------------- */
/*                                  GET ONE                                   */
/* -------------------------------------------------------------------------- */

router.get(
  "/:id",
  getJobController,
);

/* -------------------------------------------------------------------------- */
/*                                  UPDATE                                    */
/* -------------------------------------------------------------------------- */

router.patch(
  "/:id",
  updateJobController,
);

/* -------------------------------------------------------------------------- */
/*                              UPDATE STATUS                                 */
/* -------------------------------------------------------------------------- */

router.patch(
  "/:id/status",
  updateJobStatusController,
);

/* -------------------------------------------------------------------------- */
/*                           ASSIGN TECHNICIAN                                */
/* -------------------------------------------------------------------------- */

router.patch(
  "/:id/assign-technician",
  assignTechnicianController,
);

/* -------------------------------------------------------------------------- */
/*                                COMPLETE                                    */
/* -------------------------------------------------------------------------- */

router.patch(
  "/:id/complete",
  completeJobController,
);

/* -------------------------------------------------------------------------- */
/*                                  CANCEL                                    */
/* -------------------------------------------------------------------------- */

router.patch(
  "/:id/cancel",
  cancelJobController,
);

/* -------------------------------------------------------------------------- */
/*                                  DELETE                                    */
/* -------------------------------------------------------------------------- */

router.delete(
  "/:id",
  deleteJobController,
);

export default router;