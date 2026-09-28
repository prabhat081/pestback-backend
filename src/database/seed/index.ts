import { seedPlans } from "./plans.seed.js";

async function main() {
  await seedPlans();
}

main()
  .then(() => {
    console.log("✅ All seeds completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });