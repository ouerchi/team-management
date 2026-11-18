"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PaginationInfo } from "@/lib/pagination";

const PAGE_SIZES = [10, 20, 50];

function getVisiblePages(page: number, totalPages: number) : number[] {
	const candidates = [1, page - 1, page, page + 1, totalPages];
	return[...new Set(candidates)]
		.filter(value => value >= 1 && value <= totalPages)
		.sort((a, b) => a - b);   
}

function getRangeLabel(page: number, size: number, total: number) : string {
	if (total === 0)
		return "No result";
	const first = (page - 1) * size + 1;
	const last = Math.min(page * size, total);
	return `${first}-${last} of ${total}`;
}

export function Pagination({ page, size, total, totalPages }: PaginationInfo) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const router = useRouter();

	const pages = getVisiblePages(page, totalPages);
	const rangeLabel = getRangeLabel(page, size, total);
	const hasPrevious = page > 1;
	const hasNext = page < totalPages;

	// Build a link to another page. Other params (role, search…) are kept.
	function pageUrl(nextPage: number, nextSize = size) {
		const params = new URLSearchParams(searchParams.toString());
		params.set("page", String(nextPage));
		params.set("size", String(nextSize));
		return `${pathname}?${params.toString()}`;
	}

	function handleSizeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    	router.push(pageUrl(1, Number(event.target.value)));
  	}

	return (
		<div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 p-4 text-sm">
			<span className="text-slate-500">{rangeLabel}</span>

			<nav aria-label="Pagination" className="flex items-center gap-1">
				<span className="mr-2 text-slate-500">Page {page} of {totalPages}</span>

				{hasPrevious && <Link className="page-link" href={pageUrl(page - 1)}>Previous</Link>}

				{pages.map((value, index) => {
				const isCurrent = value === page;
				const hasGapBefore = index > 0 && value - pages[index - 1] > 1; // show "…" for skipped pages

				return (
					<span key={value} className="flex items-center gap-1">
						{hasGapBefore && <span className="px-2">…</span>}
						<Link
							className={`page-link ${isCurrent ? "active" : ""}`}
							aria-current={isCurrent ? "page" : undefined}
							href={pageUrl(value)}
						>
							{value}
						</Link>
						</span>
					);
				})}

				{hasNext && <Link className="page-link" href={pageUrl(page + 1)}>Next</Link>}
			</nav>

			<label className="flex items-center gap-2 text-slate-500">Rows per page
				<select aria-label="Rows per page" value={size} onChange={handleSizeChange} className="w-auto! py-1!">
					{PAGE_SIZES.map(value => <option key={value}>{value}</option>)}
				</select>
			</label>
		</div>
	);
}