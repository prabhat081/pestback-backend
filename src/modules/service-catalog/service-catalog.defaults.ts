import { db } from "../../database/index.js";
import { serviceCatalog } from "../../database/schema/service-catalog.js";

const defaultCatalog = [
  {
    name: "General Pest Control",
    slug: "general-pest-control",
    serviceType: "general_pest_control",
    defaultPrice: "1500",
    defaultFrequency: "quarterly",
    warrantyDays: "30",
  },
  {
    name: "Cockroach Control",
    slug: "cockroach-control",
    serviceType: "cockroach_control",
    defaultPrice: "1200",
    defaultFrequency: "quarterly",
    warrantyDays: "30",
  },
  {
    name: "Termite Control",
    slug: "termite-control",
    serviceType: "termite_control",
    defaultPrice: "2500",
    defaultFrequency: "yearly",
    warrantyDays: "365",
  },
  {
    name: "Rodent Control",
    slug: "rodent-control",
    serviceType: "rodent_control",
    defaultPrice: "1800",
    defaultFrequency: "quarterly",
    warrantyDays: "30",
  },
  {
    name: "Mosquito Control",
    slug: "mosquito-control",
    serviceType: "mosquito_control",
    defaultPrice: "1500",
    defaultFrequency: "monthly",
    warrantyDays: "30",
  },
  {
    name: "Bed Bug Control",
    slug: "bed-bug-control",
    serviceType: "bed_bug_control",
    defaultPrice: "3000",
    defaultFrequency: "one_time",
    warrantyDays: "30",
  },
];

export async function createDefaultServiceCatalog(tx: any, companyId: string) {
  await tx.insert(serviceCatalog).values(
    defaultCatalog.map((item) => ({
      companyId,
      ...item,
      isActive: true,
    })),
  );
}
