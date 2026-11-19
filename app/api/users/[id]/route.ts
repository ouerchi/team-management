import { errorResponse } from "@/lib/errors";
import { deleteUser, getUser, updateUser } from "@/services/users";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const user = await getUser(id);
		return Response.json(user);
	} catch (error) {
		return errorResponse(error);
	}
}

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	let input: unknown;
	try {
		input = await request.json();
	} catch {
		return Response.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	try {
		const { id } = await params;
		const user = await updateUser(id, input);
		return Response.json(user);
	} catch (error) {
		return errorResponse(error);
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		await deleteUser(id);
		return new Response(null, { status: 204 });
	} catch (error) {
		return errorResponse(error);
	}
}
