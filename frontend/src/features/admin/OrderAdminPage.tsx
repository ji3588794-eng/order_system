"use client";

import { groups, tabs } from "./config/navigation";
import { AdminTabContent } from "./tabs/AdminTabContent";
import { CustomerModal } from "./tabs/base/CustomersTab";
import { useAdminPageController } from "./hooks/useAdminPageController";

export default function OrderAdminPage() {
  const { activeGroup, activeTab, changeGroup, changeTab, notice, refreshLoading, refreshCurrentTab, tabProps } = useAdminPageController();
  const refreshAction = <button disabled={refreshLoading} onClick={refreshCurrentTab}>{refreshLoading ? "확인중" : "새로고침"}</button>;

  return (
    <main className="systemShell">
      <aside className="systemSide">
        <button className="logoButton" onClick={() => changeTab("dashboard")} aria-label="대시보드로 이동">
          <img src="/logo.svg" alt="LEEPRESSO ORDER SYSTEM" />
        </button>

        <nav className="mainNav" aria-label="관리 메뉴">
          {groups.map((group) => (
            <section key={group.key} className={activeGroup === group.key ? "navSection active" : "navSection"}>
              <button className="mainTab" onClick={() => changeGroup(group.key)}>
                {group.label}
              </button>
              <div className="subMenu">
                {tabs[group.key].map((tab) => (
                  <button key={tab.key} className={activeTab === tab.key ? "subTab active" : "subTab"} onClick={() => changeTab(tab.key)}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </nav>
      </aside>

      <section className="systemMain">
        {notice && <div className="pageNotice">{notice}</div>}
        <AdminTabContent activeTab={activeTab} tabProps={{ ...tabProps, refreshAction }} />
        <CustomerModal {...tabProps} />
        {refreshLoading && (
          <div className="pageLoadingOverlay" role="status" aria-live="polite">
            <div className="pageLoadingBox">
              <span className="pageSpinner" />
              <strong>데이터 확인 중</strong>
              <p>현재 페이지 데이터를 다시 조회하고 이전 데이터와 비교하고 있습니다.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
