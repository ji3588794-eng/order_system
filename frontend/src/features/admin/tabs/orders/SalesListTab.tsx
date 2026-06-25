import { OrderTable, Panel } from "../../components/common";
import type { AdminTabProps } from "../types";

export function SalesListTab({ orders, refreshAction }: AdminTabProps) {
  return (
    <Panel title="전체내역" description="쇼핑몰 결제대기, 결제완료, 수동예외, 발주진행, 완료 주문을 전체 조회합니다." action={refreshAction}>
      <OrderTable orders={orders} />
    </Panel>
  );
}
