import { Prisma, type User } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { UserNotFoundError } from "@/lib/errors";
import { idSchema, userSchema, updateUserSchema, type ListQuery } from "@/lib/validation";
import { paginate } from "@/lib/pagination";
import { totalSeniorityMonths, calculateStats } from "@/lib/stats";

function serialize(user: User) {
  return {
    ...user,
    salary: user.salary.toFixed(2),
    startDate: user.startDate.toISOString().slice(0, 10),
    createdAt: user.createdAt.toISOString()
  };
}

export type UserRecord = ReturnType<typeof serialize>;

export async function getUser(id: string) {
  const user = await db.user.findUnique({
    where: {
      id: idSchema.parse(id),
    }
  });

  if (!user) {
    throw new UserNotFoundError();
  }
  return serialize(user);
}

export async function createUser(input: unknown) {
  const data = userSchema.parse(input);
  const user = await db.user.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
    }
  });

  return serialize(user);
}

export async function updateUser(id: string, input: unknown) {
  const data = updateUserSchema.parse(input);
  const user = await db.user.update({
    where: {
      id: idSchema.parse(id)
    },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined
    }
  });
  return serialize(user);
}

export async function deleteUser(id: string) {
  await db.user.delete({
    where: {
      id: idSchema.parse(id),
    }
  });
}

export async function listUsers(query: ListQuery) {
  const { page, size, role, search } = query;
  const where: Prisma.UserWhereInput = {
    role,
    name: {
      contains: search.replace(/[\\%_]/g, "\\$&"),
      mode: "insensitive",
    },
  };
  return db.$transaction(async tx => {
    const result = await paginate({
      count: () => tx.user.count({ where }),
      findMany: args => tx.user.findMany({
        ...args,
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      }),
    }, page, size);

    const aggregate = await tx.user.aggregate({
      where,
      _sum: {
        salary: true
      }
    });

    const dates = await tx.user.groupBy({
      by: ["startDate"],
      where,
      _count: {
        _all: true
      }
    });

    const stats = calculateStats({
      count: result.total,
      totalSalary: aggregate._sum.salary?.toString() ?? "0",
      totalMonths: totalSeniorityMonths(dates.map(date => ({
        startDate: date.startDate,
        count: date._count._all
      })))
    });
    return {
      ...result,
      items: result.items.map(serialize),
      stats,
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
