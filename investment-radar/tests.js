import { calculateInvestment } from './calculator.js';

const result = calculateInvestment({
  askingPrice: 180000,
  renovationLow: 25000,
  renovationBase: 35000,
  renovationHigh: 45000,
  holdingCosts: 6000,
  financingCosts: 8000,
  riskReserve: 10000,
  arvConservative: 285000,
  arvBase: 310000,
  arvOptimistic: 330000,
  monthlyColdRent: 1250,
  monthlyNonRecoverableCosts: 120,
  holidayNightRate: 120,
  holidayOccupancy: 0.48,
  holidayFixedAnnualCosts: 5000,
  kevinHours: 220,
  kevinOpportunityRate: 35,
  kevinMarketValueCreated: 40000,
  desiredFlipProfit: 35000,
  brokerRate: 0.0357
});

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(result.totalProjectCost.base > 180000, 'All-in costs must exceed asking price');
assert(Number.isFinite(result.maximumPurchasePrice), 'Maximum purchase price must be finite');
assert(Number.isFinite(result.flip.base), 'Base flip profit must be finite');
assert(result.rental.annualColdRent === 15000, 'Annual rent calculation failed');
assert(result.score >= 0 && result.score <= 100, 'Score out of range');

console.log('Investment engine sanity checks passed.');
console.log(JSON.stringify(result, null, 2));
