import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;

  // Recreate if cached client is stale (e.g. after schema migration while dev server runs)
  const stale =
    cached &&
    (typeof (cached as PrismaClient & { client?: unknown }).client === "undefined" ||
      typeof (cached as PrismaClient & { appSettings?: unknown }).appSettings === "undefined" ||
      typeof (cached as PrismaClient & { paymentPinAttempt?: unknown }).paymentPinAttempt === "undefined" ||
      typeof (cached as PrismaClient & { walletAddAttempt?: unknown }).walletAddAttempt === "undefined" ||
      typeof (cached as PrismaClient & { bankAccount?: unknown }).bankAccount === "undefined" ||
      typeof (cached as PrismaClient & { depositAddress?: unknown }).depositAddress === "undefined" ||
      typeof (cached as PrismaClient & { pushNotification?: unknown }).pushNotification === "undefined" ||
      typeof (cached as PrismaClient & { supportThread?: unknown }).supportThread === "undefined" ||
      typeof (cached as PrismaClient & { supportMessage?: unknown }).supportMessage === "undefined");
  if (stale) {
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();
