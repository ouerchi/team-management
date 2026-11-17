"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PaginationInfo } from "@/lib/pagination";

export function Pagination({ page, size, total, totalPages }: PaginationInfo) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const router = useRouter();

	// Page numbers to show: first, last, and the current page with its neighbours.
	// Example with page 5 of 10 → [1, 4, 5, 6, 10] (the "…" is added in the JSX)
	const candidates = [1, page - 1, page, page + 1, totalPages];
	const pages = [...new Set(candidates)]                         // remove duplicates
		.filter(value => value >= 1 && value <= totalPages)          // keep only real pages
		.sort((a, b) => a - b);                                      // ascending order

	// Build a link to another page. Other params (role, search…) are kept.
	function pageUrl(nextPage: number, nextSize = size) {
		const params = new URLSearchParams(searchParams.toString());
		params.set("page", String(nextPage));
		params.set("size", String(nextSize));
		return `${pathname}?${params.toString()}`;
	}

	return <> 
	<div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 p-4 text-sm">
		<span className="text-slate-500">{total === 0 ? "No results" : `${(page - 1) * size + 1}–${Math.min(page * size, total)} of ${total}`}</span>
		<nav aria-label="Pagination" className="flex items-center gap-1">
			<span className="mr-2 text-slate-500">Page {page} of {totalPages}</span>
			{page > 1 && <Link className="page-link" href={pageUrl(page - 1)}>Previous</Link>}
			{pages.map((value, index) => <span key={value} className="flex items-center gap-1">
				{index > 0 && value - pages[index - 1] > 1 && <span className="px-2">…</span>}
				<Link className={`page-link ${value === page ? "active" : ""}`} aria-current={value === page ? "page" : undefined} href={pageUrl(value)}>{value}</Link>
			</span>)}
		{page < totalPages && <Link className="page-link" href={pageUrl(page + 1)}>Next</Link>}
		</nav>
		<label className="flex items-center gap-2 text-slate-500">Rows per page
			<select aria-label="Rows per page" value={size} onChange={event => router.push(pageUrl(1, Number(event.target.value)))} className="w-auto! py-1!">
				{[10, 20, 50].map(value => <option key={value}>{value}</option>)}
			</select>
		</label>
	</div>
	</>;
}