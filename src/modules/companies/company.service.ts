import { and, eq } from "drizzle-orm";

import { db } from "../../database/index.js";
import { companies } from "../../database/schema/companies.js";
import { companyUsers } from "../../database/schema/company-users.js";
import { roles } from "../../database/schema/roles.js";
import { ApiError } from "../../utils/api-error.js";
import { generateSlug } from "../../utils/slug.js";

import type { CreateCompanyInput } from "./company.schema.js";
import { createDefaultServiceCatalog } from "../service-catalog/service-catalog.defaults.js";

export async function createCompany(userId: string, input: CreateCompanyInput) {
  const slug = generateSlug(input.name);

  if (!slug) {
    throw new ApiError(400, "Invalid business name", "INVALID_COMPANY_NAME");
  }

  // Check if user already belongs to a company
  const existingMembership = await db
    .select({
      id: companyUsers.id,
    })
    .from(companyUsers)
    .where(
      and(eq(companyUsers.userId, userId), eq(companyUsers.isActive, true)),
    )
    .limit(1);

  if (existingMembership.length > 0) {
    throw new ApiError(
      409,
      "You already belong to a company",
      "COMPANY_ALREADY_EXISTS",
    );
  }

  // Check slug
  const existingCompany = await db
    .select({
      id: companies.id,
    })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);

  if (existingCompany.length > 0) {
    throw new ApiError(
      409,
      "A business with this name already exists",
      "COMPANY_SLUG_EXISTS",
    );
  }

  // Find system owner role
  const ownerRole = await db
    .select({
      id: roles.id,
    })
    .from(roles)
    .where(
      and(
        eq(roles.slug, "owner"),
        eq(roles.isSystem, true),
        eq(roles.isActive, true),
      ),
    )
    .limit(1);

  const ownerRoleRecord = ownerRole[0];

  if (!ownerRoleRecord) {
    throw new ApiError(
      500,
      "Owner role is not configured",
      "OWNER_ROLE_NOT_FOUND",
    );
  }

  const ownerRoleId = ownerRoleRecord.id;

  const result = await db.transaction(async (tx) => {
    const [company] = await tx
      .insert(companies)
      .values({
        name: input.name,
        slug,
        ...(input.email !== undefined && {
          email: input.email,
        }),
        ...(input.phone !== undefined && {
          phone: input.phone,
        }),
        ...(input.website !== undefined && {
          website: input.website,
        }),
        ...(input.address !== undefined && {
          address: input.address,
        }),
        ...(input.city !== undefined && {
          city: input.city,
        }),
        ...(input.state !== undefined && {
          state: input.state,
        }),
        country: input.country,
        timezone: input.timezone,
        currency: input.currency,
        onboardingCompleted: false,
        isActive: true,
      })
      .returning();

    if (!company) {
      throw new ApiError(
        500,
        "Unable to create company",
        "COMPANY_CREATE_FAILED",
      );
    }

    await tx.insert(companyUsers).values({
      companyId: company.id,
      userId,
      roleId: ownerRoleId,
      isActive: true,
    });

    // Create default service catalog
    await createDefaultServiceCatalog(tx, company?.id);
    return company;
  });

  return result;
}

export async function getCurrentCompany(userId: string) {
  const result = await db
    .select({
      company: {
        id: companies.id,
        name: companies.name,
        slug: companies.slug,
        email: companies.email,
        phone: companies.phone,
        website: companies.website,
        logoUrl: companies.logoUrl,
        address: companies.address,
        city: companies.city,
        state: companies.state,
        country: companies.country,
        timezone: companies.timezone,
        currency: companies.currency,
        onboardingCompleted: companies.onboardingCompleted,
        isActive: companies.isActive,
      },

      role: {
        id: roles.id,
        name: roles.name,
        slug: roles.slug,
        isSystem: roles.isSystem,
      },
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .innerJoin(roles, eq(companyUsers.roleId, roles.id))
    .where(
      and(
        eq(companyUsers.userId, userId),
        eq(companyUsers.isActive, true),
        eq(companies.isActive, true),
        eq(roles.isActive, true),
      ),
    )
    .limit(1);

  const current = result[0];

  if (!current) {
    return null;
  }

  return current;
}

export async function completeOnboarding(userId: string) {
  // Find user's active company
  const result = await db
    .select({
      companyId: companyUsers.companyId,
      onboardingCompleted: companies.onboardingCompleted,
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(
      and(
        eq(companyUsers.userId, userId),
        eq(companyUsers.isActive, true),
        eq(companies.isActive, true),
      ),
    )
    .limit(1);

  const current = result[0];

  if (!current) {
    throw new ApiError(
      404,
      "No active company found for this user",
      "COMPANY_NOT_FOUND",
    );
  }

  // Already completed
  if (current.onboardingCompleted) {
    return {
      companyId: current.companyId,
      onboardingCompleted: true,
    };
  }

  // Complete onboarding
  const [updatedCompany] = await db
    .update(companies)
    .set({
      onboardingCompleted: true,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, current.companyId))
    .returning({
      id: companies.id,
      onboardingCompleted: companies.onboardingCompleted,
    });

  if (!updatedCompany) {
    throw new ApiError(
      500,
      "Unable to complete onboarding",
      "ONBOARDING_COMPLETE_FAILED",
    );
  }

  return {
    companyId: updatedCompany.id,
    onboardingCompleted: updatedCompany.onboardingCompleted,
  };
}
