import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";

import {
  createPlanController,
  createPlanFeatureController,
  deletePlanController,
  deletePlanFeatureController,
  getPlanController,
  getPlanFeatureController,
  getPlanFeaturesController,
  getPlansController,
  updatePlanController,
  updatePlanFeatureController,
  updatePlanStatusController,
} from "./plan.controller.js";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                              AUTHENTICATION                                */
/* -------------------------------------------------------------------------- */

router.use(authenticate);

/* -------------------------------------------------------------------------- */
/*                                  PLANS                                     */
/* -------------------------------------------------------------------------- */

// GET /api/v1/plans
router.get("/", getPlansController);

// GET /api/v1/plans/:planId
router.get("/:planId", getPlanController);

// POST /api/v1/plans
router.post("/", createPlanController);

// PATCH /api/v1/plans/:planId
router.patch("/:planId", updatePlanController);

// PATCH /api/v1/plans/:planId/status
router.patch("/:planId/status", updatePlanStatusController);

// DELETE /api/v1/plans/:planId
router.delete("/:planId", deletePlanController);

/* -------------------------------------------------------------------------- */
/*                             PLAN FEATURES                                  */
/* -------------------------------------------------------------------------- */

// GET /api/v1/plans/:planId/features
router.get("/:planId/features", getPlanFeaturesController);

// GET /api/v1/plans/:planId/features/:featureId
router.get("/:planId/features/:featureId", getPlanFeatureController);

// POST /api/v1/plans/:planId/features
router.post("/:planId/features", createPlanFeatureController);

// PATCH /api/v1/plans/:planId/features/:featureId
router.patch("/:planId/features/:featureId", updatePlanFeatureController);

// DELETE /api/v1/plans/:planId/features/:featureId
router.delete("/:planId/features/:featureId", deletePlanFeatureController);

export default router;
