// src/modules/team/team.service.ts

import crypto from "node:crypto";
import argon2 from "argon2";
import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { db } from "../../database/index.js";

import {
  companyUsers,
  roles,
  teamInvitations,
  users,
  technicians,
} from "../../database/schema/index.js";

import { ApiError } from "../../utils/api-error.js";

import {
  countTeamMembers,
  createInvitation,
  deleteCompanyMember,
  findCompanyMember,
  findCompanyById,
  findCompanyUserByEmail,
  findInvitationById,
  findPendingInvitation,
  findPendingInvitations,
  findRoleById,
  findTeamMembers,
  getTeamStats,
  revokeInvitation,
  updateMemberRole,
  updateMemberStatus,
} from "./team.repository.js";

import type { TeamQuery } from "./team.types.js";

import { queueTeamInvitationEmail } from "../../queues/email.queue.js";

function generateInvitationToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashInvitationToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function canManageTeam(roleSlug: string) {
  return roleSlug === "owner" || roleSlug === "admin";
}

/**
 * GET TEAM
 */
export async function getTeam(companyId: string, query: TeamQuery) {
  const [items, total, stats] = await Promise.all([
    findTeamMembers(companyId, query),

    countTeamMembers(companyId, query),

    getTeamStats(companyId),
  ]);

  return {
    items,

    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },

    stats,
  };
}

/**
 * GET PENDING INVITATIONS
 */
export async function getPendingInvitations(companyId: string) {
  return findPendingInvitations(companyId);
}

/**
 * INVITE
 */
export async function inviteMember(
  companyId: string,
  invitedBy: string,
  data: {
    email: string;
    roleId: string;
  },
) {
  const email = data.email.trim().toLowerCase();

  const inviter = await findCompanyMember(companyId, invitedBy);

  if (!inviter) {
    throw new ApiError(403, "You are not a member of this company");
  }

  if (!canManageTeam(inviter.roleSlug)) {
    throw new ApiError(
      403,
      "You do not have permission to invite team members",
    );
  }

  const role = await findRoleById(data.roleId);

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  /**
   * System role OR same-company role
   */
  if (role.companyId !== null && role.companyId !== companyId) {
    throw new ApiError(400, "Invalid role for this company");
  }

  if (role.slug === "owner") {
    throw new ApiError(400, "Owner role cannot be assigned through invitation");
  }

  const company = await findCompanyById(companyId);

  if (!company) {
    throw new ApiError(404, "Company not found");
  }

  const existingMember = await findCompanyUserByEmail(companyId, email);

  if (existingMember) {
    throw new ApiError(409, "This user is already a member of the company");
  }

  const existingInvitation = await findPendingInvitation(companyId, email);

  if (existingInvitation) {
    throw new ApiError(
      409,
      "A pending invitation already exists for this email",
    );
  }

  const token = generateInvitationToken();

  const tokenHash = hashInvitationToken(token);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await createInvitation({
    companyId,
    roleId: role.id,
    email,
    tokenHash,
    invitedBy,
    expiresAt,
  });

  await queueTeamInvitationEmail({
    email,
    companyName: company.name,
    roleName: role.name,
    invitationToken: token,
  });

  return {
    invitation,
    role,
  };
}
/**
 * REVOKE INVITATION
 */
export async function revokeTeamInvitation(
  companyId: string,
  invitationId: string,
  currentUserId: string,
) {
  const currentUser = await findCompanyMember(companyId, currentUserId);

  if (!currentUser || !canManageTeam(currentUser.roleSlug)) {
    throw new ApiError(403, "You do not have permission to revoke invitations");
  }

  const result = await findInvitationById(companyId, invitationId);

  if (!result) {
    throw new ApiError(404, "Invitation not found");
  }

  if (result.invitation.acceptedAt) {
    throw new ApiError(400, "Invitation has already been accepted");
  }

  if (result.invitation.revokedAt) {
    throw new ApiError(400, "Invitation has already been revoked");
  }

  await revokeInvitation(invitationId);
}

