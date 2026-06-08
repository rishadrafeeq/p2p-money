import { NextRequest, NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const client = await getClientSession();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const accountHolder = String(body.accountHolder || "").trim();
    const accountNumber = String(body.accountNumber || "").trim();
    const confirmAccountNumber = String(body.confirmAccountNumber || "").trim();
    const ifsc = String(body.ifsc || "").trim().toUpperCase();
    const bankName = String(body.bankName || "").trim() || null;

    if (!accountHolder || !accountNumber || !confirmAccountNumber || !ifsc) {
      return NextResponse.json({ error: "All bank fields are required" }, { status: 400 });
    }

    if (accountNumber !== confirmAccountNumber) {
      return NextResponse.json({ error: "Account numbers do not match" }, { status: 400 });
    }

    if (!/^\d{9,18}$/.test(accountNumber)) {
      return NextResponse.json({ error: "Enter a valid account number" }, { status: 400 });
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      return NextResponse.json({ error: "Enter a valid IFSC code" }, { status: 400 });
    }

    const duplicate = await prisma.bankAccount.findFirst({
      where: { clientId: client.id, accountNumber, ifsc },
    });
    if (duplicate) {
      return NextResponse.json({ error: "This bank account is already added" }, { status: 400 });
    }

    await prisma.bankAccount.create({
      data: {
        clientId: client.id,
        accountNumber,
        ifsc,
        accountHolder,
        bankName,
      },
    });

    // Keep legacy payment detail in sync for admin views
    await prisma.paymentDetail.upsert({
      where: { clientId: client.id },
      create: { clientId: client.id, accountNumber, ifsc, accountHolder, bankName },
      update: { accountNumber, ifsc, accountHolder, bankName },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment details error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
