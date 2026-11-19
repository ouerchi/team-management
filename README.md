# Team Directory

A full-stack assignment built with Next.js App Router, TypeScript, Prisma, PostgreSQL, Zod, Tailwind CSS, and decimal.js. It provides a user directory with CRUD operations, URL-based filters, reusable pagination, and statistics across all matching users.

- **Source code:** [GitHub repository](https://github.com/ouerchi/team-management)
- **Live application:** [Team Directory on Vercel](https://team-management-ten-beta.vercel.app/)

## Run with Docker

Install Docker with the Docker Compose plugin and start the Docker daemon. From the repository root, run:

```bash
docker compose up
```

No local Node.js, npm, or PostgreSQL installation is needed. An `.env` file is optional for this Docker setup: Compose includes public defaults for local development.

The first startup builds the application image. The startup sequence is:

1. Start PostgreSQL 16 and wait for its health check.
2. Start the app container and apply the committed Prisma migrations.
3. Run the seed script, adding 72 sample users and three sample projects to an empty database.
4. Start the Next.js production server.

Once startup finishes, open:

- [Users](http://localhost:3000/users)
- [Projects](http://localhost:3000/projects)

The root URL redirects to `/users`. PostgreSQL is also accessible from the host at `localhost:5433`; inside Compose, the app connects to `db:5432`.

Useful commands:

```bash
# Rebuild after changing the application source.
docker compose up --build

# Run in the background.
docker compose up -d

# Follow application logs.
docker compose logs -f app

# Stop and remove containers, preserving database data.
docker compose down
```

PostgreSQL data lives in the named `postgres_data` volume. Startup runs migrations and seeding again, but existing seed users are skipped by unique email and existing seed projects by fixed ID. It does not overwrite their edited values. Deleted seed records are added again on the next seed run.

### Environment configuration

For custom local settings, copy the example before starting Compose:

```bash
cp .env.example .env
```

The example documents `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and a host-side `DATABASE_URL`. Compose constructs its own container-side database URL from the PostgreSQL variables.

The supplied credentials are public local demo values, not production credentials. `.env` files are excluded from Git and the Docker build context, except for `.env.example`. Changing PostgreSQL initialization variables does not update credentials in an already initialized data volume.

## What is implemented

| Assignment area | Implementation |
| --- | --- |
| User model | UUID, name, unique email, admin/member role, decimal salary, start date, and creation timestamp. |
| CRUD API | All five required endpoints, with thin Route Handlers calling `services/users.ts`. |
| Validation and errors | Shared Zod schemas; invalid JSON or input returns `400`, a valid but missing user ID returns `404`, and duplicate email returns `409`. |
| Reusable pagination | Generic server `paginate()` and client `<Pagination />`, reused on `/users` and `/projects`. Sizes are 10, 20, and 50, with page links. |
| Database paging | PostgreSQL performs the count and Prisma uses `skip`/`take`; user rows are not loaded in full and sliced in JavaScript. |
| URL state | Page, size, role, and name search are stored in the URL. Malformed page values fall back to page 1; pages beyond the available range show the last page. |
| Search | Case-insensitive name filtering with a 300 ms debounce. Filter changes reset the page to 1. |
| Create and edit | One Client Component for both modes, live validation, field errors, disabled controls during saving, API error feedback, and a refreshed list after saving. Successful edits close the dialog. |
| Delete | Confirmation, a pending state, API error feedback, and a refreshed list after deletion. |
| Filtered statistics | User count, total salary, average salary, and average seniority across all matching users, not just the visible page. |
| Money | PostgreSQL `Decimal`, decimal.js calculations, half-up rounding to two decimals, and salary strings in JSON. |
| Loading behavior | Statistics and table have separate Suspense boundaries. Filters stay mounted, and stable boundaries allow existing results to stay visible during search navigation. |
| Tests | Pagination and statistics unit tests, plus a database-backed Route Handler integration test for CRUD, `404`, and `409`. |
| Docker | App Dockerfile, PostgreSQL and app Compose services, health check, persistent data, startup migrations, and seed data. |

### API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/users` | List filtered users with pagination and statistics. |
| `GET` | `/api/users/[id]` | Read one user. |
| `POST` | `/api/users` | Create a user; returns `201`. |
| `PATCH` | `/api/users/[id]` | Update one or more user fields. |
| `DELETE` | `/api/users/[id]` | Delete a user; returns `204`. |

Example list request:

```text
/api/users?page=2&size=20&role=admin&search=alice
```

Example create body:

```json
{
  "name": "Alice Martin",
  "email": "alice@example.com",
  "role": "member",
  "salary": "5000.50",
  "startDate": "2024-01-15"
}
```

API query validation is strict and returns `400` for malformed values. The HTML pages recover from malformed URL values instead, so manually editing a page URL does not crash the page. An invalid UUID returns `400`; a valid UUID that does not exist returns `404`.

## Why code runs on the server or client

| Code | Location | Reason |
| --- | --- | --- |
| `app/users/page.tsx` | Server | Reads and validates URL parameters and starts the database request without exposing database credentials to the browser. |
| `components/user-results.tsx` | Server | Awaits the shared result and renders statistics, table rows, and pagination props. The page shares one result promise between statistics and the table. |
| `app/projects/page.tsx` | Server | Loads the second paginated list directly from PostgreSQL using the same pagination helper. |
| `app/api/users/**/route.ts` | Server | Handles HTTP requests, parses JSON and parameters, calls the service, and maps errors to HTTP responses. |
| `services/users.ts` and `lib/db.ts` | Server | Own database access, input validation, filtering, transactions, and serialization. Server Components call the service directly rather than making HTTP calls to their own API. |
| `lib/pagination.ts` | Server usage | Calculates the valid page and delegates counting and retrieval to database functions. It is independent of a specific model. |
| `components/user-filters.tsx` | Client | Needs typing state, event handlers, a debounce timer, browser history handling, and router navigation. Input state updates immediately while URL updates are debounced. |
| `components/pagination.tsx` | Client | Provides page navigation and handles page-size selection while preserving the current URL filters. |
| `components/user-form.tsx` | Client | Needs controlled inputs, live validation, touched-field state, asynchronous submission, save feedback, and `router.refresh()`. |
| `components/user-action.tsx` | Client | Uses click handlers, the browser dialog API, delete confirmation, and request state. |
| `lib/validation.ts` | Shared | The form and server use the same validation rules. Browser validation improves feedback; server validation remains necessary for every request. |
| `lib/stats.ts` | Pure functions, called on the server | Calculates results from supplied totals and dates without accessing the database, making the calculations easy to unit test. |

The URL is the source of truth for committed filters and pagination. Local search state holds text while the user types. Updating the URL triggers server data loading; it does not require replacing the input DOM element. The client forms use the API for writes, then refresh server-rendered content.

### Statistics and consistency

`listUsers()` uses one `RepeatableRead` transaction for the filtered count, page of users, salary sum, and start-date groups. All reads use the same database snapshot, so concurrent edits do not mix a count from one state with a salary total from another.

- Total salary is summed in PostgreSQL.
- Average salary is the total divided by the matching user count, using decimal.js and half-up rounding to two decimals.
- Users are grouped by start date. Each group's completed UTC months of service is multiplied by its user count.
- Average seniority is the combined months divided by the user count, rounded down to a whole month, then converted to years and remaining months.
- Empty results produce zero counts, `"0.00"` salaries, and zero years/months.

## Tests and checks

With the app container running:

```bash
docker compose exec app npm run lint
docker compose exec app npm run test:unit
```

The unit tests cover invalid and out-of-range pages, partial and exact last pages, empty lists, monetary rounding, large monetary amounts, and completed-month seniority calculations.

Run the API integration test against the local Compose database server:

```bash
docker compose exec app sh -c 'TEST_DATABASE_URL="$DATABASE_URL" npm run test:api'
```

This test calls Route Handlers directly against a real PostgreSQL database. It creates a uniquely named temporary database, applies the migration SQL, tests create/read/update/delete plus duplicate-email and missing-user responses, then drops that temporary database. It requires a PostgreSQL account with permission to create and drop databases; the local Compose account has those permissions.

The test deliberately requires `TEST_DATABASE_URL`; it does not silently use `DATABASE_URL` as its test target. The command above explicitly supplies the local connection as the administrative connection. To run unit and API tests together:

```bash
docker compose exec app sh -c 'TEST_DATABASE_URL="$DATABASE_URL" npm test'
```

`npm run test:unit` also works on the host after `npm ci`, without a running database. The API test requires PostgreSQL. There is no browser automation suite.

## Source layout

```text
app/                 Pages, layouts, and API Route Handlers
components/          Forms, filters, actions, pagination, and server results
services/users.ts    User database operations and filtered statistics queries
lib/                 Validation, pagination, pure statistics, errors, database client
prisma/              Schema, committed migrations, and seed script
test/                Unit tests and API integration test
Dockerfile           Application image and migration/seed startup command
docker-compose.yml   Application and PostgreSQL services
.env.example         Documented local environment values
```
