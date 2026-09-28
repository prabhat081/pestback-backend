import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";

export const permissions = pgTable(
    "permissions",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        name: varchar("name", {
            length: 150,
        })
            .notNull()
            .unique(),

        module: varchar("module", {
            length: 100,
        }).notNull(),

        action: varchar("action", {
            length: 50,
        }).notNull(),

        description: text("description"),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .notNull()
            .defaultNow(),
    },
    (table) => [index("permissions_module_idx").on(table.module)]
);
