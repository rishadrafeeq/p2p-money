import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveUpload } from "@/lib/upload";

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.depositAddress.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Deposit addresses GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const label = String(formData.get("label") || "").trim();
    const network = String(formData.get("network") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const file = formData.get("qrImage") as File | null;

    if (!label || !network || !address) {
      return NextResponse.json({ error: "Label, network, and address are required" }, { status: 400 });
    }

    let qrImage: string | null = null;
    if (file && file.size > 0) {
      qrImage = await saveUpload(file, "deposit-qr");
    }

    const created = await prisma.depositAddress.create({
      data: { label, network, address, qrImage },
    });

    return NextResponse.json({ success: true, address: created });
  } catch (error) {
    console.error("Deposit addresses POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
