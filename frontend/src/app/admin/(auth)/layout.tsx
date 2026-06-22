import { cookies } from 'next/headers';

export default async function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 실서버 무한 리다이렉트 방지를 위해 서버 사이드 redirect는 제거하거나 
  // 구조적으로 완벽히 분리된 상태에서만 사용해야 해. 
  // 일단 화면이 나오게 하는 게 우선이니 아래처럼 단순화하자.

  return <>{children}</>;
}