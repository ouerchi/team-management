"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRecord } from "@/services/users";
import { UserForm } from "./user-form";

export function UserActions({ user }: { user: UserRecord }) {
	const dialog = useRef<HTMLDialogElement>(null);
	const [editing, setEditing] = useState(false);   // true while the edit dialog is open
	const [deleting, setDeleting] = useState(false); // true while the DELETE request runs
	const [error, setError] = useState("");
	const router = useRouter();

	// Open the edit dialog. The form is only rendered while "editing" is true,
	// so it starts fresh with the user's current data each time.
	function openEditDialog() {
		setEditing(true);
		dialog.current?.showModal();
	}

	// Ask for confirmation, call the API, then refresh the list
	async function handleDelete() {
		if (!window.confirm(`Delete ${user.name}?`)) return;

		setDeleting(true);
		setError("");
		try {
		const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
		if (!response.ok) throw new Error((await response.json()).error);
		router.refresh(); // reload the server data (list and stats)
		} catch (err) {
		setError(err instanceof Error ? err.message : "Could not delete user");
		} finally {
		setDeleting(false);
		}
	}

  	return <>
    	<div className="flex justify-end gap-3">
      		<button className="text-indigo-700 hover:underline" aria-label={`Edit ${user.name}`} onClick={openEditDialog}>Edit</button>
      		<button className="text-red-700 hover:underline disabled:opacity-50" disabled={deleting} aria-label={`Delete ${user.name}`} onClick={handleDelete}>{deleting ? "Deleting…" : "Delete"}</button>
    	</div>
    	{error && <p role="alert" className="text-red-700">{error}</p>}
    	<dialog ref={dialog} onClose={() => setEditing(false)} aria-labelledby={`edit-${user.id}`} className="m-auto w-[min(95vw,560px)] rounded-xl border border-slate-200 p-6 shadow-xl backdrop:bg-slate-900/40">
      	<h2 id={`edit-${user.id}`} className="mb-5 text-xl font-semibold">Edit user</h2>
      	{editing && <UserForm user={user} onClose={() => dialog.current?.close()} />}
    	</dialog>
  	</>;
}