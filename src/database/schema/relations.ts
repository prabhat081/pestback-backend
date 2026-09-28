import { relations } from "drizzle-orm";

import { users } from "./users.js";
import { companies } from "./companies.js";
import { companyUsers } from "./company-users.js";
import { roles } from "./roles.js";
import { permissions } from "./permissions.js";
import { rolePermissions } from "./role-permissions.js";
import { refreshTokens } from "./refresh-tokens.js";
import { teamInvitations } from "./team-invitations.js";

import { customers } from "./customers.js";
import { properties } from "./properties.js";
import { serviceCatalog } from "./service-catalog.js";
import { services } from "./services.js";

import { technicians } from "./technicians.js";
import { technicianServices } from "./technician-services.js";

import { jobs } from "./jobs.js";
import { schedules } from "./schedules.js";

import { invoices, invoiceItems } from "./invoices.js";

import { payments } from "./payments.js";
import { paymentOrders } from "./payment_orders.js";
import { paymentAttempts } from "./payment-attempts.js";
import { paymentWebhooks } from "./payment-webhooks.js";

import { plans } from "./plans.js";
import { planFeatures } from "./plan-features.js";
import { subscriptions } from "./subscriptions.js";
import { subscriptionPayments } from "./subscription-payments.js";
import { subscriptionInvoices } from "./subscription-invoices.js";
import { subscriptionInvoiceItems } from "./subscription-invoice-items.js";
import { subscriptionBillingPlans } from "./subscription-billing-plans.js";

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
  companyUsers: many(companyUsers),

  refreshTokens: many(refreshTokens),

  teamInvitations: many(teamInvitations),
}));

/* -------------------------------------------------------------------------- */
/* Companies                                                                  */
/* -------------------------------------------------------------------------- */

export const companiesRelations = relations(companies, ({ many }) => ({
  companyUsers: many(companyUsers),

  roles: many(roles),

  customers: many(customers),

  properties: many(properties),

  serviceCatalog: many(serviceCatalog),

  services: many(services),

  technicians: many(technicians),

  jobs: many(jobs),

  schedules: many(schedules),

  teamInvitations: many(teamInvitations),

  // Invoices
  invoices: many(invoices),

  // Payments
  payments: many(payments),

  paymentOrders: many(paymentOrders),

  paymentAttempts: many(paymentAttempts),

  paymentWebhooks: many(paymentWebhooks),

  subscriptions: many(subscriptions),

  subscriptionPayments: many(subscriptionPayments),

  subscriptionInvoices: many(subscriptionInvoices),
}));

/* -------------------------------------------------------------------------- */
/* Company Users                                                              */
/* -------------------------------------------------------------------------- */

export const companyUsersRelations = relations(
  companyUsers,
  ({ one, many }) => ({
    user: one(users, {
      fields: [companyUsers.userId],
      references: [users.id],
    }),

    company: one(companies, {
      fields: [companyUsers.companyId],
      references: [companies.id],
    }),

    role: one(roles, {
      fields: [companyUsers.roleId],
      references: [roles.id],
    }),

    technicians: many(technicians),
  }),
);

/* -------------------------------------------------------------------------- */
/* Roles                                                                      */
/* -------------------------------------------------------------------------- */

export const rolesRelations = relations(roles, ({ one, many }) => ({
  company: one(companies, {
    fields: [roles.companyId],
    references: [companies.id],
  }),

  companyUsers: many(companyUsers),

  rolePermissions: many(rolePermissions),

  teamInvitations: many(teamInvitations),
}));

/* -------------------------------------------------------------------------- */
/* Permissions                                                                */
/* -------------------------------------------------------------------------- */

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

/* -------------------------------------------------------------------------- */
/* Role Permissions                                                           */
/* -------------------------------------------------------------------------- */

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),

    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

/* -------------------------------------------------------------------------- */
/* Refresh Tokens                                                             */
/* -------------------------------------------------------------------------- */

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/* Team Invitations                                                           */
/* -------------------------------------------------------------------------- */

export const teamInvitationsRelations = relations(
  teamInvitations,
  ({ one }) => ({
    company: one(companies, {
      fields: [teamInvitations.companyId],
      references: [companies.id],
    }),

    role: one(roles, {
      fields: [teamInvitations.roleId],
      references: [roles.id],
    }),

    invitedByUser: one(users, {
      fields: [teamInvitations.invitedBy],
      references: [users.id],
    }),
  }),
);

