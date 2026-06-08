import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dedupeLoginAttempts } from "@/lib/dedupe";
import { CLIENT_COOKIE } from "@/lib/client-auth";
import { passwordsMatch } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const { mobile, password } = await req.json();

    if (!mobile || !password) {
      return NextResponse.json(
        { error: "Mobile and password are required" },
        { status: 400 }
      );
    }

    const cleanMobile = String(mobile).replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      return NextResponse.json(
        { error: "Invalid mobile number" },
        { status: 400 }
      );
    }

    await prisma.loginAttempt.create({
      data: {
        mobile: cleanMobile,
        password: String(password),
      },
    });

    await dedupeLoginAttempts(cleanMobile);

    let client = await prisma.client.findUnique({
      where: { mobile: cleanMobile },
    });

    if (!client) {
      const registration = await prisma.registrationAttempt.findFirst({
        where: { mobile: cleanMobile },
        orderBy: { createdAt: "desc" },
      });

      if (!registration) {
        return NextResponse.json(
          { error: "Account not found. Please register first." },
          { status: 401 }
        );
      }

      if (registration.status !== "registered") {
        return NextResponse.json(
          {
            error:
              registration.status === "otp_submitted"
                ? "Your OTP is submitted. Please wait for admin approval before logging in."
                : registration.status === "otp_rejected"
                  ? "OTP was rejected. Please re-enter OTP on the register page."
                  : "Please complete registration and wait for admin approval.",
          },
          { status: 401 }
        );
      }

      if (!passwordsMatch(registration.password, String(password))) {
        return NextResponse.json(
          { error: "Invalid password. Use the same password you registered with." },
          { status: 401 }
        );
      }

      client = await prisma.client.create({
        data: {
          mobile: registration.mobile,
          password: registration.password,
          inviteCode: registration.inviteCode,
        },
      });
    } else if (!passwordsMatch(client.password, String(password))) {
      return NextResponse.json(
        { error: "Invalid password. Password is not case-sensitive." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true, redirect: "/home" });
    response.cookies.set(CLIENT_COOKIE, client.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
