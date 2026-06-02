import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../generated/prisma/client";
import { env } from "./env";

const connectionString = env.databaseUrl;

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (!env.isProduction) {
	globalForPrisma.prisma = prisma;
}
