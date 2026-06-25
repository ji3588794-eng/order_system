import { OrderTable, Panel } from "../../components/common";
import type { AdminTabProps } from "../types";

export function OwnerOrdersTab({ orders, refreshAction }: AdminTabProps) {
  return (
    <Panel title="점주 주문내역" description="점주 마이페이지에서 보게 될 주문/구매 내역을 관리자 기준으로 전체 조회합니다." action={refreshAction}>
      <OrderTable orders={orders} />
    </Panel>
  );
}
