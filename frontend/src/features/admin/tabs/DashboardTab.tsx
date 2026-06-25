import { Panel, Stat } from "../components/common";
import type { Inquiry, Order, Store } from "../types";
import { formatDate, money, orderStatusLabel, paymentStatusLabel } from "../utils/format";
import type { AdminTabProps } from "./types";

type ChartPoint = {
  dateKey: string;
  label: string;
  dayLabel: string;
  count: number;
};

export function DashboardTab({
  stats,
  dashboardOrderChart,
  orders,
  inquiries,
  stores,
  readyOrders,
  paymentWaitingOrders,
  inProgressOrders,
  refreshAction,
}: AdminTabProps) {
  const chartPoints = dashboardOrderChart as ChartPoint[];
  const maxOrderCount = Math.max(...chartPoints.map((item) => item.count), 1);
  const polylinePoints = chartPoints
    .map((item, index) => {
      const x = chartPoints.length === 1 ? 500 : 70 + (index * 860) / (chartPoints.length - 1);
      const y = 210 - (item.count / maxOrderCount) * 150;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `70,230 ${polylinePoints} 930,230`;

  const unansweredInquiries = (inquiries as Inquiry[])
    .filter((inquiry) => inquiry.status === "OPEN")
    .slice(0, 6);
  const recentOrders = [...(orders as Order[])]
    .sort((a, b) => Number(new Date(b.orderDate || "")) - Number(new Date(a.orderDate || "")))
    .slice(0, 5);
  const closedStores = (stores as Store[]).filter((store) => {
    const status = store.closureStatus || (store.isActive === 0 ? "폐업" : "운영중");
    return status === "폐업";
  }).length;

  const notices = [
    { title: "쇼핑몰 결제완료 주문은 발주 확인 탭에서 최종 진행 처리", date: "상시" },
    { title: "폐업 거래처는 삭제하지 않고 폐업현황으로 관리", date: "운영 기준" },
    { title: "머신별 품목 변경 시 거래처 주문 가능 품목 자동 반영", date: "기준정보" },
  ];

  return (
    <section className="tabPage dashboardPage">
      <div className="statGrid dashboardStatGrid">
        <Stat title="운영 거래처 수" value={stats.stores} />
        <Stat title="주문 품목갯수" value={stats.items} />
        <Stat title="전체 주문수" value={stats.orders} />
        <Stat title="일일 주문수" value={stats.todayOrders} />
        <Stat title="문의 미답변" value={stats.openInquiries} danger />
      </div>

      <Panel title="주문수 추이" description="오늘 기준 앞뒤 3일, 총 7일 주문 흐름입니다." action={refreshAction}>
        <div className="orderLineChart" role="img" aria-label="7일 주문수 라인 그래프">
          <svg viewBox="0 0 1000 280" preserveAspectRatio="none" className="lineChartSvg">
            <defs>
              <linearGradient id="orderLineFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[60, 110, 160, 210].map((y) => (
              <line key={y} x1="70" x2="930" y1={y} y2={y} className="chartGridLine" />
            ))}
            <polygon points={areaPoints} className="lineChartArea" />
            <polyline points={polylinePoints} className="lineChartLine" />
            {chartPoints.map((item, index) => {
              const x = chartPoints.length === 1 ? 500 : 70 + (index * 860) / (chartPoints.length - 1);
              const y = 210 - (item.count / maxOrderCount) * 150;
              const isToday = item.dayLabel === "오늘";
              return (
                <g key={item.dateKey}>
                  <circle className={isToday ? "lineChartDot today" : "lineChartDot"} cx={x} cy={y} r={isToday ? 7 : 5} />
                  <text className={isToday ? "lineChartValue today" : "lineChartValue"} x={x} y={Math.max(y - 14, 18)} textAnchor="middle">
                    {item.count}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="lineChartLabels">
            {chartPoints.map((item) => (
              <div key={item.dateKey} className={item.dayLabel === "오늘" ? "lineChartLabel today" : "lineChartLabel"}>
                <strong>{item.label}</strong>
                <span>{item.dayLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <div className="dashboardHalfGrid">
        <Panel title="공지사항" description="운영자가 확인해야 할 내부 기준입니다.">
          <div className="dashboardList">
            {notices.map((notice) => (
              <div key={notice.title} className="dashboardListRow">
                <strong>{notice.title}</strong>
                <span>{notice.date}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="문의내역" description="미답변 문의를 우선 확인합니다.">
          <div className="dashboardList">
            {unansweredInquiries.length ? (
              unansweredInquiries.map((inquiry) => (
                <div key={inquiry.id} className="dashboardListRow">
                  <strong>{inquiry.storeName}</strong>
                  <span>{inquiry.title}</span>
                  <em>{formatDate(inquiry.createdAt)}</em>
                </div>
              ))
            ) : (
              <div className="emptyDashboardState">미답변 문의가 없습니다.</div>
            )}
          </div>
        </Panel>
      </div>

      <Panel title="운영 보조 지표" description="대시보드에서 같이 보면 좋은 처리 대기 항목입니다.">
        <div className="supportMetricGrid">
          <div className="supportMetric">
            <span>발주 확인 대기</span>
            <strong>{readyOrders.length}</strong>
          </div>
          <div className="supportMetric">
            <span>결제 확인 대기</span>
            <strong>{paymentWaitingOrders.length}</strong>
          </div>
          <div className="supportMetric">
            <span>진행중 주문</span>
            <strong>{inProgressOrders.length}</strong>
          </div>
          <div className="supportMetric">
            <span>폐업 거래처</span>
            <strong>{closedStores}</strong>
          </div>
        </div>

        <div className="recentOrderList">
          {recentOrders.map((order) => (
            <div key={order.id} className="recentOrderRow">
              <strong>{order.storeName}</strong>
              <span>{order.itemSummary || "품목 미입력"}</span>
              <span>{paymentStatusLabel(order.paymentStatus)}</span>
              <span>{orderStatusLabel(order.orderStatus)}</span>
              <em>{money(order.totalAmount)}</em>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}
