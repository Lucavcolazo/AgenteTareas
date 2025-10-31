import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "To‑Do Minimal",
  description: "To‑Do con Supabase y Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} antialiased bg-white text-black dark:bg-black dark:text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