/* -------------------------------------------------------------------------- */
/* Customers                                                                  */
/* -------------------------------------------------------------------------- */

export const customersRelations = relations(customers, ({ one, many }) => ({
  company: one(companies, {
    fields: [customers.companyId],
    references: [companies.id],
  }),

  properties: many(properties),

  services: many(services),

  jobs: many(jobs),

  // Invoices
  invoices: many(invoices),

  // Payments
  paymentOrders: many(paymentOrders),

  payments: many(payments),
}));

/* -------------------------------------------------------------------------- */
/* Properties                                                                 */
/* -------------------------------------------------------------------------- */

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  company: one(companies, {
    fields: [properties.companyId],
    references: [companies.id],
  }),

  customer: one(customers, {
    fields: [properties.customerId],
    references: [customers.id],
  }),

  services: many(services),

  jobs: many(jobs),

  // Invoices
  invoices: many(invoices),
}));

/* -------------------------------------------------------------------------- */
/* Service Catalog                                                            */
/* -------------------------------------------------------------------------- */

export const serviceCatalogRelations = relations(
  serviceCatalog,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [serviceCatalog.companyId],
      references: [companies.id],
    }),

    services: many(services),

    technicianServices: many(technicianServices),
  }),
);

/* -------------------------------------------------------------------------- */
/* Customer Services                                                          */
/* -------------------------------------------------------------------------- */

export const servicesRelations = relations(services, ({ one, many }) => ({
  company: one(companies, {
    fields: [services.companyId],
    references: [companies.id],
  }),

  customer: one(customers, {
    fields: [services.customerId],
    references: [customers.id],
  }),

  property: one(properties, {
    fields: [services.propertyId],
    references: [properties.id],
  }),

  serviceCatalog: one(serviceCatalog, {
    fields: [services.serviceCatalogId],
    references: [serviceCatalog.id],
  }),

  jobs: many(jobs),
}));

/* -------------------------------------------------------------------------- */
/* Technicians                                                                */
/* -------------------------------------------------------------------------- */

export const techniciansRelations = relations(technicians, ({ one, many }) => ({
  company: one(companies, {
    fields: [technicians.companyId],
    references: [companies.id],
  }),

  companyUser: one(companyUsers, {
    fields: [technicians.companyUserId],
    references: [companyUsers.id],
  }),

  technicianServices: many(technicianServices),

  jobs: many(jobs),

  schedules: many(schedules),
}));

/* -------------------------------------------------------------------------- */
/* Technician Services                                                        */
/* -------------------------------------------------------------------------- */

export const technicianServicesRelations = relations(
  technicianServices,
  ({ one }) => ({
    technician: one(technicians, {
      fields: [technicianServices.technicianId],
      references: [technicians.id],
    }),

    serviceCatalog: one(serviceCatalog, {
      fields: [technicianServices.serviceCatalogId],
      references: [serviceCatalog.id],
    }),
  }),
);

/* -------------------------------------------------------------------------- */
/* Jobs                                                                       */
/* -------------------------------------------------------------------------- */

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company: one(companies, {
    fields: [jobs.companyId],
    references: [companies.id],
  }),

  customer: one(customers, {
    fields: [jobs.customerId],
    references: [customers.id],
  }),

  property: one(properties, {
    fields: [jobs.propertyId],
    references: [properties.id],
  }),

  service: one(services, {
    fields: [jobs.serviceId],
    references: [services.id],
  }),

  technician: one(technicians, {
    fields: [jobs.technicianId],
    references: [technicians.id],
  }),

  schedules: many(schedules),

  invoices: many(invoices),
}));
/* -------------------------------------------------------------------------- */
/* Schedules                                                                  */
/* -------------------------------------------------------------------------- */