/**
 * CHANGE ROLE
 */
export async function changeMemberRole(
  companyId: string,
  currentUserId: string,
  memberId: string,
  roleId: string,
) {
  const currentUser = await findCompanyMember(companyId, currentUserId);

  if (!currentUser || !canManageTeam(currentUser.roleSlug)) {
    throw new ApiError(403, "You do not have permission to change team roles");
  }

  const targetMember = await findCompanyMember(companyId, memberId);

  if (!targetMember) {
    throw new ApiError(404, "Team member not found");
  }

  if (targetMember.roleSlug === "owner") {
    throw new ApiError(400, "Owner role cannot be changed");
  }

  const role = await findRoleById(roleId);

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  if (role.companyId !== null && role.companyId !== companyId) {
    throw new ApiError(400, "Invalid role for this company");
  }

  if (role.slug === "owner") {
    throw new ApiError(400, "Owner role cannot be assigned");
  }

  return updateMemberRole(companyId, memberId, role.id);
}

/**
 * CHANGE STATUS
 */
export async function changeMemberStatus(
  companyId: string,
  currentUserId: string,
  memberId: string,
  isActive: boolean,
) {
  const currentUser = await findCompanyMember(companyId, currentUserId);

  if (!currentUser || !canManageTeam(currentUser.roleSlug)) {
    throw new ApiError(
      403,
      "You do not have permission to change team member status",
    );
  }

  const targetMember = await findCompanyMember(companyId, memberId);

  if (!targetMember) {
    throw new ApiError(404, "Team member not found");
  }

  if (targetMember.roleSlug === "owner") {
    throw new ApiError(400, "Owner status cannot be changed");
  }

  return updateMemberStatus(companyId, memberId, isActive);
}

/**
 * DELETE MEMBER
 */
export async function removeTeamMember(
  companyId: string,
  currentUserId: string,
  memberId: string,
) {
  const currentUser = await findCompanyMember(companyId, currentUserId);

  if (!currentUser || !canManageTeam(currentUser.roleSlug)) {
    throw new ApiError(
      403,
      "You do not have permission to remove team members",
    );
  }

  if (currentUserId === memberId) {
    throw new ApiError(400, "You cannot remove yourself");
  }

  const targetMember = await findCompanyMember(companyId, memberId);

  if (!targetMember) {
    throw new ApiError(404, "Team member not found");
  }

  if (targetMember.roleSlug === "owner") {
    throw new ApiError(400, "Owner cannot be removed");
  }

  return deleteCompanyMember(companyId, memberId);
}

/**
 * ACCEPT INVITATION
 *
 * IMPORTANT:
 * No access token.
 * No refresh token.
 * No automatic login.
 */
