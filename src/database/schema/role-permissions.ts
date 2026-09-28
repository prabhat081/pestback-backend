import { pgTable, uuid, timestamp, primaryKey, index } from "drizzle-orm/pg-core";

import { roles } from "./roles.js";
import { permissions } from "./permissions.js";

export const rolePermissions = pgTable(
    "role_permissions",
    {
        roleId: uuid("role_id")
            .notNull()
            .references(() => roles.id, {
                onDelete: "cascade",
            }),

        permissionId: uuid("permission_id")
            .notNull()
            .references(() => permissions.id, {
                onDelete: "cascade",
            }),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        primaryKey({
            name: "role_permissions_pk",
            columns: [table.roleId, table.permissionId],
        }),

        index("role_permissions_role_idx").on(table.roleId),

        index("role_permissions_permission_idx").on(table.permissionId),
    ]
);
