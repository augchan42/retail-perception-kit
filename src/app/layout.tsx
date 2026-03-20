import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retail Perception Kit",
  description: "Phone-based retail audit demo — perception first, robots later",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
