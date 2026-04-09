"use client";

import { useRouter } from "next/navigation";
import Home from "./components/home/Home";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import "./scss/util.scss";
import "./scss/mixin.scss";

export default function GatePage() {
  const router = useRouter();

  return (
    <div>
      <Header />

      <Home />

      <Footer />
    </div>
  );
}
