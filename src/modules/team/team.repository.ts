// src/modules/team/team.repository.ts

import { and, count, desc, eq, gt, ilike, isNull, or, sql } from "drizzle-orm";

import { db } from "../../database/index.js";

import {
  companies,
  companyUsers,
  roles,
  teamInvitations,
  users,
} from "../../database/schema/index.js";

import type {
  TeamInvitation,
  TeamMember,
  TeamQuery,
  TeamStats,
} from "./team.types.js";

/**
 * TEAM MEMBERS
 */
export async function findTeamMembers(
  companyId: string,
  options: TeamQuery,
): Promise<TeamMember[]> {
  const offset = (options.page - 1) * options.limit;

  const conditions = [eq(companyUsers.companyId, companyId)];

  if (options.search) {
    const search = `%${options.search}%`;

    conditions.push(
      or(
        ilike(users.firstName, search),
        ilike(users.lastName, search),
        ilike(users.email, search),
      )!,
    );
  }

  if (options.role) {
    conditions.push(eq(roles.slug, options.role));
  }

  if (options.status === "active") {
    conditions.push(eq(companyUsers.isActive, true), eq(users.isActive, true));
  }

  if (options.status === "inactive") {
    conditions.push(eq(companyUsers.isActive, false));
  }

  return db
    .select({
      id: users.id,

      firstName: users.firstName,

      lastName: users.lastName,

      email: users.email,

      phone: users.phone,

      roleId: roles.id,

      roleName: roles.name,

      roleSlug: roles.slug,

      isActive: companyUsers.isActive,

      joinedAt: companyUsers.joinedAt,
    })
    .from(companyUsers)
    .innerJoin(users, eq(companyUsers.userId, users.id))
    .innerJoin(roles, eq(companyUsers.roleId, roles.id))
    .where(and(...conditions))
    .orderBy(desc(companyUsers.joinedAt))
    .limit(options.limit)
    .offset(offset);
}

/**
 * COUNT
 */
export async function countTeamMembers(companyId: string, options: TeamQuery) {
  const conditions = [eq(companyUsers.companyId, companyId)];

  if (options.search) {
    const search = `%${options.search}%`;

    conditions.push(
      or(
        ilike(users.firstName, search),
        ilike(users.lastName, search),
        ilike(users.email, search),
      )!,
    );
  }

  if (options.role) {
    conditions.push(eq(roles.slug, options.role));
  }

  if (options.status === "active") {
    conditions.push(eq(companyUsers.isActive, true), eq(users.isActive, true));
  }

  if (options.status === "inactive") {
    conditions.push(eq(companyUsers.isActive, false));
  }

  const [result] = await db
    .select({
      count: count(),
    })
    .from(companyUsers)
    .innerJoin(users, eq(companyUsers.userId, users.id))
    .innerJoin(roles, eq(companyUsers.roleId, roles.id))
    .where(and(...conditions));

  return Number(result?.count ?? 0);
}

/**
 * STATS
 */
export async function getTeamStats(companyId: string): Promise<TeamStats> {
  const now = new Date();

  const [total, active, admins, pending] = await Promise.all([
    db
      .select({
        count: count(),
      })
      .from(companyUsers)
      .where(eq(companyUsers.companyId, companyId)),

    db
      .select({
        count: count(),
      })
      .from(companyUsers)
      .innerJoin(users, eq(companyUsers.userId, users.id))
      .where(
        and(
          eq(companyUsers.companyId, companyId),
          eq(companyUsers.isActive, true),
          eq(users.isActive, true),
        ),
      ),

    db
      .select({
        count: count(),
      })
      .from(companyUsers)
      .innerJoin(roles, eq(companyUsers.roleId, roles.id))
      .where(
        and(
          eq(companyUsers.companyId, companyId),
          eq(companyUsers.isActive, true),
          or(eq(roles.slug, "owner"), eq(roles.slug, "admin")),
        ),
      ),

    db
      .select({
        count: count(),
      })
      .from(teamInvitations)
      .where(
        and(
          eq(teamInvitations.companyId, companyId),
          isNull(teamInvitations.acceptedAt),
          isNull(teamInvitations.revokedAt),
          gt(teamInvitations.expiresAt, now),
        ),
      ),
  ]);

  return {
    totalMembers: Number(total[0]?.count ?? 0),

    activeMembers: Number(active[0]?.count ?? 0),

    admins: Number(admins[0]?.count ?? 0),

    pendingInvitations: Number(pending[0]?.count ?? 0),
  };
}

/**
 * ROLE
 */
export async function findRoleById(roleId: string) {
  const [role] = await db
    .select()
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);

  return role ?? null;
}

/**
 * MEMBER
 */
