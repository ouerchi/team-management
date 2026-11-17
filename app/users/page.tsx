import { listUsers } from "@/services/users";
import { pageQuery, type SearchParams } from "@/lib/validation";
import { Pagination } from "@/components/pagination";
import UserFilters from "@/components/user-filters";
import { UserActions } from "@/components/user-action";
import { UserForm } from "@/components/user-form";

export default async function UsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  // 1. Read the URL (a bad value falls back to a default instead of crashing)
  const query = pageQuery(await searchParams);

  // 2. Load one page of users, plus the stats for ALL filtered users
  const result = await listUsers(query);
  const { stats } = result;

  // 3. Prepare the four cards shown at the top: [label, value]
  const statCards = [
    ["Users", String(stats.count)],
    ["Total salary", stats.totalSalary],
    ["Average salary", stats.averageSalary],
    ["Average seniority", `${stats.averageSeniority.years}y ${stats.averageSeniority.months}m`],
  ];

  return (
    <>
      <div className="mb-7">
        <h1>Users</h1>
        <p className="mt-2 text-slate-500">Manage your team and keep track of the details.</p>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(([label, value]) => (
          <div className="card p-5" key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          </div>))}
      </div>
      <p className="mb-5 text-xs text-slate-500">Statistics include all users matching the filters, across all pages.</p>
      <section className="card mb-6 overflow-hidden" aria-label="User directory">
        <div className="border-b border-slate-200 p-5">
          <UserFilters key={`${query.search}:${query.role}`} search={query.search} role={query.role} />
        </div>
        <div className="overflow-x-auto"><table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th className="text-right!">Salary</th><th>Start date</th><th className="text-right!">Actions</th></tr></thead>
          <tbody>{result.items.map(user => <tr key={user.id}>
            <td className="font-medium">{user.name}</td><td className="text-slate-500">{user.email}</td>
            <td><span className={`rounded-full px-2.5 py-1 text-xs ${user.role === "admin" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>{user.role}</span></td>
            <td className="text-right tabular-nums">{user.salary}</td><td className="whitespace-nowrap text-slate-500">{user.startDate}</td><td><UserActions user={user} /></td>
          </tr>)}{!result.items.length && <tr><td colSpan={6} className="py-12! text-center! text-slate-500">No users found. Try another filter or add a user below.</td></tr>}</tbody>
        </table></div>
        <Pagination {...result} />
      </section>
      <section className="card max-w-2xl p-6">
        <h2 className="mb-5 text-lg font-semibold">Add a user</h2>
        <UserForm />
      </section>
    </>
  );
}