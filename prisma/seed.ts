import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const db = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
	const names = [
		"Alice Martin", "Omar Hassan", "Emma Wilson", "Noah Garcia",
		"Lina Chen", "Adam Brown", "Sara Ahmed", "Lucas Rossi",
		"Maya Patel", "Leo Silva", "Nora Kim", "Amir Jones",
		"Sofia Adams", "Ethan Brooks", "Ava Carter", "Liam Davis",
		"Isabella Evans", "Mason Fisher", "Mia Foster", "James Green",
		"Charlotte Hall", "Benjamin Harris", "Amelia Hayes", "Elijah Hill",
		"Harper Hughes", "Oliver Jackson", "Evelyn James", "Henry Johnson",
		"Abigail Kelly", "Alexander King", "Ella Lewis", "Daniel Lopez",
		"Grace Mitchell", "Samuel Moore", "Chloe Morgan", "David Murphy",
		"Victoria Nelson", "Joseph Parker", "Riley Perez", "Gabriel Phillips",
		"Aria Powell", "Matthew Reed", "Layla Rivera", "Sebastian Roberts",
		"Zoey Robinson", "Jack Rogers", "Penelope Ross", "William Russell",
		"Hannah Scott", "Michael Stewart", "Lily Taylor", "Owen Thomas",
		"Aisha Thompson", "Youssef Turner", "Fatima Walker", "Ibrahim Ward",
		"Ines Watson", "Rayan White", "Salma Wright", "Karim Young",
		"Yasmin Ali", "Nabil Benali", "Leila Haddad", "Mehdi Mansour",
		"Anika Das", "Arjun Shah", "Priya Singh", "Vikram Rao",
		"Yuna Sato", "Kenji Tanaka", "Mei Zhang", "Wei Liu",
	];

	// Prisma generates user IDs; duplicate emails are skipped on subsequent runs.
	const result = await db.user.createMany({
		data: names.map((name, index) => ({
			name,
			email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
			role: index % 4 === 0 ? "admin" : "member",
			salary: String(4000 + index * 250),
			startDate: new Date(Date.UTC(2020 + index % 5, index % 12, 1)),
		})),
		skipDuplicates: true,
	});

	console.log(`Added ${result.count} sample users.`);

	const projects = await db.project.createMany({
		data: ["Website redesign", "Customer portal", "Team dashboard"].map((name, index) => ({
			id: `00000000-0000-4000-9000-${String(index + 1).padStart(12, "0")}`,
			name,
		})),
		skipDuplicates: true,
	});
	console.log(`Added ${projects.count} sample projects.`);
}

main()
	.catch(error => {
		console.error("Seeding failed:", error);
		process.exitCode = 1;
	})
	.finally(() => db.$disconnect());
