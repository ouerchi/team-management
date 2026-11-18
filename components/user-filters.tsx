"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useSearchParams, useRouter } from "next/navigation"

const SEARCH_DEBOUNCE_MS = 300;

export default function UserFilters({
	search,
	role,
}: {
	search: string;
	role?: string
}){
	const [searchText, setSearchText] = useState(search);
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();

	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	function cancelPendingSearch() {
		if (debounceTimer.current) 
			clearTimeout(debounceTimer.current);
		debounceTimer.current = null;
	}

	// History navigation restores the URL's search and discards pending typing.
	// Search responses must not reset the draft: the user may have typed more
	// while an earlier search was loading.
	useEffect(() => {
		function restoreSearchFromHistory() {
			cancelPendingSearch();
			const value = new URLSearchParams(window.location.search).get("search")?.trim() ?? "";
			setSearchText(value.length <= 100 ? value : "");
		}

		window.addEventListener("popstate", restoreSearchFromHistory);
		return () => {
			cancelPendingSearch();
			window.removeEventListener("popstate", restoreSearchFromHistory);
		};
	}, []);

	// Set a param, or remove it when the value is empty
	function setOrDelete(query: URLSearchParams, key: string, value: string) {
		if (value) 
			query.set(key, value);
		else 
			query.delete(key);
	}

	// Update the URL. Other params are kept, and the page always goes back to 1.
	function updateUrl(changes: { search?: string; role?: string }) {
		const query = new URLSearchParams(params.toString());
		query.set("page", "1");

		if (changes.search !== undefined) 
			setOrDelete(query, "search", changes.search);
		if (changes.role !== undefined) 
			setOrDelete(query, "role", changes.role);

		router.replace(`${pathname}?${query}`, { scroll: false });
	}

	// Typing: update the input right away, update the URL after 300ms of silence
	function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
		const text = event.target.value;
		setSearchText(text);
		cancelPendingSearch();
		debounceTimer.current = setTimeout(() => {
			debounceTimer.current = null;
			updateUrl({ search: text });
		}, SEARCH_DEBOUNCE_MS);
	}

	// Role change: update the URL immediately, together with the current search text
	function handleRoleChange(event: React.ChangeEvent<HTMLSelectElement>) {
		cancelPendingSearch();
		updateUrl({ role: event.target.value, search: searchText });
	}

	return <>
		<div className="flex flex-wrap items-end gap-4">
		<label className="min-w-48 flex-1">
			<p>Search by name</p>
			<input type="search" value={searchText} maxLength={100} placeholder="Search users…" onChange={handleSearchChange} />
		</label>
		<label className="w-44">
			Role
			<select value={role ?? ""} onChange={handleRoleChange}>
				<option value="">All roles</option>
				<option value="admin">Admin</option>
				<option value="member">Member</option>
			</select>
		</label>
		</div>
	</>;
}
