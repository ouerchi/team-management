import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { after, before, it } from "node:test";
import { Client } from "pg";
import type { UserRecord } from "../services/users";

// Never use DATABASE_URL here: tests create and drop their own temporary database.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const admin = new Client({
  connectionString: testDatabaseUrl,
  connectionTimeoutMillis: 5_000,
});
const databaseName = `team_test_${randomUUID().replaceAll("-", "")}`;
let databaseCreated = false;
let db: typeof import("../lib/db").db | undefined;
let collection: typeof import("../app/api/users/route");
let individual: typeof import("../app/api/users/[id]/route");
const previousDatabaseUrl = process.env.DATABASE_URL;

before(async () => {
  if (!testDatabaseUrl) {
    throw new Error(
      "Set TEST_DATABASE_URL to a PostgreSQL connection URL with permission to create and drop test databases.",
    );
  }

  try {
    await admin.connect();
  } catch (error) {
    throw new Error(
      "Cannot connect to test PostgreSQL. Check TEST_DATABASE_URL and ensure PostgreSQL is running.",
      { cause: error },
    );
  }

  // databaseName contains only a fixed prefix and UUID hex characters.
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  databaseCreated = true;
  const url = new URL(testDatabaseUrl);
  url.pathname = `/${databaseName}`;
  process.env.DATABASE_URL = url.toString();

  const migrationClient = new Client({ connectionString: url.toString() });
  try {
    await migrationClient.connect();
    const migrationsDirectory = new URL("../prisma/migrations/", import.meta.url);
    const entries = await readdir(migrationsDirectory, { withFileTypes: true });
    for (const name of entries.filter(entry => entry.isDirectory()).map(entry => entry.name).sort()) {
      const sql = await readFile(new URL(`${name}/migration.sql`, migrationsDirectory), "utf8");
      await migrationClient.query(sql);
    }
  } finally {
    await migrationClient.end();
  }

  // Import after assigning the isolated URL, before lib/db creates its client.
  ({ db } = await import("../lib/db"));
  collection = await import("../app/api/users/route");
  individual = await import("../app/api/users/[id]/route");
}, { timeout: 30_000 });

after(async () => {
  try {
    await db?.$disconnect();
  } finally {
    try {
      if (databaseCreated) {
        await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
      }
    } finally {
      await admin.end();
      if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousDatabaseUrl;
    }
  }
});

function request(method: string, path: string, body?: unknown) {
  return new Request(`http://localhost/api/users${path}`, {
    method,
    ...(body === undefined ? {} : {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
}

it("creates, reads, updates and deletes a user; returns 409 for duplicates and 404 after deletion", { timeout: 30_000 }, async () => {
  const input = {
    name: "API Test User",
    email: "API.Test@Example.com",
    role: "member",
    salary: "5000.50",
    startDate: "2024-01-15",
  };

  const createdResponse = await collection.POST(request("POST", "", input));
  assert.equal(createdResponse.status, 201);
  const created: UserRecord = await createdResponse.json();
  assert.match(created.id, /^[0-9a-f-]{36}$/i);
  assert.equal(created.name, input.name);
  assert.equal(created.email, "api.test@example.com");
  assert.equal(created.role, "member");
  assert.equal(created.salary, "5000.50");
  assert.equal(created.startDate, input.startDate);
  assert.ok(Number.isFinite(Date.parse(created.createdAt)));

  const path = `/${created.id}`;
  const context = { params: Promise.resolve({ id: created.id }) };
  const readResponse = await individual.GET(request("GET", path), context);
  assert.equal(readResponse.status, 200);
  assert.deepEqual(await readResponse.json(), created);

  const duplicateResponse = await collection.POST(request("POST", "", {
    ...input, email: "api.test@example.com",
  }));
  assert.equal(duplicateResponse.status, 409);
  assert.deepEqual(await duplicateResponse.json(), {
    error: "A user with this email already exists",
  });

  const changes = { name: "Updated API User", salary: "6200.75", role: "admin" };
  const updatedResponse = await individual.PATCH(request("PATCH", path, changes), context);
  assert.equal(updatedResponse.status, 200);
  const updated = { ...created, ...changes };
  assert.deepEqual(await updatedResponse.json(), updated);

  const persistedResponse = await individual.GET(request("GET", path), context);
  assert.equal(persistedResponse.status, 200);
  assert.deepEqual(await persistedResponse.json(), updated);

  const deletedResponse = await individual.DELETE(request("DELETE", path), context);
  assert.equal(deletedResponse.status, 204);
  assert.equal(await deletedResponse.text(), "");

  for (const response of [
    await individual.GET(request("GET", path), context),
    await individual.PATCH(request("PATCH", path, { name: "Missing" }), context),
    await individual.DELETE(request("DELETE", path), context),
  ]) {
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "User not found" });
  }
});
