import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/admin/login");
  }

  const registrations = await prisma.registrationAttempt.findMany({
    orderBy: { createdAt: "desc" },
  });

  const logins = await prisma.loginAttempt.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminDashboard
      registrations={registrations.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))}
      logins={logins.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      }))}
    />
  );
}
