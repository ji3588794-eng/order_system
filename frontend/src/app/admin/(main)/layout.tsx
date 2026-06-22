import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AdminMainShell from './AdminMainShell';

export default async function AdminMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 💡 [수정] 실서버 안정화 전까지 토큰 체크를 잠시 끕니다.
  /*
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');

  if (!token) {
    redirect('/admin/login');
  }
  */

  // 이제 토큰 유무와 상관없이 무조건 AdminMainShell(사이드바 등)이 그려집니다.
  return <AdminMainShell>{children}</AdminMainShell>;
}