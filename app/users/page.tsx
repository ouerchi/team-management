import { Suspense } from "react";
import { connection } from "next/server";
import { pageQuery, type SearchParams } from "@/lib/validation";
import UserFilters from "@/components/user-filters";
import { UserResults, UserStats } from "@/components/user-results";
import { UserForm } from "@/components/user-form";
import { listUsers } from "@/services/users";

function StatsSkeleton() {
  return (
    <div role="status" aria-label="Loading user statistics">
      <span className="sr-only">Loading user statistics…</span>
      <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map(index => (
            <div className="card p-5" key={index}>
              <div className="mb-3 h-4 w-24 rounded bg-slate-200" />
              <div className="h-8 w-32 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div role="status" aria-label="Loading user results" className="mb-6">
      <span className="sr-only">Loading user results…</span>
      <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
        <div className="card overflow-hidden p-5">
          <div className="mb-5 h-5 w-full rounded bg-slate-200" />
          {[0, 1, 2, 3, 4].map(index => (
            <div className="my-5 h-5 w-full rounded bg-slate-100" key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await connection();
  const query = pageQuery(await searchParams);
  const result = listUsers(query);

  return (
    <>
      <div className="mb-7">
        <h1>Users</h1>
        <p className="mt-2 text-slate-500">Manage your team and keep track of the details.</p>
      </div>
      <Suspense fallback={<StatsSkeleton />}>
        <UserStats result={result} />
      </Suspense>
      <div className="card mb-6 p-5">
        <UserFilters search={query.search} role={query.role} />
      </div>
      <Suspense fallback={<ResultsSkeleton />}>
        <UserResults result={result} />
      </Suspense>
      <section className="card max-w-2xl p-6">
        <h2 className="mb-5 text-lg font-semibold">Add a user</h2>
        <UserForm />
      </section>
    </>
  );
}
