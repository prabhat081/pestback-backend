import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireCompany } from "../../middlewares/company.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";

import {
  getTeamController,
  getPendingInvitationsController,
  inviteMemberController,
  updateMemberRoleController,
  updateMemberStatusController,
  deleteTeamMemberController,
  revokeInvitationController,
  acceptInvitationController,
} from "./team.controller.js";

const router = Router();

/**
 * Accept invitation is PUBLIC.
 *
 * User is not logged in yet.
 */
router.post("/invitations/accept", asyncHandler(acceptInvitationController));

/**
 * All remaining team APIs
 * require authentication + company.
 */
router.use(authenticate);
router.use(requireCompany);

/**
 * Team
 */
router.get("/", asyncHandler(getTeamController));

/**
 * Invitations
 */
router.get("/invitations", asyncHandler(getPendingInvitationsController));

router.post("/invite", asyncHandler(inviteMemberController));

router.delete("/invitations/:id", asyncHandler(revokeInvitationController));

/**
 * Members
 */
router.patch("/:id/role", asyncHandler(updateMemberRoleController));

router.patch("/:id/status", asyncHandler(updateMemberStatusController));

router.delete("/:id", asyncHandler(deleteTeamMemberController));

export default router;