export async function findCompanyMember(companyId: string, userId: string) {
  const [member] = await db
    .select({
      companyUserId: companyUsers.id,
      userId: companyUsers.userId,
      roleId: roles.id,
      roleSlug: roles.slug,
      isActive: companyUsers.isActive,
    })
    .from(companyUsers)
    .innerJoin(users, eq(companyUsers.userId, users.id))
    .innerJoin(roles, eq(companyUsers.roleId, roles.id))
    .where(
      and(
        eq(companyUsers.companyId, companyId),
        eq(companyUsers.userId, userId),
      ),
    )
    .limit(1);

  return member ?? null;
}

/**
 * MEMBER BY EMAIL
 */
export async function findCompanyUserByEmail(companyId: string, email: string) {
  const [member] = await db
    .select({
      companyUserId: companyUsers.id,
      userId: users.id,
      roleId: roles.id,
    })
    .from(companyUsers)
    .innerJoin(users, eq(companyUsers.userId, users.id))
    .innerJoin(roles, eq(companyUsers.roleId, roles.id))
    .where(and(eq(companyUsers.companyId, companyId), eq(users.email, email)))
    .limit(1);

  return member ?? null;
}
/**
 * PENDING INVITATION
 */
export async function findPendingInvitation(companyId: string, email: string) {
  const [invitation] = await db
    .select()
    .from(teamInvitations)
    .where(
      and(
        eq(teamInvitations.companyId, companyId),
        eq(teamInvitations.email, email),
        isNull(teamInvitations.acceptedAt),
        isNull(teamInvitations.revokedAt),
        gt(teamInvitations.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(teamInvitations.createdAt))
    .limit(1);

  return invitation ?? null;
}

/**
 * CREATE INVITATION
 */
export async function createInvitation(
  data: typeof teamInvitations.$inferInsert,
) {
  const [invitation] = await db
    .insert(teamInvitations)
    .values(data)
    .returning();

  if (!invitation) {
    throw new Error("Failed to create invitation");
  }

  return invitation;
}

/**
 * FIND INVITATION
 */
export async function findInvitationById(
  companyId: string,
  invitationId: string,
) {
  const [result] = await db
    .select({
      invitation: teamInvitations,

      roleName: roles.name,

      roleSlug: roles.slug,
    })
    .from(teamInvitations)
    .innerJoin(roles, eq(teamInvitations.roleId, roles.id))
    .where(
      and(
        eq(teamInvitations.id, invitationId),
        eq(teamInvitations.companyId, companyId),
      ),
    )
    .limit(1);

  return result ?? null;
}

/**
 * PENDING INVITATIONS
 */
export async function findPendingInvitations(
  companyId: string,
): Promise<TeamInvitation[]> {
  return db
    .select({
      id: teamInvitations.id,

      email: teamInvitations.email,

      roleId: roles.id,

      roleName: roles.name,

      roleSlug: roles.slug,

      expiresAt: teamInvitations.expiresAt,

      createdAt: teamInvitations.createdAt,
    })
    .from(teamInvitations)
    .innerJoin(roles, eq(teamInvitations.roleId, roles.id))
    .where(
      and(
        eq(teamInvitations.companyId, companyId),
        isNull(teamInvitations.acceptedAt),
        isNull(teamInvitations.revokedAt),
        gt(teamInvitations.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(teamInvitations.createdAt));
}

/**
 * REVOKE
 */
export async function revokeInvitation(invitationId: string) {
  const [updated] = await db
    .update(teamInvitations)
    .set({
      revokedAt: new Date(),
    })
    .where(eq(teamInvitations.id, invitationId))
    .returning();

  return updated ?? null;
}

/**
 * UPDATE ROLE
 */
export async function updateMemberRole(
  companyId: string,
  userId: string,
  roleId: string,
) {
  const [updated] = await db
    .update(companyUsers)
    .set({
      roleId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(companyUsers.companyId, companyId),
        eq(companyUsers.userId, userId),
      ),
    )
    .returning();

  return updated ?? null;
}

/**
 * UPDATE STATUS
 */
export async function updateMemberStatus(
  companyId: string,
  userId: string,
  isActive: boolean,
) {
  const [updated] = await db
    .update(companyUsers)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(companyUsers.companyId, companyId),
        eq(companyUsers.userId, userId),
      ),
    )
    .returning();

  return updated ?? null;
}

/**
 * DELETE MEMBER
 */
export async function deleteCompanyMember(companyId: string, userId: string) {
  const [deleted] = await db
    .delete(companyUsers)
    .where(
      and(
        eq(companyUsers.companyId, companyId),
        eq(companyUsers.userId, userId),
      ),
    )
    .returning();

  return deleted ?? null;
}

export async function findCompanyById(companyId: string) {
  const [company] = await db
    .select({
      id: companies.id,
      name: companies.name,
    })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  return company ?? null;
}
