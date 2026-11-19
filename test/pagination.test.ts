import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { paginate } from "../lib/pagination";

function sourceWith(total: number) {
	const items = Array.from({ length: total }, (_, index) => ({ id: index + 1 }));
	return {
		count: async () => items.length,
		findMany: mock.fn(async ({ skip, take }: { skip: number; take: number }) =>
			items.slice(skip, skip + take),
		),
	};
}

describe("paginate", () => {
	it("clamps a page beyond the range to the last page", async () => {
		const source = sourceWith(23);
		const result = await paginate(source, 99, 10);

		assert.deepEqual(result, {
			items: [{ id: 21 }, { id: 22 }, { id: 23 }],
			page: 3, size: 10, total: 23, totalPages: 3,
		});
		assert.deepEqual(source.findMany.mock.calls[0].arguments, [{ skip: 20, take: 10 }]);
	});

	it("returns the remaining records on a partial last page", async () => {
		const result = await paginate(sourceWith(23), 3, 10);

		assert.equal(result.page, 3);
		assert.equal(result.totalPages, 3);
		assert.deepEqual(result.items, [{ id: 21 }, { id: 22 }, { id: 23 }]);
	});

	it("does not create an extra page for an exact multiple of the page size", async () => {
		const result = await paginate(sourceWith(20), 2, 10);

		assert.equal(result.totalPages, 2);
		assert.equal(result.items.length, 10);
		assert.equal(result.items[0].id, 11);
		assert.equal(result.items.at(-1)?.id, 20);
	});

	it("falls back to the first page for invalid page numbers", async () => {
		for (const page of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
			const result = await paginate(sourceWith(23), page, 10);
			assert.equal(result.page, 1);
			assert.equal(result.items[0].id, 1);
		}
	});

	it("returns an empty first page when there are no records", async () => {
		assert.deepEqual(await paginate(sourceWith(0), 99, 10), {
			items: [], page: 1, size: 10, total: 0, totalPages: 1,
		});
	});
});
