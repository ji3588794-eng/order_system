// app/admin/page.tsx
import { redirect } from "next/navigation";

export default async function AdminRootPage() {
  // 여기서 토큰 체크를 빡빡하게 하기보다,
  // 접속하면 일단 대시보드로 던지고, 대시보드 내의 Layout에서 보호하게 합니다.
  redirect("/admin/dashboard");
}
