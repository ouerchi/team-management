"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { userSchema, type UserInput } from "@/lib/validation";
import type { UserRecord } from "@/services/users";

	const emptyUser: UserInput = { name: "", email: "", role: "member", salary: "", startDate: "" };

	// Text-like inputs, rendered in a loop below. Role is a <select>, so it is written by hand.
	const FIELDS = [
	["name", "Name", "text"],
	["email", "Email", "email"],
	["salary", "Salary", "text"],
	["startDate", "Start date", "date"],
	] as const;

	export function UserForm({ user, onClose }: { user?: UserRecord; onClose?: () => void }) {
	const isEditing = !!user;
	const router = useRouter();

	// Form state: the values, which fields the user has touched, and the save status
	const [values, setValues] = useState<UserInput>(
		user
		? { name: user.name, email: user.email, role: user.role, salary: user.salary, startDate: user.startDate }
		: emptyUser
	);
	const [touched, setTouched] = useState<Set<string>>(new Set());
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState("");
	const [success, setSuccess] = useState(false);

	// Live validation: the same zod schema as the server, re-run on every render
	const validation = userSchema.safeParse(values);
	const errors = validation.success ? {} : validation.error.flatten().fieldErrors;

	// Unique ids, so several edit forms on one page don't clash
	const prefix = user?.id ?? "new";

	function markTouched(name: string) {
		setTouched(previous => new Set(previous).add(name));
	}

	// Update one field. Its error only shows after the user has touched it.
	function field(name: keyof UserInput, value: string) {
		setValues(previous => ({ ...previous, [name]: value }));
		markTouched(name);
		setMessage("");
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		setTouched(new Set(Object.keys(values))); // show every error at once
		if (!validation.success || saving) return;

		setSaving(true);
		setMessage("");
		setSuccess(false);
		try {
		const response = await fetch(isEditing ? `/api/users/${user.id}` : "/api/users", {
			method: isEditing ? "PATCH" : "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validation.data),
		});
		const result = await response.json();
		if (!response.ok) throw new Error(result.error || "Could not save user");

		setSuccess(true);
		setMessage(isEditing ? "User updated." : "User created.");
		if (!isEditing) {
			setValues(emptyUser); // ready for the next user
			setTouched(new Set());
		}
		router.refresh(); // reload the server data (list and stats)
		} catch (err) {
		setMessage(err instanceof Error ? err.message : "Could not save user");
		} finally {
		setSaving(false);
		}
	}

  return <>
	<form noValidate onSubmit={handleSubmit} className="space-y-4">
    <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
      {FIELDS.map(([name, label, type]) => {
        const error = touched.has(name) ? errors[name]?.[0] : undefined;
        return <label key={name} htmlFor={`${prefix}-${name}`}>{label}
          <input id={`${prefix}-${name}`} type={type} value={values[name]} inputMode={name === "salary" ? "decimal" : undefined} placeholder={name === "salary" ? "50000.00" : undefined} onChange={event => field(name, event.target.value)} onBlur={() => markTouched(name)} aria-invalid={!!error} aria-describedby={error ? `${prefix}-${name}-error` : undefined} />
          {error && <span id={`${prefix}-${name}-error`} className="mt-1 block text-xs text-red-700">{error}</span>}
        </label>;
      })}
      <label>Role<select value={values.role} onChange={event => field("role", event.target.value)}><option value="member">Member</option><option value="admin">Admin</option></select></label>
    </fieldset>
    <div className="flex items-center gap-3">
      <button className="button-primary" disabled={saving} type="submit">{saving ? "Saving…" : user ? "Save changes" : "Create user"}</button>
      {onClose && <button className="button-secondary" type="button" disabled={saving} onClick={onClose}>Close</button>}
    </div>
    {message && <p role={success ? "status" : "alert"} className={`text-sm ${success ? "text-emerald-700" : "text-red-700"}`}>{message}</p>}
  </form>
  </>;
}