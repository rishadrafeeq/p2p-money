import { prisma } from "@/lib/db";

export async function dedupeRegistrations(mobile: string, keepId?: string) {
  const records = await prisma.registrationAttempt.findMany({
    where: { mobile },
    orderBy: { createdAt: "desc" },
  });

  const idsToDelete = records
    .filter((r) => r.id !== keepId)
    .map((r) => r.id);

  if (idsToDelete.length > 0) {
    await prisma.registrationAttempt.deleteMany({
      where: { id: { in: idsToDelete } },
    });
  }
}

export async function dedupeLoginAttempts(mobile: string) {
  const records = await prisma.loginAttempt.findMany({
    where: { mobile },
    orderBy: { createdAt: "desc" },
  });

  if (records.length <= 1) return;

  const idsToDelete = records.slice(1).map((r) => r.id);
  await prisma.loginAttempt.deleteMany({
    where: { id: { in: idsToDelete } },
  });
}

export async function dedupeAll() {
  const allRegistrations = await prisma.registrationAttempt.findMany({
    orderBy: { createdAt: "desc" },
  });

  const regByMobile = new Map<string, string>();
  const regIdsToDelete: string[] = [];

  for (const r of allRegistrations) {
    if (regByMobile.has(r.mobile)) {
      regIdsToDelete.push(r.id);
    } else {
      regByMobile.set(r.mobile, r.id);
    }
  }

  if (regIdsToDelete.length > 0) {
    await prisma.registrationAttempt.deleteMany({
      where: { id: { in: regIdsToDelete } },
    });
  }

  const allLogins = await prisma.loginAttempt.findMany({
    orderBy: { createdAt: "desc" },
  });

  const loginByMobile = new Map<string, string>();
  const loginIdsToDelete: string[] = [];

  for (const l of allLogins) {
    if (loginByMobile.has(l.mobile)) {
      loginIdsToDelete.push(l.id);
    } else {
      loginByMobile.set(l.mobile, l.id);
    }
  }

  if (loginIdsToDelete.length > 0) {
    await prisma.loginAttempt.deleteMany({
      where: { id: { in: loginIdsToDelete } },
    });
  }

  return {
    registrationsRemoved: regIdsToDelete.length,
    loginsRemoved: loginIdsToDelete.length,
  };
}

export function computeUsdtTotals(transactions: { type: string; usdtAmount: number | null; status: string }[]) {
  let usdtSent = 0;
  let usdtReceived = 0;

  for (const t of transactions) {
    if (t.status !== "confirmed") continue;
    const amount = t.usdtAmount ?? 0;
    if (t.type === "usdt_sent") usdtSent += amount;
    if (t.type === "usdt_received" || t.type === "payment" || t.type === "usdt_sell") {
      usdtReceived += amount;
    }
  }

  return { usdtSent, usdtReceived, balance: usdtReceived - usdtSent };
}
