import { pgTable, uuid, varchar, boolean, timestamp, index } from "drizzle-orm/pg-core";

export const users = pgTable(
    "users",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        firstName: varchar("first_name", {
            length: 100,
        }).notNull(),

        lastName: varchar("last_name", {
            length: 100,
        }).notNull(),

        email: varchar("email", {
            length: 255,
        })
            .notNull()
            .unique(),

        phone: varchar("phone", {
            length: 30,
        }),

        passwordHash: varchar("password_hash", {
            length: 255,
        }).notNull(),

        avatarUrl: varchar("avatar_url", {
            length: 500,
        }),

        isEmailVerified: boolean("is_email_verified").notNull().default(false),

        isActive: boolean("is_active").notNull().default(true),

        lastLoginAt: timestamp("last_login_at", {
            withTimezone: true,
        }),

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
    (table) => [index("users_active_idx").on(table.isActive)]
);
