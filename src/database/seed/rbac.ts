import { db } from "../index.js";
import { permissions } from "../schema/permissions.js";
import { roles } from "../schema/roles.js";
import { rolePermissions } from "../schema/role-permissions.js";
import { eq, inArray } from "drizzle-orm";

const permissionData = [
  // Customers
  ["customers.view", "customers", "view"],
  ["customers.create", "customers", "create"],
  ["customers.edit", "customers", "edit"],
  ["customers.delete", "customers", "delete"],

  // Properties
  ["properties.view", "properties", "view"],
  ["properties.create", "properties", "create"],
  ["properties.edit", "properties", "edit"],
  ["properties.delete", "properties", "delete"],

  // Services
  ["services.view", "services", "view"],
  ["services.create", "services", "create"],
  ["services.edit", "services", "edit"],
  ["services.delete", "services", "delete"],

  // Jobs
  ["jobs.view", "jobs", "view"],
  ["jobs.create", "jobs", "create"],
  ["jobs.edit", "jobs", "edit"],
  ["jobs.delete", "jobs", "delete"],

  // Technicians
  ["technicians.view", "technicians", "view"],
  ["technicians.create", "technicians", "create"],
  ["technicians.edit", "technicians", "edit"],
  ["technicians.delete", "technicians", "delete"],

  // Scheduling
  ["scheduling.view", "scheduling", "view"],
  ["scheduling.create", "scheduling", "create"],
  ["scheduling.edit", "scheduling", "edit"],
  ["scheduling.delete", "scheduling", "delete"],

  // Quotations
  ["quotations.view", "quotations", "view"],
  ["quotations.create", "quotations", "create"],
  ["quotations.edit", "quotations", "edit"],
  ["quotations.delete", "quotations", "delete"],

  // Invoices
  ["invoices.view", "invoices", "view"],
  ["invoices.create", "invoices", "create"],
  ["invoices.edit", "invoices", "edit"],
  ["invoices.delete", "invoices", "delete"],

  // Payments
  ["payments.view", "payments", "view"],
  ["payments.create", "payments", "create"],
  ["payments.refund", "payments", "refund"],

  // Expenses
  ["expenses.view", "expenses", "view"],
  ["expenses.create", "expenses", "create"],
  ["expenses.edit", "expenses", "edit"],
  ["expenses.delete", "expenses", "delete"],

  // Reports
  ["reports.view", "reports", "view"],

  // Settings
  ["settings.view", "settings", "view"],
  ["settings.edit", "settings", "edit"],

  // Users
  ["users.view", "users", "view"],
  ["users.create", "users", "create"],
  ["users.edit", "users", "edit"],
  ["users.delete", "users", "delete"],

  // Roles
  ["roles.view", "roles", "view"],
  ["roles.create", "roles", "create"],
  ["roles.edit", "roles", "edit"],
  ["roles.delete", "roles", "delete"],
] as const;

const roleData = [
  {
    name: "Owner",
    slug: "owner",
    description: "Company owner with full access",
  },
  {
    name: "Admin",
    slug: "admin",
    description: "Business administrator",
  },
  {
    name: "Manager",
    slug: "manager",
    description: "Business operations manager",
  },
  {
    name: "Technician",
    slug: "technician",
    description: "Field service technician",
  },
  {
    name: "Staff",
    slug: "staff",
    description: "General business staff",
  },
] as const;

async function seed() {
  console.log("🌱 Starting RBAC seed...");

  // --------------------------------------------------
  // Permissions
  // --------------------------------------------------

  for (const [name, module, action] of permissionData) {
    await db
      .insert(permissions)
      .values({
        name,
        module,
        action,
      })
      .onConflictDoNothing({
        target: permissions.name,
      });
  }

  console.log("✅ Permissions seeded");

  // --------------------------------------------------
  // System Roles
  // --------------------------------------------------

  for (const role of roleData) {
    await db
      .insert(roles)
      .values({
        name: role.name,
        slug: role.slug,
        description: role.description,
        isSystem: true,
        companyId: null,
      })
      .onConflictDoNothing();
  }

  console.log("✅ Roles seeded");

  // --------------------------------------------------
  // Get roles
  // --------------------------------------------------

  const systemRoles = await db
    .select()
    .from(roles)
    .where(eq(roles.isSystem, true));

  const allPermissions = await db
    .select()
    .from(permissions);

  const permissionMap = new Map(
    allPermissions.map((permission) => [
      permission.name,
      permission.id,
    ]),
  );

  // --------------------------------------------------
  // Assign permissions
  // --------------------------------------------------

  for (const role of systemRoles) {
    let allowedPermissions: string[] = [];

    switch (role.slug) {
      case "owner":
        allowedPermissions = allPermissions.map(
          (permission) => permission.name,
        );
        break;

      case "admin":
        allowedPermissions = allPermissions
          .filter(
            (permission) =>
              permission.module !== "roles" ||
              permission.action !== "delete",
          )
          .map((permission) => permission.name);
        break;

      case "manager":
        allowedPermissions = allPermissions
          .filter((permission) =>
            [
              "customers",
              "properties",
              "services",
              "jobs",
              "technicians",
              "scheduling",
              "quotations",
              "invoices",
              "payments",
              "expenses",
              "reports",
            ].includes(permission.module),
          )
          .map((permission) => permission.name);
        break;

      case "technician":
        allowedPermissions = allPermissions
          .filter((permission) =>
            [
              "customers",
              "properties",
              "services",
              "jobs",
              "scheduling",
            ].includes(permission.module),
          )
          .filter(
            (permission) =>
              permission.action === "view" ||
              permission.module === "jobs",
          )
          .map((permission) => permission.name);
        break;

      case "staff":
        allowedPermissions = allPermissions
          .filter((permission) =>
            [
              "customers",
              "properties",
              "services",
              "jobs",
              "scheduling",
              "quotations",
              "invoices",
            ].includes(permission.module),
          )
          .filter(
            (permission) =>
              permission.action === "view" ||
              permission.action === "create" ||
              permission.action === "edit",
          )
          .map((permission) => permission.name);
        break;
    }

    const permissionIds = allowedPermissions
      .map((name) => permissionMap.get(name))
      .filter((id): id is string => Boolean(id));

    if (permissionIds.length === 0) {
      continue;
    }

    await db
      .insert(rolePermissions)
      .values(
        permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
      )
      .onConflictDoNothing();
  }

  console.log("✅ Role permissions assigned");
  console.log("🎉 RBAC seed completed successfully");

  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ RBAC seed failed:", error);
  process.exit(1);
});