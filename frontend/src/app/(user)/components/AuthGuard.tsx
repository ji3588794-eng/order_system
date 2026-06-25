"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const isLogin = localStorage.getItem("isLogin");

    // 로그인 페이지는 제외
    if (pathname === "/login") {
      setChecked(true);
      return;
    }

    if (!isLogin) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [pathname, router]);

  if (!checked) return null;

  return <>{children}</>;
}
