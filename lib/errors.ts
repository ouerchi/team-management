import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";

export class UserNotFoundError extends Error {
  constructor() {
    super("User not found");
    this.name = "UserNotFoundError";
  }
}

export function errorResponse(error: unknown) {
  if (
    error instanceof UserNotFoundError ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025")
  ) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (error instanceof ZodError) {
    return Response.json(
      { error: "Invalid input", issues: error.issues },
      { status: 400 },
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return Response.json(
      { error: "A user with this email already exists" },
      { status: 409 },
    );
  }

  console.error("User request failed:", error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
