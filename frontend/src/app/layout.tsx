import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leepresso Order System",
  description: "Leepresso 발주 관리 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
