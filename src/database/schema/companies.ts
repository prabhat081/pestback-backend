import { pgTable, uuid, varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core";

export const companies = pgTable(
    "companies",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        name: varchar("name", {
            length: 150,
        }).notNull(),

        slug: varchar("slug", {
            length: 150,
        })
            .notNull()
            .unique(),

        email: varchar("email", {
            length: 255,
        }),

        phone: varchar("phone", {
            length: 30,
        }),

        website: varchar("website", {
            length: 255,
        }),

        logoUrl: varchar("logo_url", {
            length: 500,
        }),

        address: text("address"),

        city: varchar("city", {
            length: 100,
        }),

        state: varchar("state", {
            length: 100,
        }),

        country: varchar("country", {
            length: 100,
        })
            .notNull()
            .default("India"),

        timezone: varchar("timezone", {
            length: 100,
        })
            .notNull()
            .default("Asia/Kolkata"),

        currency: varchar("currency", {
            length: 10,
        })
            .notNull()
            .default("INR"),

        onboardingCompleted: boolean("onboarding_completed").notNull().default(false),

        isActive: boolean("is_active").notNull().default(true),

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
    (table) => [index("companies_active_idx").on(table.isActive), index("companies_email_idx").on(table.email)]
);
