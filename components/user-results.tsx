import type { listUsers } from "@/services/users";
import { Pagination } from "@/components/pagination";
import { UserActions } from "@/components/user-action";

type ResultsProps = { result: ReturnType<typeof listUsers> };

export async function UserStats({ result }: ResultsProps) {
  const { stats } = await result;

  // Statistics cover all matching users, across all pages.
  const statCards = [
    ["Users", String(stats.count)],
    ["Total salary", stats.totalSalary],
    ["Average salary", stats.averageSalary],
    ["Average seniority", `${stats.averageSeniority.years}y ${stats.averageSeniority.months}m`],
  ];

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(([label, value]) => (
          <div className="card p-5" key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          </div>))}
      </div>
      <p className="mb-5 text-xs text-slate-500">Statistics include all users matching the filters, across all pages.</p>
    </>
  );
}

export async function UserResults({ result: resultPromise }: ResultsProps) {
  const result = await resultPromise;

  return (
    <>
      <section className="card mb-6 overflow-hidden" aria-label="User directory">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th className="text-right!">Salary</th>
                <th>Start date</th>
                <th className="text-right!">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map(user => 
              <tr key={user.id}>
                <td className="font-medium">{user.name}</td>
                <td className="text-slate-500">{user.email}</td>
                <td><span className={`rounded-full px-2.5 py-1 text-xs ${user.role === "admin" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>{user.role}</span></td>
                <td className="text-right tabular-nums">{user.salary}</td>
                <td className="whitespace-nowrap text-slate-500">{user.startDate}</td>
                <td>
                  <UserActions user={user} />
                </td>
              </tr>)}
              {!result.items.length && <tr><td colSpan={6} className="py-12! text-center! text-slate-500">No users found. Try another filter or add a user below.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination {...result} />
      </section>
    </>
  );
}
