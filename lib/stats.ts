import Decimal from "decimal.js";

const D = Decimal.clone({ precision: 40 });

function monthsBetween(start: Date, today: Date): number {
  let months =
    (today.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    today.getUTCMonth() - start.getUTCMonth();
  if (today.getUTCDate() < start.getUTCDate()) 
	months -= 1; // month not completed yet
  return Math.max(0, months); // future start date counts as 0
}

// groups come from the database (one row per distinct startDate with its count)
export function totalSeniorityMonths(
  groups: { startDate: Date; count: number }[],
  today = new Date()
): number {
  return groups.reduce((sum, g) => sum + monthsBetween(g.startDate, today) * g.count, 0);
}

export function calculateStats(input: { count: number; totalSalary: string; totalMonths: number }) {
  const { count, totalSalary, totalMonths } = input;
  const total = new D(totalSalary);
  const avgMonths = count ? Math.floor(totalMonths / count) : 0;

  return {
    count,
    totalSalary: total.toFixed(2, D.ROUND_HALF_UP),
    averageSalary: (count ? total.div(count) : total).toFixed(2, D.ROUND_HALF_UP),
    averageSeniority: { years: Math.floor(avgMonths / 12), months: avgMonths % 12 },
  };
}