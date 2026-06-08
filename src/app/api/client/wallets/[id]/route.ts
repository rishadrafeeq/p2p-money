import { NextRequest, NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await getClientSession();
  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await req.json();

  const wallet = await prisma.wallet.findFirst({
    where: { id, clientId: client.id },
  });

  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  if (action === "pause") {
    const updated = await prisma.wallet.update({
      where: { id },
      data: { status: "paused", canWithdraw: false },
    });
    return NextResponse.json({ success: true, wallet: updated });
  }

  if (action === "resume") {
    const updated = await prisma.wallet.update({
      where: { id },
      data: { status: "active", canWithdraw: true },
    });
    return NextResponse.json({ success: true, wallet: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await getClientSession();
  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const wallet = await prisma.wallet.findFirst({
    where: { id, clientId: client.id },
  });

  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  await prisma.wallet.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
