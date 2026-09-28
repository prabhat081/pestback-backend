import { and, eq } from "drizzle-orm";
import { db } from "../../database/index.js";
import { companyUsers } from "../../database/schema/company-users.js";
import { roles } from "../../database/schema/roles.js";
import { rolePermissions } from "../../database/schema/role-permissions.js";
import { permissions } from "../../database/schema/permissions.js";

export async function hasPermission(
  userId: string,
  companyId: string,
  permissionName: string,
): Promise<boolean> {
  const result = await db
    .select({
      permissionId: permissions.id,
    })
    .from(companyUsers)
    .innerJoin(
      roles,
      eq(companyUsers.roleId, roles.id),
    )
    .innerJoin(
      rolePermissions,
      eq(roles.id, rolePermissions.roleId),
    )
    .innerJoin(
      permissions,
      eq(rolePermissions.permissionId, permissions.id),
    )
    .where(
      and(
        eq(companyUsers.userId, userId),
        eq(companyUsers.companyId, companyId),
        eq(companyUsers.isActive, true),
        eq(roles.isActive, true),
        eq(permissions.name, permissionName),
      ),
    )
    .limit(1);

  return result.length > 0;
}