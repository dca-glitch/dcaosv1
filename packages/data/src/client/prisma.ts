import { PrismaClient } from "@prisma/client";

export type PrismaClientOptions = ConstructorParameters<typeof PrismaClient>[0];

export function createPrismaClient(options?: PrismaClientOptions): PrismaClient {
  return new PrismaClient(options);
}

export async function disconnectPrismaClient(client: PrismaClient): Promise<void> {
  await client.$disconnect();
}
