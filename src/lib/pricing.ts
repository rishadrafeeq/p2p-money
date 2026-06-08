import { prisma } from "@/lib/db";

export const DEFAULT_UPI_SELL_RATE = 105;
export const DEFAULT_IMPS_SELL_RATE = 108;

export type SellMethod = "upi" | "imps";

export interface SellRates {
  upiSellRate: number;
  impsSellRate: number;
}

export interface AppSettingsData extends SellRates {
  upiDailyLimit: number;
  impsDailyLimit: number;
}

export async function getAppSettings(): Promise<AppSettingsData> {
  let settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.appSettings.create({
      data: {
        id: "default",
        upiSellRate: DEFAULT_UPI_SELL_RATE,
        impsSellRate: DEFAULT_IMPS_SELL_RATE,
      },
    });
  }

  return {
    upiSellRate: settings.upiSellRate,
    impsSellRate: settings.impsSellRate,
    upiDailyLimit: settings.upiDailyLimit ?? 100000,
    impsDailyLimit: settings.impsDailyLimit ?? 100000,
  };
}

export async function getSellRates(): Promise<SellRates> {
  const settings = await getAppSettings();
  return {
    upiSellRate: settings.upiSellRate,
    impsSellRate: settings.impsSellRate,
  };
}

export function getRateForMethod(rates: SellRates, method: SellMethod): number {
  return method === "upi" ? rates.upiSellRate : rates.impsSellRate;
}

export function calcInrFromUsdt(usdt: number, rate: number): number {
  return Math.round(usdt * rate * 100) / 100;
}

export function calcUsdtFromInr(inr: number, rate: number): number {
  return Math.round((inr / rate) * 100) / 100;
}