export async function acceptInvitation(input: {
  token: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password: string;
}) {
  const tokenHash = hashInvitationToken(input.token);

  const [result] = await db
    .select({
      invitation: teamInvitations,
      role: roles,
    })
    .from(teamInvitations)
    .innerJoin(roles, eq(teamInvitations.roleId, roles.id))
    .where(eq(teamInvitations.tokenHash, tokenHash))
    .limit(1);

  if (!result) {
    throw new ApiError(
      400,
      "Invalid or expired invitation",
      "INVALID_INVITATION",
    );
  }

  const invitation = result.invitation;
  const role = result.role;

  if (invitation.acceptedAt) {
    throw new ApiError(
      409,
      "This invitation has already been accepted",
      "INVITATION_ALREADY_ACCEPTED",
    );
  }

  if (invitation.revokedAt) {
    throw new ApiError(
      400,
      "This invitation has been revoked",
      "INVITATION_REVOKED",
    );
  }

  if (invitation.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(
      400,
      "This invitation has expired",
      "INVITATION_EXPIRED",
    );
  }

  if (role.slug === "owner") {
    throw new ApiError(
      400,
      "Invalid invitation role",
      "INVALID_INVITATION_ROLE",
    );
  }

  const email = invitation.email.trim().toLowerCase();

  /**
   * Generate technician employee code.
   *
   * Example:
   * TECH-A1B2C3D4
   */
  const generateEmployeeCode = () => {
    return `TECH-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  };

  /**
   * Existing user
   */
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    if (!existingUser.isActive) {
      throw new ApiError(403, "Your account is inactive", "ACCOUNT_INACTIVE");
    }

    if (!existingUser.isEmailVerified) {
      throw new ApiError(
        403,
        "Please verify your email before accepting this invitation",
        "EMAIL_NOT_VERIFIED",
      );
    }

    await db.transaction(async (tx) => {
      const [existingMembership] = await tx
        .select({
          id: companyUsers.id,
        })
        .from(companyUsers)
        .where(
          and(
            eq(companyUsers.companyId, invitation.companyId),
            eq(companyUsers.userId, existingUser.id),
          ),
        )
        .limit(1);

      if (existingMembership) {
        throw new ApiError(
          409,
          "You are already a member of this company",
          "ALREADY_COMPANY_MEMBER",
        );
      }

      /**
       * Create company membership
       */
      await tx.insert(companyUsers).values({
        companyId: invitation.companyId,
        userId: existingUser.id,
        roleId: invitation.roleId,
        isActive: true,
        joinedAt: new Date(),
      });

      /**
       * If invited as technician,
       * automatically create technician profile.
       */
      if (role.slug === "technician") {
        await tx.insert(technicians).values({
          companyId: invitation.companyId,
          companyUserId: (
            await tx
              .select({
                id: companyUsers.id,
              })
              .from(companyUsers)
              .where(
                and(
                  eq(companyUsers.companyId, invitation.companyId),
                  eq(companyUsers.userId, existingUser.id),
                ),
              )
              .limit(1)
          )[0]?.id as string,
          employeeCode: generateEmployeeCode(),
          status: "active",
          joiningDate: new Date().toISOString().slice(0, 10),
          notes: null,
        });
      }

      /**
       * Mark invitation accepted
       */
      await tx
        .update(teamInvitations)
        .set({
          acceptedAt: new Date(),
        })
        .where(eq(teamInvitations.id, invitation.id));
    });

    return {
      user: {
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
      },

      companyId: invitation.companyId,

      role: {
        id: role.id,
        name: role.name,
        slug: role.slug,
      },
    };
  }

  /**
   * New user
   */
  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  const newUser = await db.transaction(async (tx) => {
    /**
     * Create user
     */
    const [createdUser] = await tx
      .insert(users)
      .values({
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email,
        phone: input.phone?.trim() || null,
        passwordHash,
        isEmailVerified: true,
        isActive: true,
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      });

    if (!createdUser) {
      throw new ApiError(500, "Unable to create user", "USER_CREATION_FAILED");
    }

    /**
     * Create company membership
     */
    const [createdCompanyUser] = await tx
      .insert(companyUsers)
      .values({
        companyId: invitation.companyId,
        userId: createdUser.id,
        roleId: invitation.roleId,
        isActive: true,
        joinedAt: new Date(),
      })
      .returning({
        id: companyUsers.id,
      });

    if (!createdCompanyUser) {
      throw new ApiError(
        500,
        "Unable to create company membership",
        "COMPANY_MEMBERSHIP_CREATION_FAILED",
      );
    }

    /**
     * If invited as technician,
     * automatically create technician profile.
     */
    if (role.slug === "technician") {
      await tx.insert(technicians).values({
        companyId: invitation.companyId,
        companyUserId: createdCompanyUser.id,
        employeeCode: generateEmployeeCode(),
        status: "active",
        joiningDate: new Date().toISOString().slice(0, 10),
        notes: null,
      });
    }

    /**
     * Mark invitation accepted
     */
    await tx
      .update(teamInvitations)
      .set({
        acceptedAt: new Date(),
      })
      .where(eq(teamInvitations.id, invitation.id));

    return createdUser;
  });

  return {
    user: newUser,

    companyId: invitation.companyId,

    role: {
      id: role.id,
      name: role.name,
      slug: role.slug,
    },
  };
}


