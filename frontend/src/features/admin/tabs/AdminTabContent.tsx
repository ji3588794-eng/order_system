import type { TabKey } from "../types";
import { DashboardTab } from "./DashboardTab";
import { CustomersTab } from "./base/CustomersTab";
import { ItemsTab } from "./base/ItemsTab";
import { InquiriesTab } from "./owners/InquiriesTab";
import { OwnerAccountsTab } from "./owners/OwnerAccountsTab";
import { OwnerOrdersTab } from "./owners/OwnerOrdersTab";
import { OrderInputTab } from "./orders/OrderInputTab";
import { OrderListTab } from "./orders/OrderListTab";
import { SalesListTab } from "./orders/SalesListTab";
import { AccountsTab } from "./system/AccountsTab";
import { LogsTab } from "./system/LogsTab";
import type { AdminTabProps } from "./types";

type Props = {
  activeTab: TabKey;
  tabProps: AdminTabProps;
};

export function AdminTabContent({ activeTab, tabProps }: Props) {
  switch (activeTab) {
    case "dashboard":
      return <DashboardTab {...tabProps} />;
    case "orderInput":
      return <OrderInputTab {...tabProps} />;
    case "orderList":
      return <OrderListTab {...tabProps} />;
    case "salesList":
      return <SalesListTab {...tabProps} />;
    case "ownerAccounts":
      return <OwnerAccountsTab {...tabProps} />;
    case "ownerOrders":
      return <OwnerOrdersTab {...tabProps} />;
    case "inquiries":
      return <InquiriesTab {...tabProps} />;
    case "stores":
      return <CustomersTab {...tabProps} />;
    case "items":
      return <ItemsTab {...tabProps} />;
    case "accounts":
      return <AccountsTab {...tabProps} />;
    case "logs":
      return <LogsTab {...tabProps} />;
    default:
      return <DashboardTab {...tabProps} />;
  }
}
