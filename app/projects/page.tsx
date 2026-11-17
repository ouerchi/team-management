import { db } from "@/lib/db";
import { Pagination } from "@/components/pagination";
import { pageQuery, SearchParams } from "@/lib/validation";
import { paginate } from "@/lib/pagination";
import { count } from "console";

export const dynamic = "force-dynamic";

function listProjects(page: number, size: number){
	return db.$transaction(
		tx => paginate({
			count: () => tx.project.count(),
			findMany: args => tx.project.findMany({
				...args,
				orderBy: [{name: "asc"}, {id: "asc"}],
			}),
		}, page, size),
		{isolationLevel: "RepeatableRead"}
	)
}

export default async function ProjectsPage({ searchParams } : { searchParams: Promise<SearchParams> }){

	const { page, size } = pageQuery(await searchParams);
	const result = await listProjects(page, size);

	return <>
	    <div className="mb-7">
			<h1>Projects</h1>
			<p className="mt-2 text-slate-500">A second list using the same pagination function and component.</p>
		</div>
    	<section className="card overflow-hidden">
			<table>
				<thead>
					<tr>
						<th>Project</th>
						<th>Created</th>
					</tr>
				</thead>
      			<tbody>
					{result.items.map(project => <tr key={project.id}><td className="font-medium">{project.name}</td><td className="text-slate-500">{project.createdAt.toISOString().slice(0, 10)}</td></tr>)}
      				{!result.items.length && <tr><td colSpan={2}>No projects yet. Run the database seed to add examples.</td></tr>}
	  			</tbody>
    		</table>
			<Pagination {...result} />
		</section>
	</>
}