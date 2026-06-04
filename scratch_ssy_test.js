import { getSSYEffectiveValue, getSSYInvestedAmount, calculateSSYMaturityWithRates } from './src/utils/ssyUtils.ts';

const account = {
  "id": "802c07b9-b1ce-4ee6-a582-d5c98eceb757",
  "portfolio_id": "6327ec34-2fac-49f9-899c-c4015d8e190e",
  "bank_name": "SBI",
  "girl_dob": "2023-11-25",
  "annual_deposit": 150000,
  "interest_rate": 8.2,
  "start_date": "2024-01-15",
  "maturity_date": "2045-01-15",
  "maturity_amount": 7769483.02,
  "status": "active",
  "contributions": [
    { "date": "2024-01-14", "amount": 150000 },
    { "date": "2024-04-01", "amount": 150000 },
    { "date": "2025-04-01", "amount": 150000 },
    { "date": "2026-06-04", "amount": 150000 }
  ],
  "rate_schedule": []
};

const invested = getSSYInvestedAmount(account);
const val = getSSYEffectiveValue(account, new Date('2026-06-05'));
const maturity = calculateSSYMaturityWithRates(
  account.start_date,
  account.annual_deposit,
  account.contributions,
  account.rate_schedule,
  account.interest_rate
);

console.log("Invested:", invested);
console.log("Valuation (as of 2026-06-05):", val);
console.log("Yearly breakdown in simulation:");
console.log(JSON.stringify(maturity.yearlyBreakdown.slice(0, 5), null, 2));
