import { errorResponse } from "@/lib/errors";
import { querySchema } from "@/lib/validation";
import { createUser, listUsers } from "@/services/users";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const query = querySchema.parse(Object.fromEntries(params));
    const result = await listUsers(query);

    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const user = await createUser(input);
    return Response.json(user, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