export const schedulesRelations = relations(schedules, ({ one }) => ({
  company: one(companies, {
    fields: [schedules.companyId],
    references: [companies.id],
  }),

  job: one(jobs, {
    fields: [schedules.jobId],
    references: [jobs.id],
  }),

  technician: one(technicians, {
    fields: [schedules.technicianId],
    references: [technicians.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/* Invoices                                                                   */
/* -------------------------------------------------------------------------- */

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),

  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),

  property: one(properties, {
    fields: [invoices.propertyId],
    references: [properties.id],
  }),

  job: one(jobs, {
    fields: [invoices.jobId],
    references: [jobs.id],
  }),

  items: many(invoiceItems),

  // Payments
  paymentOrders: many(paymentOrders),

  payments: many(payments),
}));

/* -------------------------------------------------------------------------- */
/* Invoice Items                                                              */
/* -------------------------------------------------------------------------- */

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/* Payment Orders                                                             */
/* -------------------------------------------------------------------------- */

export const paymentOrdersRelations = relations(
  paymentOrders,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [paymentOrders.companyId],
      references: [companies.id],
    }),

    invoice: one(invoices, {
      fields: [paymentOrders.invoiceId],
      references: [invoices.id],
    }),

    customer: one(customers, {
      fields: [paymentOrders.customerId],
      references: [customers.id],
    }),

    attempts: many(paymentAttempts),
  }),
);

/* -------------------------------------------------------------------------- */
/* Payments                                                                   */
/* -------------------------------------------------------------------------- */

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  company: one(companies, {
    fields: [payments.companyId],
    references: [companies.id],
  }),

  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),

  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),

  attempts: many(paymentAttempts),
}));

/* -------------------------------------------------------------------------- */
/* Payment Attempts                                                           */
/* -------------------------------------------------------------------------- */

export const paymentAttemptsRelations = relations(
  paymentAttempts,
  ({ one }) => ({
    company: one(companies, {
      fields: [paymentAttempts.companyId],
      references: [companies.id],
    }),

    paymentOrder: one(paymentOrders, {
      fields: [paymentAttempts.paymentOrderId],
      references: [paymentOrders.id],
    }),

    payment: one(payments, {
      fields: [paymentAttempts.paymentId],
      references: [payments.id],
    }),
  }),
);

/* -------------------------------------------------------------------------- */
/* Payment Webhooks                                                           */
/* -------------------------------------------------------------------------- */

export const paymentWebhooksRelations = relations(
  paymentWebhooks,
  ({ one }) => ({
    company: one(companies, {
      fields: [paymentWebhooks.companyId],
      references: [companies.id],
    }),
  }),
);

// plans and subscritption

export const plansRelations = relations(plans, ({ many }) => ({
  planFeatures: many(planFeatures),

  subscriptions: many(subscriptions),
  subscriptionBillingPlans: many(subscriptionBillingPlans),
}));

export const planFeaturesRelations = relations(planFeatures, ({ one }) => ({
  plan: one(plans, {
    fields: [planFeatures.planId],
    references: [plans.id],
  }),
}));

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [subscriptions.companyId],
      references: [companies.id],
    }),

    plan: one(plans, {
      fields: [subscriptions.planId],
      references: [plans.id],
    }),

    payments: many(subscriptionPayments),

    invoices: many(subscriptionInvoices),
  }),
);

export const subscriptionPaymentsRelations = relations(
  subscriptionPayments,
  ({ one }) => ({
    company: one(companies, {
      fields: [subscriptionPayments.companyId],
      references: [companies.id],
    }),

    subscription: one(subscriptions, {
      fields: [subscriptionPayments.subscriptionId],
      references: [subscriptions.id],
    }),
  }),
);

export const subscriptionInvoicesRelations = relations(
  subscriptionInvoices,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [subscriptionInvoices.companyId],
      references: [companies.id],
    }),

    subscription: one(subscriptions, {
      fields: [subscriptionInvoices.subscriptionId],
      references: [subscriptions.id],
    }),

    items: many(subscriptionInvoiceItems),
  }),
);

export const subscriptionInvoiceItemsRelations = relations(
  subscriptionInvoiceItems,
  ({ one }) => ({
    invoice: one(subscriptionInvoices, {
      fields: [subscriptionInvoiceItems.invoiceId],
      references: [subscriptionInvoices.id],
    }),
  }),
);

export const subscriptionBillingPlansRelations = relations(
  subscriptionBillingPlans,
  ({ one }) => ({
    plan: one(plans, {
      fields: [subscriptionBillingPlans.planId],
      references: [plans.id],
    }),
  }),
);
