"use client";

import { useRouter, usePathname } from "next/navigation";
import styles from "./Sidebar.module.scss";
import { ChevronDown } from "lucide-react"; // 화살표 아이콘 추가

const MENU_ITEMS = [
  { name: "대시보드", path: "/admin/dashboard" },
  { name: "발주 관리", path: "/admin/order" },
  { name: "팝업 관리", path: "/admin/popup" },
  { name: "메뉴 관리", path: "/admin/menu" },
  { name: "매장 관리", path: "/admin/stores" },
  {
    name: "커뮤니티 관리",
    path: "/admin/community",
    sub: [
      { name: "공지사항", path: "/admin/community/notice" },
      { name: "이벤트", path: "/admin/community/event" },
      { name: "고객의 소리", path: "/admin/community/voice" },
    ],
  },
  { name: "창업 문의", path: "/admin/inquiry" },
  {
    name: "전체 설정",
    path: "/admin/settings",
    sub: [
      { name: "관리자페이지 설정", path: "/admin/settings/admin" },
      { name: "SEO 설정 +]", path: "/admin/settings/seo" },
    ],
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActiveMenu = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo} onClick={() => router.push("/admin/dashboard")}>
        LEEPRESSO <span>ADMIN</span>
      </div>

      <nav className={styles.nav}>
        <ul>
          {MENU_ITEMS.map((item) => {
            const isActive = isActiveMenu(item.path);
            const hasSub = item.sub && item.sub.length > 0;

            return (
              <li key={item.path} className={styles.menuItemWrap}>
                <div
                  className={`${styles.menuItem} ${isActive ? styles.active : ""}`}
                  onClick={() => {
                    if (hasSub) {
                      router.push(item.sub![0].path);
                    } else {
                      router.push(item.path);
                    }
                  }}
                >
                  <span>{item.name}</span>
                  {hasSub && <ChevronDown size={16} className={`${styles.arrow} ${isActive ? styles.rotated : ""}`} />}
                </div>

                {/* 활성화된 메뉴의 서브메뉴만 표시 (애니메이션을 위해 클래스로 제어 가능) */}
                {hasSub && isActive && (
                  <ul className={styles.subMenu}>
                    {item.sub!.map((sub) => {
                      const isSubActive = pathname === sub.path;

                      return (
                        <li
                          key={sub.path}
                          className={`${styles.subMenuItem} ${isSubActive ? styles.subActive : ""}`}
                          onClick={() => router.push(sub.path)}
                        >
                          {sub.name}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
