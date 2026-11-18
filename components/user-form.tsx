"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { userSchema, type UserInput } from "@/lib/validation";
import type { UserRecord } from "@/services/users";

type UserFormProps = {
	user?: UserRecord;
	onClose?: () => void;
};

const emptyUser: UserInput = {
	name: "",
	email: "",
	role: "member",
	salary: "",
	startDate: "",
};

// Role uses a select; the other fields share the same input markup.
const FIELDS = [
	["name", "Name", "text"],
	["email", "Email", "email"],
	["salary", "Salary", "text"],
	["startDate", "Start date", "date"],
] as const;

export function UserForm({ user, onClose }: UserFormProps) {
	const router = useRouter();
	const isEditing = !!user;
	const prefix = user?.id ?? "new";

	const [values, setValues] = useState<UserInput>(
		user
			? {
					name: user.name,
					email: user.email,
					role: user.role,
					salary: user.salary,
					startDate: user.startDate,
				}
			: emptyUser
	);
	const [touched, setTouched] = useState<Set<string>>(new Set());
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState("");
	const [success, setSuccess] = useState(false);

	// Validate every render, but only display errors for touched fields.
	const validation = userSchema.safeParse(values);
	const errors = validation.success
		? {}
		: validation.error.flatten().fieldErrors;

	function markTouched(name: string) {
		setTouched(previous => new Set(previous).add(name));
	}

	function updateField(name: keyof UserInput, value: string) {
		setValues(previous => ({ ...previous, [name]: value }));
		markTouched(name);
		setMessage("");
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		// Submitting reveals errors even for fields the user has not visited.
		setTouched(new Set(Object.keys(values)));
		if (!validation.success || saving) 
			return;

		setSaving(true);
		setMessage("");
		setSuccess(false);

		try {
			const url = isEditing ? `/api/users/${user.id}` : "/api/users";
			const response = await fetch(url, {
				method: isEditing ? "PATCH" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(validation.data),
			});
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Could not save user");
			}

			setSuccess(true);
			setMessage(isEditing ? "User updated." : "User created.");

			if (!isEditing) {
				setValues(emptyUser);
				setTouched(new Set());
			}

			// Refresh the server-rendered list and statistics after saving.
			router.refresh();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Could not save user");
		} finally {
			setSaving(false);
		}
	}

	return (
		<form noValidate onSubmit={handleSubmit} className="space-y-4">
			<fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
				{FIELDS.map(([name, label, type]) => {
					const inputId = `${prefix}-${name}`;
					const errorId = `${inputId}-error`;
					const error = touched.has(name) ? errors[name]?.[0] : undefined;

					return (
						<label key={name} htmlFor={inputId}>
							{label}
							<input
								id={inputId}
								type={type}
								value={values[name]}
								inputMode={name === "salary" ? "decimal" : undefined}
								placeholder={name === "salary" ? "50000.00" : undefined}
								onChange={event => updateField(name, event.target.value)}
								onBlur={() => markTouched(name)}
								aria-invalid={!!error}
								aria-describedby={error ? errorId : undefined}
							/>
							{error && (
								<span
									id={errorId}
									className="mt-1 block text-xs text-red-700"
								>
									{error}
								</span>
							)}
						</label>
					);
				})}

				<label>
					Role
					<select
						value={values.role}
						onChange={event => updateField("role", event.target.value)}
					>
						<option value="member">Member</option>
						<option value="admin">Admin</option>
					</select>
				</label>
			</fieldset>

			<div className="flex items-center gap-3">
				<button className="button-primary" disabled={saving} type="submit">
					{saving ? "Saving…" : isEditing ? "Save changes" : "Create user"}
				</button>
				{onClose && (
					<button
						className="button-secondary"
						type="button"
						disabled={saving}
						onClick={onClose}
					>
						Close
					</button>
				)}
			</div>

			{message && (
				<p
					role={success ? "status" : "alert"}
					className={`text-sm ${success ? "text-emerald-700" : "text-red-700"}`}
				>
					{message}
				</p>
			)}
		</form>
	);
}
