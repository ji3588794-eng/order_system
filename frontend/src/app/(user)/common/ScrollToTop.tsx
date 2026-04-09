'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // 경로(URL)가 바뀔 때마다 윈도우 스크롤을 0, 0으로 이동
    window.scrollTo(0, 0);
  }, [pathname]);

  return null; // 화면에 아무것도 렌더링하지 않음
}