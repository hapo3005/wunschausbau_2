export function calculateInvestment(input) {
  const n = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const askingPrice = n(input.askingPrice);
  const purchaseTaxRate = n(input.purchaseTaxRate, 0.05);
  const notaryLandRegistryRate = n(input.notaryLandRegistryRate, 0.02);
  const brokerRate = n(input.brokerRate, 0);
  const renovation = {
    low: n(input.renovationLow, n(input.renovationBase)),
    base: n(input.renovationBase),
    high: n(input.renovationHigh, n(input.renovationBase)),
  };
  const holdingCosts = n(input.holdingCosts);
  const financingCosts = n(input.financingCosts);
  const riskReserve = n(input.riskReserve);
  const saleCostRate = n(input.saleCostRate, 0.02);
  const kevinOpportunityCost = n(input.kevinHours) * n(input.kevinOpportunityRate);
  const fundingNetBenefit = Math.max(0, n(input.fundingBenefit) - n(input.fundingRestrictionsCost));

  const purchaseClosingCosts = askingPrice * (purchaseTaxRate + notaryLandRegistryRate + brokerRate);
  const fixedProjectCosts = purchaseClosingCosts + holdingCosts + financingCosts + riskReserve + kevinOpportunityCost - fundingNetBenefit;

  const totalProjectCost = {
    low: askingPrice + fixedProjectCosts + renovation.low,
    base: askingPrice + fixedProjectCosts + renovation.base,
    high: askingPrice + fixedProjectCosts + renovation.high,
  };

  const arv = {
    conservative: n(input.arvConservative, n(input.arvBase)),
    base: n(input.arvBase),
    optimistic: n(input.arvOptimistic, n(input.arvBase)),
  };

  const flipNet = (salePrice, projectCost) => salePrice - salePrice * saleCostRate - projectCost;
  const flip = {
    conservative: flipNet(arv.conservative, totalProjectCost.high),
    base: flipNet(arv.base, totalProjectCost.base),
    optimistic: flipNet(arv.optimistic, totalProjectCost.low),
  };

  const annualColdRent = n(input.monthlyColdRent) * 12;
  const vacancyRate = clamp(n(input.vacancyRate, 0.03), 0, 1);
  const maintenanceRate = clamp(n(input.maintenanceRate, 0.08), 0, 1);
  const annualNonRecoverable = n(input.monthlyNonRecoverableCosts) * 12;
  const effectiveRent = annualColdRent * (1 - vacancyRate);
  const maintenance = annualColdRent * maintenanceRate;
  const rentalNOI = effectiveRent - annualNonRecoverable - maintenance;
  const grossRentalYield = totalProjectCost.base > 0 ? annualColdRent / totalProjectCost.base : 0;
  const netRentalYield = totalProjectCost.base > 0 ? rentalNOI / totalProjectCost.base : 0;

  const holidayGross = n(input.holidayNightRate) * 365 * clamp(n(input.holidayOccupancy), 0, 1);
  const holidayNet = holidayGross * (1 - clamp(n(input.holidayVariableCostRate, 0.25), 0, 1)) - n(input.holidayFixedAnnualCosts);
  const holidayNetYield = totalProjectCost.base > 0 ? holidayNet / totalProjectCost.base : 0;

  const desiredFlipProfit = n(input.desiredFlipProfit, 30000);
  const maxPurchasePriceBeforeVariableClosing = arv.conservative * (1 - saleCostRate)
    - renovation.high - holdingCosts - financingCosts - riskReserve - kevinOpportunityCost
    + fundingNetBenefit - desiredFlipProfit;
  const closingRate = purchaseTaxRate + notaryLandRegistryRate + brokerRate;
  const maximumPurchasePrice = Math.max(0, maxPurchasePriceBeforeVariableClosing / (1 + closingRate));
  const marginOfSafety = askingPrice > 0 ? (maximumPurchasePrice - askingPrice) / askingPrice : 0;

  const stressedSale = arv.base * 0.90;
  const stressedRenovation = renovation.base * 1.20;
  const stressedHoldingAndFinance = (holdingCosts + financingCosts) * 1.25;
  const stressedProjectCost = askingPrice + purchaseClosingCosts + stressedRenovation + stressedHoldingAndFinance + riskReserve + kevinOpportunityCost - fundingNetBenefit;
  const stressProfit = flipNet(stressedSale, stressedProjectCost);

  const redFlags = Array.isArray(input.redFlags) ? input.redFlags.filter(Boolean) : [];
  const hardBlock = redFlags.some(flag => /statik|fundament|starke feuchtigkeit|asbest|altlast|ungeklärt|nicht genehmigt/i.test(flag));

  const kevinCreated = n(input.kevinMarketValueCreated);
  const returnOnKevin = kevinOpportunityCost > 0 ? kevinCreated / kevinOpportunityCost : null;

  let score = 50;
  score += clamp(flip.base / 2000, -25, 25);
  score += clamp(marginOfSafety * 100, -20, 20);
  score += clamp((netRentalYield - 0.04) * 400, -10, 10);
  score += clamp((holidayNetYield - netRentalYield) * 150, -5, 5);
  if (stressProfit > 0) score += 8; else score -= 12;
  score -= Math.min(25, redFlags.length * 4);
  if (hardBlock) score = Math.min(score, 49);
  score = Math.round(clamp(score, 0, 100));

  let recommendation = 'VERWERFEN';
  if (!hardBlock && score >= 90) recommendation = 'SOFORT PRÜFEN';
  else if (!hardBlock && score >= 80) recommendation = 'SEHR INTERESSANT';
  else if (!hardBlock && score >= 70) recommendation = 'INTERESSANT BEI PREISNACHLASS';
  else if (!hardBlock && score >= 60) recommendation = 'WATCHLIST';
  else if (score >= 40) recommendation = 'SCHWACH';

  const bestAnnualIncomeExit = holidayNet > rentalNOI ? 'FERIENVERMIETUNG' : 'DAUERVERMIETUNG';
  const annualIncomeAdvantage = Math.abs(holidayNet - rentalNOI);

  return {
    purchaseClosingCosts,
    totalProjectCost,
    flip,
    rental: { annualColdRent, effectiveRent, maintenance, noi: rentalNOI, grossYield: grossRentalYield, netYield: netRentalYield },
    holiday: { grossRevenue: holidayGross, netIncome: holidayNet, netYield: holidayNetYield },
    maximumPurchasePrice,
    marginOfSafety,
    stress: { salePrice: stressedSale, renovation: stressedRenovation, projectCost: stressedProjectCost, profit: stressProfit },
    fundingNetBenefit,
    kevinOpportunityCost,
    returnOnKevin,
    score,
    hardBlock,
    recommendation,
    bestAnnualIncomeExit,
    annualIncomeAdvantage,
    assumptions: [
      'Fördervorteile werden nur netto nach wirtschaftlichen Restriktionen berücksichtigt.',
      'Steuern auf Veräußerung oder laufende Einkünfte sind noch nicht individuell modelliert.',
      'Ferienvermietung setzt rechtliche Zulässigkeit voraus.',
      'Online-Daten ersetzen keine technische, rechtliche und steuerliche Due Diligence.'
    ]
  };
}
