import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import companyRoutes from "../modules/companies/company.routes.js";
import customerRoutes from "../modules/customers/customer.routes.js";
import propertyRoutes from "../modules/properties/property.routes.js";
import serviceRoutes from "../modules/services/service.routes.js";
import serviceCatalogRoutes from "../modules/service-catalog/service-catalog.routes.js";
import technicianRoutes from "../modules/technicians/technician.routes.js";
import teamRoutes from "../modules/team/team.routes.js";
import jobRoutes from "../modules/jobs/job.routes.js";
import scheduleRoutes from "../modules/schedules/schedule.routes.js";
import invoiceRoutes from "../modules/invoices/invoice.routes.js";
import paymentRoutes from "../modules/payments/payment.routes.js";
import rolesRoutes from "../modules/roles/roles.routes.js";
import planRoutes from "../modules/plans/plan.routes.js";
import subscriptionRoutes from "../modules/subscriptions/subscription.routes.js";
import subscriptionBillingPlanRoutes from "../modules/subscription-billing-plans/subscription-billing-plan.routes.js";
import subscriptionWebhookRoutes from "../modules/subscriptions/subscription-webhook.routes.js";
import subscriptionPaymentRoutes from "../modules/subscriptions/subscription-payment.routes.js";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                                  AUTH                                      */
/* -------------------------------------------------------------------------- */

router.use("/auth", authRoutes);

/* -------------------------------------------------------------------------- */
/*                                COMPANIES                                   */
/* -------------------------------------------------------------------------- */

router.use("/companies", companyRoutes);

/* -------------------------------------------------------------------------- */
/*                                CUSTOMERS                                   */
/* -------------------------------------------------------------------------- */

router.use("/customers", customerRoutes);

/* -------------------------------------------------------------------------- */
/*                               PROPERTIES                                   */
/* -------------------------------------------------------------------------- */

router.use("/properties", propertyRoutes);

/* -------------------------------------------------------------------------- */
/*                                SERVICES                                    */
/* -------------------------------------------------------------------------- */

router.use("/services", serviceRoutes);

/* -------------------------------------------------------------------------- */
/*                           SERVICE CATALOG                                  */
/* -------------------------------------------------------------------------- */

router.use("/service-catalog", serviceCatalogRoutes);

/* -------------------------------------------------------------------------- */
/*                              TECHNICIANS                                   */
/* -------------------------------------------------------------------------- */

router.use("/technicians", technicianRoutes);

/* -------------------------------------------------------------------------- */
/*                                  TEAM                                      */
/* -------------------------------------------------------------------------- */

router.use("/team", teamRoutes);

/* -------------------------------------------------------------------------- */
/*                                  JOBS                                      */
/* -------------------------------------------------------------------------- */

router.use("/jobs", jobRoutes);

/* -------------------------------------------------------------------------- */
/*                               SCHEDULES                                    */
/* -------------------------------------------------------------------------- */

router.use("/schedules", scheduleRoutes);

/* -------------------------------------------------------------------------- */
/*                                INVOICES                                    */
/* -------------------------------------------------------------------------- */

router.use("/invoices", invoiceRoutes);

/* -------------------------------------------------------------------------- */
/*                                PAYMENTS                                    */
/* -------------------------------------------------------------------------- */

router.use("/", paymentRoutes);

/* -------------------------------------------------------------------------- */
/*                                  ROLES                                     */
/* -------------------------------------------------------------------------- */

router.use("/roles", rolesRoutes);

/* -------------------------------------------------------------------------- */
/*                                  PLANS                                     */
/* -------------------------------------------------------------------------- */

router.use("/plans", planRoutes);

/* -------------------------------------------------------------------------- */
/*                         SUBSCRIPTION WEBHOOKS                              */
/* -------------------------------------------------------------------------- */

router.use("/subscriptions/webhooks", subscriptionWebhookRoutes);

/* -------------------------------------------------------------------------- */
/*                            SUBSCRIPTIONS                                   */
/* -------------------------------------------------------------------------- */

router.use("/subscriptions", subscriptionRoutes);

router.use("/subscription-billing-plans", subscriptionBillingPlanRoutes);

router.use("/subscription-payments", subscriptionPaymentRoutes);

export default router;
