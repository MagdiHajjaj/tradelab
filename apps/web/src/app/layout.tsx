import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeLab — Research Terminal",
  description:
    "Build an exchange. Develop trading algorithms. Simulate the market. A learning-driven quantitative trading platform.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
