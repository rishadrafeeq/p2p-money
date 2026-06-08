import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAppSettings } from "@/lib/pricing";

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getAppSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Get pricing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { upiSellRate, impsSellRate, upiDailyLimit, impsDailyLimit } = await req.json();

    const upi = Number(upiSellRate);
    const imps = Number(impsSellRate);
    const upiLimit = Number(upiDailyLimit);
    const impsLimit = Number(impsDailyLimit);

    if (!upi || upi <= 0 || !imps || imps <= 0) {
      return NextResponse.json(
        { error: "Both UPI and IMPS rates must be positive numbers" },
        { status: 400 }
      );
    }

    if (!upiLimit || upiLimit <= 0 || !impsLimit || impsLimit <= 0) {
      return NextResponse.json(
        { error: "Daily limits must be positive numbers" },
        { status: 400 }
      );
    }

    const settings = await prisma.appSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        upiSellRate: upi,
        impsSellRate: imps,
        upiDailyLimit: upiLimit,
        impsDailyLimit: impsLimit,
      },
      update: {
        upiSellRate: upi,
        impsSellRate: imps,
        upiDailyLimit: upiLimit,
        impsDailyLimit: impsLimit,
      },
    });

    return NextResponse.json({
      success: true,
      upiSellRate: settings.upiSellRate,
      impsSellRate: settings.impsSellRate,
      upiDailyLimit: settings.upiDailyLimit,
      impsDailyLimit: settings.impsDailyLimit,
    });
  } catch (error) {
    console.error("Update pricing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
