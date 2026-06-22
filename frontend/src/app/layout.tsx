import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import ScrollToTop from "./(user)/common/ScrollToTop";
import AuthGuard from "../app/(user)/components/AuthGuard";

export const metadata: Metadata = {
  title: "Leepresso Order System",
  description: "Leepresso 발주 관리 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthGuard>
          <ScrollToTop />

          <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="afterInteractive" />

          {children}
        </AuthGuard>
      </body>
    </html>
  );
}
