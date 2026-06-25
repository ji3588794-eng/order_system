export type GroupKey = "work" | "owner" | "base" | "system";

export type TabKey =
  | "dashboard"
  | "orderInput"
  | "orderList"
  | "salesList"
  | "ownerAccounts"
  | "ownerOrders"
  | "inquiries"
  | "stores"
  | "items"
  | "accounts"
  | "logs";

export type ApiResult<T = unknown> = {
  success: boolean;
  message: string;
  data: T;
  code?: string;
};

export type Store = {
  id: number;
  storeUid?: string;
  storeCode?: string;
  storeName: string;
  taxInvoiceCode?: string;
  taxInvoiceName?: string;
  businessNumber?: string;
  machineVendor?: string;
  machineCatalogId?: number;
  machineCode?: string;
  machineCompanyName?: string;
  machineModelName?: string;
  deviceNumber?: string;
  machineName?: string;
  machineNames?: string;
  beanName?: string;
  ownerName?: string;
  ownerPhone?: string;
  representativeName?: string;
  contact1?: string;
  contact2?: string;
  address1?: string;
  address2?: string;
  asContent?: string;
  closureStatus?: string;
  installedAt?: string;
  filterReplacedAt?: string;
  paymentType: string;
  isActive?: number;
};

export type CustomerSearchField =
  | "taxInvoiceCode"
  | "taxInvoiceName"
  | "machineVendor"
  | "deviceNumber"
  | "machineCode"
  | "machineName"
  | "beanName"
  | "representativeName"
  | "contact1"
  | "address1"
  | "address2"
  | "asContent"
  | "installedAt"
  | "filterReplacedAt";

export type Item = {
  id: number;
  storeItemId?: number;
  itemCode?: string;
  categoryName?: string;
  supplierName?: string;
  name: string;
  spec?: string;
  purchasePrice: string | number;
  salePrice: string | number;
  keywords?: string;
  isActive?: number;
  storeId?: number;
  storeName?: string;
  machineId?: number;
  machineName?: string;
  machineCatalogId?: number;
  machineCatalogName?: string;
};

export type MachineCatalog = {
  id: number;
  machineCode: string;
  companyName?: string;
  machineName?: string;
  modelName?: string;
  memo?: string;
  isActive: number;
  itemCount: number;
};

export type Machine = {
  id: number;
  storeId: number;
  storeName: string;
  machineCatalogId?: number;
  machineCatalogCode?: string;
  machineCatalogName?: string;
  companyName?: string;
  machineCode?: string;
  machineName?: string;
  modelName?: string;
  serialNumber?: string;
  installedAt?: string;
  isActive: number;
  itemCount?: number;
};

export type Order = {
  id: number;
  orderNo: string;
  orderDate?: string;
  dueDate?: string;
  storeName: string;
  ownerName?: string;
  itemSummary?: string;
  requestChannel?: string;
  totalAmount: string | number;
  paidAmount: string | number;
  paymentStatus: string;
  paymentType: string;
  paymentMethod?: string;
  orderStatus: string;
};

export type BankAccount = {
  id: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  accountName?: string;
  isActive: number;
};

export type StoreOwner = {
  id: number;
  storeId: number;
  storeName: string;
  loginId: string;
  name: string;
  phone?: string;
  email?: string;
  isActive: number;
  orderCount: number;
  orderAmount: string | number;
  inquiryCount: number;
};

export type Inquiry = {
  id: number;
  storeId: number;
  storeName: string;
  storeOwnerId?: number;
  ownerName?: string;
  inquiryType: string;
  title: string;
  content: string;
  status: string;
  answer?: string;
  createdAt: string;
  answeredAt?: string;
};
