import Header from "../components/common/Header";
import Footer from "../components/common/Footer";

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />

      {/* 2. 실제 페이지 콘텐츠 */}
      <main className="page_area">{children}</main>

      <Footer />
    </>
  );
}
