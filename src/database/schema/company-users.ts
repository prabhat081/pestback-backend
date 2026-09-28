import { pgTable, uuid, boolean, timestamp, unique, index } from "drizzle-orm/pg-core";

import { companies } from "./companies.js";
import { users } from "./users.js";
import { roles } from "./roles.js";

export const companyUsers = pgTable(
    "company_users",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, {
                onDelete: "cascade",
            }),

        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),

        roleId: uuid("role_id")
            .notNull()
            .references(() => roles.id),

        isActive: boolean("is_active").notNull().default(true),

        joinedAt: timestamp("joined_at", {
            withTimezone: true,
        })
            .notNull()
            .defaultNow(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .notNull()
            .defaultNow(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
        })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        unique("company_users_company_user_unique").on(table.companyId, table.userId),

        index("company_users_company_idx").on(table.companyId),

        index("company_users_user_idx").on(table.userId),

        index("company_users_role_idx").on(table.roleId),
    ]
);
