import { OrderTable, Panel } from "../../components/common";
import type { AdminTabProps } from "../types";

export function OrderListTab({ readyOrders, run, startOrder, refreshAction }: AdminTabProps) {
  return (
    <Panel title="발주리스트" description="쇼핑몰에서 결제완료된 주문과 관리자 수동예외 주문만 발주 진행할 수 있습니다." action={refreshAction}>
      <OrderTable
        orders={readyOrders}
        actions={(order) => (
          <button className="lookupButton" onClick={() => run("발주 진행", () => startOrder(order.id))}>
            발주진행
          </button>
        )}
      />
    </Panel>
  );
}
