import { db } from "../client.js";
import { plans } from "../schema/plans.js";

const planSeedData = [
  {
    name: "Free",
    slug: "free",
    description: "Free plan for getting started",
    monthlyPrice: "0",
    yearlyPrice: "0",
    currency: "INR",
    trialDays: 7,
    status: "active" as const,
    displayOrder: 1,
    isPopular: false,
    isPublic: true,
  },
  {
    name: "Basic",
    slug: "basic",
    description: "Basic plan for small pest control businesses",
    monthlyPrice: "999",
    yearlyPrice: "9990",
    currency: "INR",
    trialDays: 0,
    status: "active" as const,
    displayOrder: 2,
    isPopular: true,
    isPublic: true,
  },
  {
    name: "Premium",
    slug: "premium",
    description: "Premium plan for growing pest control businesses",
    monthlyPrice: "1999",
    yearlyPrice: "19990",
    currency: "INR",
    trialDays: 0,
    status: "active" as const,
    displayOrder: 3,
    isPopular: false,
    isPublic: true,
  },
];

export async function seedPlans() {
  console.log("🌱 Seeding plans...");

  for (const plan of planSeedData) {
    await db
      .insert(plans)
      .values(plan)
      .onConflictDoUpdate({
        target: plans.slug,
        set: {
          name: plan.name,
          description: plan.description,
          monthlyPrice: plan.monthlyPrice,
          yearlyPrice: plan.yearlyPrice,
          currency: plan.currency,
          trialDays: plan.trialDays,
          status: plan.status,
          displayOrder: plan.displayOrder,
          isPopular: plan.isPopular,
          isPublic: plan.isPublic,
          updatedAt: new Date(),
        },
      });

    console.log(`✅ ${plan.name}`);
  }

  console.log("✅ Plans seeded successfully");
}