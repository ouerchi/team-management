import { z } from "zod";

export const userSchema = z.strictObject({
	name: z.string().trim().min(1, "Name is required").max(100),
	email: z.email("Enter a valid email").max(250).transform(value => value.toLowerCase()),
	role: z.enum(["admin", "member"]),
	salary: z.string()
						.regex(/^(0|[1-9]\d{0,11})(\.\d{1,2})?$/, "Use a positive amount with at most 2 decimals"),
	startDate: z.iso.date("Enter a valid date (YYYY-MM-DD)")
					.refine(value => value >= "1900-01-01" && value <= new Date()
					.toISOString()
					.slice(0, 10), "Start date must be between 1900 and today"),
});

export const updateUserSchema = userSchema.partial()
								.refine(value => Object.keys(value).length > 0, "Provide at least one field");

export const idSchema = z.uuid("Invalid user ID");

export const querySchema = z.object({
	page: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).default(1),
	size: z.coerce.number().pipe(z.union([z.literal(10), z.literal(20), z.literal(50)])).default(10),
	role: z.enum(["admin", "member"]).optional(),
	search: z.string().trim().max(100).default(""),
});

export type UserInput = z.infer<typeof userSchema>;
export type ListQuery = z.infer<typeof querySchema>;
export type SearchParams = Record<string, string | string[] | undefined>;

// Pages recover from malformed URLs; API endpoints use strict querySchema.parse.
export function pageQuery(params: SearchParams): ListQuery {
	const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
	return {
		page: querySchema.shape.page.catch(1).parse(first(params.page)),
		size: querySchema.shape.size.catch(10).parse(first(params.size)),
		role: querySchema.shape.role.catch(undefined).parse(first(params.role)),
		search: querySchema.shape.search.catch("").parse(first(params.search)),
	};
}
