import { NextResponse } from "next/server";
import { getSellRates } from "@/lib/pricing";

export async function GET() {
  try {
    const rates = await getSellRates();
    return NextResponse.json(rates);
  } catch (error) {
    console.error("Get rates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
