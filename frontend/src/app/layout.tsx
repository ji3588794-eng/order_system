import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leepresso Order",
  description: "Leepresso franchise owner ordering frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
