import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { dedupeAll } from "@/lib/dedupe";

export async function POST() {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await dedupeAll();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Dedupe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
