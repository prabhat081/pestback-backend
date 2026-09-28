import type { Request, Response } from "express";

import { ApiError } from "../../utils/api-error.js";

import {
  acceptInvitationSchema,
  inviteMemberSchema,
  teamQuerySchema,
  updateMemberRoleSchema,
  updateMemberStatusSchema,
} from "./team.schema.js";

import * as teamService from "./team.service.js";

function getParamId(value: string | string[] | undefined): string {
  if (!value || Array.isArray(value)) {
    throw new ApiError(400, "Invalid ID");
  }

  return value;
}

export async function getTeamController(req: Request, res: Response) {
  const query = teamQuerySchema.parse(req.query);

  const result = await teamService.getTeam(req.company!.id, query);

  return res.status(200).json({
    success: true,
    data: result.items,
    pagination: result.pagination,
    stats: result.stats,
  });
}

export async function getPendingInvitationsController(
  req: Request,
  res: Response,
) {
  const invitations = await teamService.getPendingInvitations(req.company!.id);

  return res.status(200).json({
    success: true,
    data: invitations,
  });
}

export async function inviteMemberController(req: Request, res: Response) {
  const body = inviteMemberSchema.parse(req.body);

  const result = await teamService.inviteMember(
    req.company!.id,
    req.user!.id,
    body,
  );

  /**
   * Email will use result.token.
   *
   * NEVER return raw token.
   */

  return res.status(201).json({
    success: true,
    message: "Team invitation created successfully",
    data: {
      id: result.invitation.id,

      email: result.invitation.email,

      roleId: result.role.id,

      roleName: result.role.name,

      roleSlug: result.role.slug,

      expiresAt: result.invitation.expiresAt,
    },
  });
}

export async function updateMemberRoleController(req: Request, res: Response) {
  const memberId = getParamId(req.params.id);

  const body = updateMemberRoleSchema.parse(req.body);

  await teamService.changeMemberRole(
    req.company!.id,
    req.user!.id,
    memberId,
    body.roleId,
  );

  return res.status(200).json({
    success: true,
    message: "Team member role updated successfully",
  });
}

export async function updateMemberStatusController(
  req: Request,
  res: Response,
) {
  const memberId = getParamId(req.params.id);

  const body = updateMemberStatusSchema.parse(req.body);

  await teamService.changeMemberStatus(
    req.company!.id,
    req.user!.id,
    memberId,
    body.isActive,
  );

  return res.status(200).json({
    success: true,
    message: "Team member status updated successfully",
  });
}

export async function deleteTeamMemberController(req: Request, res: Response) {
  const memberId = getParamId(req.params.id);

  await teamService.removeTeamMember(req.company!.id, req.user!.id, memberId);

  return res.status(200).json({
    success: true,
    message: "Team member removed successfully",
  });
}

export async function revokeInvitationController(req: Request, res: Response) {
  const invitationId = getParamId(req.params.id);

  await teamService.revokeTeamInvitation(
    req.company!.id,
    invitationId,
    req.user!.id,
  );

  return res.status(200).json({
    success: true,
    message: "Invitation revoked successfully",
  });
}

export async function acceptInvitationController(req: Request, res: Response) {
  const body = acceptInvitationSchema.parse(req.body);

  const result = await teamService.acceptInvitation(body);

  return res.status(200).json({
    success: true,

    message: "Invitation accepted successfully. Please login to continue.",

    data: result,
  });
}
