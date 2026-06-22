'use client';

import { usePathname } from 'next/navigation';
import styles from './layout.module.scss';
import Sidebar from '@/app/admin/(main)/_components/Sidebar/Sidebar';
import Header from '@/app/admin/(main)/_components/Header/Header';

export default function AdminMainShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const getTitle = (path: string) => {
    if (path.includes('/admin/dashboard')) return '대시보드';
    if (path.includes('/admin/popup')) return '팝업 관리';
    if (path.includes('/admin/menu')) return '메뉴 관리';
    if (path.includes('/admin/stores')) return '매장 관리';
    if (path.includes('/admin/community/notice')) return '공지사항 관리';
    if (path.includes('/admin/community/event')) return '이벤트 관리';
    if (path.includes('/admin/community/voice')) return '고객의 소리 관리';
    if (path.includes('/admin/inquiry')) return '창업 문의 관리';
    if (path.includes('/admin/settings')) return '전체 설정';
    return '관리자 센터';
  };

  return (
    <div className={styles.adminWrapper}>
      <Sidebar />
      <div className={styles.mainContainer}>
        <Header title={getTitle(pathname)} />
        <main className={styles.content}>{children}</main>
        <footer className={styles.footer}>
          <p>&copy; 2026 LEEPRESSO Admin Project. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}