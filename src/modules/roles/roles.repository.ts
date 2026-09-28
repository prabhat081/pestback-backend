import { eq } from "drizzle-orm";

import { db } from "../../database/index.js";
import { roles } from "../../database/schema/roles.js";

export async function findSystemRoles() {
  return db
    .select({
      id: roles.id,
      name: roles.name,
      slug: roles.slug,
    })
    .from(roles)
    .where(eq(roles.isSystem, true))
    .orderBy(roles.name);
}
