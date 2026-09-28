import { db } from "../index.js";
import { companies } from "../schema/companies.js";
import { serviceCatalog } from "../schema/service-catalog.js";
import { eq } from "drizzle-orm";

const catalogItems = [
  {
    name: "General Pest Control",
    slug: "general-pest-control",
    serviceType: "general_pest_control",
    description: "General pest control treatment for common household pests.",
    defaultPrice: "1500",
    defaultFrequency: "quarterly",
    warrantyDays: "30",
  },
  {
    name: "Cockroach Control",
    slug: "cockroach-control",
    serviceType: "cockroach_control",
    description:
      "Professional cockroach treatment for residential and commercial properties.",
    defaultPrice: "1200",
    defaultFrequency: "quarterly",
    warrantyDays: "30",
  },
  {
    name: "Termite Control",
    slug: "termite-control",
    serviceType: "termite_control",
    description: "Complete termite treatment and prevention service.",
    defaultPrice: "2500",
    defaultFrequency: "yearly",
    warrantyDays: "365",
  },
  {
    name: "Rodent Control",
    slug: "rodent-control",
    serviceType: "rodent_control",
    description: "Rodent inspection, control and prevention treatment.",
    defaultPrice: "1800",
    defaultFrequency: "quarterly",
    warrantyDays: "30",
  },
  {
    name: "Mosquito Control",
    slug: "mosquito-control",
    serviceType: "mosquito_control",
    description:
      "Mosquito treatment for residential and commercial properties.",
    defaultPrice: "1500",
    defaultFrequency: "monthly",
    warrantyDays: "30",
  },
  {
    name: "Bed Bug Control",
    slug: "bed-bug-control",
    serviceType: "bed_bug_control",
    description: "Professional bed bug treatment and elimination.",
    defaultPrice: "3000",
    defaultFrequency: "one_time",
    warrantyDays: "30",
  },
];

export async function seedServiceCatalog(companyId: string) {
  for (const item of catalogItems) {
    await db
      .insert(serviceCatalog)
      .values({
        companyId,
        ...item,
        isActive: true,
      })
      .onConflictDoNothing();
  }

  console.log("Service catalog seeded.");
}
