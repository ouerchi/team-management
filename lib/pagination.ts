export type PaginationInfo = {
  page: number;
  size: number;
  total: number;
  totalPages: number;
};

export async function paginate<T>(
  source: {
    count: () => Promise<number>;
    findMany: (args: { skip: number; take: number }) => Promise<T[]>;
  },
  requestedPage = 1,
  requestedSize = 10,
): Promise<PaginationInfo & { items: T[] }> {
  const size = [10, 20, 50].includes(requestedSize) ? requestedSize : 10;
  const total = await source.count();
  const totalPages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(
    totalPages,
    Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  );
  const items = await source.findMany({
    skip: (page - 1) * size,
    take: size
  });

  return {
    items,
    page,
    size,
    total,
    totalPages
  };
}
