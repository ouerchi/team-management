"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRecord } from "@/services/users";
import { UserForm } from "./user-form";

type UserActionsProps = {
	user: UserRecord;
};

export function UserActions({ user }: UserActionsProps) {
	const router = useRouter();
	const dialogRef = useRef<HTMLDialogElement>(null);
	const dialogTitleId = `edit-${user.id}`;

	const [editing, setEditing] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState("");

	// Mount a fresh form each time the edit dialog opens.
	function openEditDialog() {
		setEditing(true);
		dialogRef.current?.showModal();
	}

	function closeEditDialog() {
		dialogRef.current?.close();
	}

	async function handleDelete() {
		if (!window.confirm(`Delete ${user.name}?`)) 
			return;
		setDeleting(true);
		setError("");
		try {
	  		const response = await fetch(`/api/users/${user.id}`, {
				method: "DELETE",
	  		});
			if (!response.ok) {
				const result = await response.json();
				throw new Error(result.error);
			}
			// Refresh the server-rendered list and statistics after deleting.
			router.refresh();
		} catch (error) {
			setError(error instanceof Error ? error.message : "Could not delete user");
		} finally {
			setDeleting(false);
		}
	}

	return (
	<>
	  <div className="flex justify-end gap-3">
		<button
		  className="text-indigo-700 hover:underline"
		  aria-label={`Edit ${user.name}`}
		  onClick={openEditDialog}
		>
		  Edit
		</button>
		<button
		  className="text-red-700 hover:underline disabled:opacity-50"
		  disabled={deleting}
		  aria-label={`Delete ${user.name}`}
		  onClick={handleDelete}
		>
		  {deleting ? "Deleting…" : "Delete"}
		</button>
	  </div>

	  {error && (
		<p role="alert" className="text-red-700">
		  {error}
		</p>
	  )}

	  <dialog
		ref={dialogRef}
		onClose={() => setEditing(false)}
		aria-labelledby={dialogTitleId}
		className="m-auto w-[min(95vw,560px)] rounded-xl border border-slate-200 p-6 shadow-xl backdrop:bg-slate-900/40"
	  >
		<h2 id={dialogTitleId} className="mb-5 text-xl font-semibold">
		  Edit user
		</h2>
		{editing && <UserForm user={user} onClose={closeEditDialog} />}
	  </dialog>
	</>
	);
}
