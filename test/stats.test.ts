import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateStats, totalSeniorityMonths } from "../lib/stats";

describe("calculateStats", () => {
	it("rounds an average salary halfway up to two decimal places", () => {
		assert.deepEqual(calculateStats({ count: 2, totalSalary: "20.01", totalMonths: 59 }), {
			count: 2,
			totalSalary: "20.01",
			averageSalary: "10.01",
			averageSeniority: { years: 2, months: 5 },
		});
	});

	it("rounds a repeating average down when the next digit is below five", () => {
		const stats = calculateStats({ count: 3, totalSalary: "10.00", totalMonths: 0 });
		assert.equal(stats.averageSalary, "3.33");
	});

	it("keeps large monetary amounts exact", () => {
		const stats = calculateStats({ count: 2, totalSalary: "1999999999999.99", totalMonths: 0 });
		assert.equal(stats.totalSalary, "1999999999999.99");
		assert.equal(stats.averageSalary, "1000000000000.00");
	});

	it("returns zero salaries and seniority for an empty list", () => {
		const totalMonths = totalSeniorityMonths([], new Date("2025-06-15T00:00:00Z"));
		assert.equal(totalMonths, 0);
		assert.deepEqual(calculateStats({ count: 0, totalSalary: "0", totalMonths }), {
			count: 0,
			totalSalary: "0.00",
			averageSalary: "0.00",
			averageSeniority: { years: 0, months: 0 },
		});
	});
});

describe("totalSeniorityMonths", () => {
	it("counts only completed months and weights groups by their user count", () => {
		const today = new Date("2025-06-15T00:00:00Z");
		assert.equal(totalSeniorityMonths([
			{ startDate: new Date("2024-06-15T00:00:00Z"), count: 2 },
			{ startDate: new Date("2025-05-16T00:00:00Z"), count: 1 },
			{ startDate: new Date("2026-01-01T00:00:00Z"), count: 1 },
		], today), 24);
	});
});
