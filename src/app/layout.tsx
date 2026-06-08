import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "P2P Money",
  description: "P2P Money registration and login",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
