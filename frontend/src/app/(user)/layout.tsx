import Script from "next/script";
import ScrollToTop from "./common/ScrollToTop";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* 전역 스크롤 관리 */}
      <ScrollToTop />

      {children}
    </>
  );
}
