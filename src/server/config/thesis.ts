import type { InvestmentThesis } from "../../shared/contracts.js";

export const demoInvestmentThesis: InvestmentThesis = {
  name: "Demo Acquisition Thesis",
  targetIndustries: [
    "Software Development",
    "Healthcare Software",
    "Vertical Software",
  ],
  targetCountries: ["USA"],
  revenueMin: 2_000_000,
  revenueMax: 20_000_000,
  preferredOwnership: "founder_owned",
};

