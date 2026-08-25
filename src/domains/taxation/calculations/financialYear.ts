/**
 * Indian Financial Year (April 1 to March 31) calculation helpers.
 */
export function getCurrentFinancialYear(date: Date = new Date()): { startYear: number; endYear: number; label: string } {
  const month = date.getMonth(); // 0-indexed (0 is Jan, 3 is Apr)
  const fullYear = date.getFullYear();

  const startYear = month >= 3 ? fullYear : fullYear - 1;
  const endYear = startYear + 1;
  const label = `FY ${startYear}-${String(endYear).slice(-2)}`;

  return { startYear, endYear, label };
}

export function isDateInFinancialYear(dateStr: string, startYear: number): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  const fyStart = new Date(startYear, 3, 1).getTime(); // Apr 1
  const fyEnd = new Date(startYear + 1, 2, 31, 23, 59, 59).getTime(); // Mar 31
  const time = date.getTime();
  return time >= fyStart && time <= fyEnd;
}
