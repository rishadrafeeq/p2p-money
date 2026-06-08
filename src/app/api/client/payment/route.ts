import { NextRequest, NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/db";
import { getSellRates, getRateForMethod, calcInrFromUsdt, type SellMethod } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const client = await getClientSession();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeOrder = await prisma.transaction.findFirst({
      where: {
        clientId: client.id,
        type: "usdt_sell",
        status: {
          notIn: ["completed", "rejected", "expired", "failed"],
        },
      },
    });

    if (activeOrder) {
      return NextResponse.json(
        { error: "You already have an active sell order. Please wait until it is completed." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const sellMethod = (formData.get("sellMethod") as string) || "upi";
    const inrAmount = formData.get("inrAmount") as string;
    const usdtAmount = formData.get("usdtAmount") as string;
    const note = formData.get("note") as string;

    if (sellMethod !== "upi" && sellMethod !== "imps") {
      return NextResponse.json({ error: "Invalid sell method" }, { status: 400 });
    }

    if (!usdtAmount || Number(usdtAmount) <= 0) {
      return NextResponse.json({ error: "USDT amount is required" }, { status: 400 });
    }

    const rates = await getSellRates();
    const rate = getRateForMethod(rates, sellMethod as SellMethod);
    const usdt = Number(usdtAmount);
    const inr = inrAmount ? Number(inrAmount) : calcInrFromUsdt(usdt, rate);

    const walletId = formData.get("walletId") as string | null;
    const bankAccountId = formData.get("bankAccountId") as string | null;

    if (sellMethod === "upi" && !walletId) {
      return NextResponse.json({ error: "Select a UPI wallet" }, { status: 400 });
    }

    if (sellMethod === "imps" && !bankAccountId) {
      return NextResponse.json({ error: "Select a bank account" }, { status: 400 });
    }

    await prisma.transaction.create({
      data: {
        clientId: client.id,
        type: "usdt_sell",
        sellMethod,
        walletId: sellMethod === "upi" ? walletId : null,
        bankAccountId: sellMethod === "imps" ? bankAccountId : null,
        inrAmount: inr,
        usdtAmount: usdt,
        note: note || `Sell USDT via ${sellMethod.toUpperCase()} @ ₹${rate}`,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Sell order submitted. Please wait for admin approval before sending USDT.",
    });
  } catch (error) {
    console.error("Payment upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
