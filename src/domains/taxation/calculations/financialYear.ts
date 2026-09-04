/**
 * Indian Fiscal Year (April 1 to March 31) classification and date utilities.
 *
 * In India, the financial year runs from April 1 of year N to March 31 of year N+1.
 * Example:
 * - 2024-07-23 falls in FY 2024-25
 * - 2024-02-15 falls in FY 2023-24
 */

export interface FinancialYearInfo {
  financialYear: string; // e.g. "FY 2024-25"
  startYear: number;
  endYear: number;
  startDate: Date;
  endDate: Date;
}

export function getFinancialYear(date: Date = new Date()): FinancialYearInfo {
  const month = date.getMonth(); // 0 = Jan, 3 = Apr, 11 = Dec
  const year = date.getFullYear();

  // If month is Jan (0), Feb (1), or Mar (2), the fiscal year started April 1 of the previous calendar year
  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;

  const startDate = new Date(startYear, 3, 1, 0, 0, 0, 0); // April 1 00:00:00
  const endDate = new Date(endYear, 2, 31, 23, 59, 59, 999); // March 31 23:59:59.999

  const shortEndYear = String(endYear).slice(-2);
  const financialYear = `FY ${startYear}-${shortEndYear}`;

  return {
    financialYear,
    startYear,
    endYear,
    startDate,
    endDate,
  };
}

export function getFinancialYearString(date: Date = new Date()): string {
  return getFinancialYear(date).financialYear;
}

export function isDateInFinancialYear(date: Date, fy: FinancialYearInfo): boolean {
  const time = date.getTime();
  return time >= fy.startDate.getTime() && time <= fy.endDate.getTime();
}
