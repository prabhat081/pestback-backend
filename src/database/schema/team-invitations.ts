import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies.js";
import { roles } from "./roles.js";
import { users } from "./users.js";

export const teamInvitations = pgTable(
  "team_invitations",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, {
        onDelete: "restrict",
      }),

    email: varchar("email", {
      length: 255,
    }).notNull(),

    tokenHash: varchar("token_hash", {
      length: 64,
    }).notNull(),

    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    acceptedAt: timestamp("accepted_at", {
      withTimezone: true,
    }),

    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },

  (table) => [
    index("team_invitations_company_idx").on(
      table.companyId,
    ),

    index("team_invitations_email_idx").on(
      table.email,
    ),

    index("team_invitations_expires_idx").on(
      table.expiresAt,
    ),

    uniqueIndex(
      "team_invitations_token_hash_unique",
    ).on(table.tokenHash),
  ],
);