import { useEffect, useMemo, useState } from "react";
import { tabs } from "../config/navigation";
import { adminApi } from "../services/adminApi";
import type {
  BankAccount,
  CustomerSearchField,
  GroupKey,
  Inquiry,
  Item,
  Machine,
  MachineCatalog,
  Order,
  Store,
  StoreOwner,
  TabKey,
} from "../types";
import { formatDate } from "../utils/format";

const tabToGroup = Object.fromEntries(
  Object.entries(tabs).flatMap(([group, items]) => items.map((tab) => [tab.key, group]))
) as Record<TabKey, GroupKey>;

function toDateKey(value?: string | Date) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeForCompare(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeForCompare);
  if (!value || typeof value !== "object") return value;

  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      result[key] = normalizeForCompare((value as Record<string, unknown>)[key]);
      return result;
    }, {});
}

function dataChanged(previous: unknown, next: unknown) {
  return JSON.stringify(normalizeForCompare(previous)) !== JSON.stringify(normalizeForCompare(next));
}

export function useAdminPageController() {
  const [activeGroup, setActiveGroup] = useState<GroupKey>("work");
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [stores, setStores] = useState<Store[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [orderItems, setOrderItems] = useState<Item[]>([]);
  const [storeAssignedItems, setStoreAssignedItems] = useState<Item[]>([]);
  const [catalogAssignedItems, setCatalogAssignedItems] = useState<Item[]>([]);
  const [machineLinkedItemIds, setMachineLinkedItemIds] = useState<number[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineCatalogs, setMachineCatalogs] = useState<MachineCatalog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [storeOwners, setStoreOwners] = useState<StoreOwner[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [log, setLog] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshLoading, setRefreshLoading] = useState(false);

  const [customerFormMode, setCustomerFormMode] = useState<"create" | "edit">("create");
  const [editingStoreId, setEditingStoreId] = useState<number | null>(null);
  const [storeName, setStoreName] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [taxInvoiceCode, setTaxInvoiceCode] = useState("");
  const [taxInvoiceName, setTaxInvoiceName] = useState("");
  const [machineVendor, setMachineVendor] = useState("");
  const [customerMachineName, setCustomerMachineName] = useState("");
  const [customerMachineCatalogId, setCustomerMachineCatalogId] = useState("");
  const [deviceNumber, setDeviceNumber] = useState("");
  const [beanName, setBeanName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [contactPhone2, setContactPhone2] = useState("");
  const [customerAddress1, setCustomerAddress1] = useState("");
  const [customerAddress2, setCustomerAddress2] = useState("");
  const [asContent, setAsContent] = useState("");
  const [closureStatus, setClosureStatus] = useState("운영중");
  const [installedAt, setInstalledAt] = useState("");
  const [filterReplacedAt, setFilterReplacedAt] = useState("");
  const [paymentType, setPaymentType] = useState("PREPAID");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [customerSearchField, setCustomerSearchField] = useState<CustomerSearchField>("taxInvoiceName");
  const [customerSearchInput, setCustomerSearchInput] = useState("");
  const [customerSearchKeyword, setCustomerSearchKeyword] = useState("");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const [itemName, setItemName] = useState("디카페인 원두");
  const [itemSpec, setItemSpec] = useState("1kg / 1봉");
  const [categoryName, setCategoryName] = useState("원두 > 디카페인");
  const [itemSupplierName, setItemSupplierName] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [itemKeywords, setItemKeywords] = useState("디카페인, 원두, 커피, 거북카페");
  const [itemSearch, setItemSearch] = useState("");
  const [itemStoreSearch, setItemStoreSearch] = useState("거북카페");
  const [selectedItemGroup, setSelectedItemGroup] = useState("전체");
  const [selectedItemStoreId, setSelectedItemStoreId] = useState("");
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [selectedMachineCatalogId, setSelectedMachineCatalogId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("30000");
  const [salePrice, setSalePrice] = useState("35000");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("2");
  const [manualOrderMemo, setManualOrderMemo] = useState("전화/문자 접수로 인한 관리자 수동 주문");

  const [bankName, setBankName] = useState("국민은행");
  const [accountNumber, setAccountNumber] = useState("546201-01-293847");
  const [accountHolder, setAccountHolder] = useState("주식회사 리프레소");

  const [ownerLoginId, setOwnerLoginId] = useState("gobuk_owner");
  const [ownerAccountName, setOwnerAccountName] = useState("김민준");
  const [ownerAccountPhone, setOwnerAccountPhone] = useState("010-4821-7395");
  const [ownerAccountEmail, setOwnerAccountEmail] = useState("gobuk@example.com");
  const [inquiryAnswer, setInquiryAnswer] = useState("확인 후 처리 일정 안내드리겠습니다.");

  const activeInfo = tabs[activeGroup].find((tab) => tab.key === activeTab) || tabs.work[0];
  const readyOrders = orders.filter(
    (order) =>
      ["PAID", "MANUAL_APPROVED"].includes(order.paymentStatus) &&
      !["ORDER_IN_PROGRESS", "SHIPPED", "COMPLETED", "CANCELED"].includes(order.orderStatus)
  );
  const paymentWaitingOrders = orders.filter((order) => ["UNPAID", "PARTIAL_PAID"].includes(order.paymentStatus));
  const inProgressOrders = orders.filter((order) => ["ORDER_IN_PROGRESS", "SHIPPED", "COMPLETED"].includes(order.orderStatus));
  const todayKey = toDateKey(new Date());
  const dashboardOrderChart = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index - 3);
      const dateKey = toDateKey(date);
      const count = orders.filter((order) => toDateKey(order.orderDate) === dateKey).length;
      return {
        dateKey,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        dayLabel: index === 3 ? "오늘" : date.toLocaleDateString("ko-KR", { weekday: "short" }),
        count,
      };
    });
  }, [orders]);

  const stats = useMemo(
    () => ({
      stores: stores.filter((store) => store.isActive !== 0 && store.closureStatus !== "폐업").length,
      items: items.filter((item) => item.isActive !== 0 && item.categoryName !== "머신/장비").length,
      orders: orders.length,
      todayOrders: orders.filter((order) => toDateKey(order.orderDate) === todayKey).length,
      orderReview: readyOrders.length,
      sales: inProgressOrders.length,
      waitingPayment: paymentWaitingOrders.length,
      openInquiries: inquiries.filter((inquiry) => inquiry.status === "OPEN").length,
    }),
    [stores, items, orders, todayKey, readyOrders.length, inProgressOrders.length, paymentWaitingOrders.length, inquiries]
  );

  const itemGroups = useMemo(() => {
    const groups = Array.from(new Set(items.map((item) => item.categoryName).filter(Boolean) as string[]));
    return ["전체", ...groups.sort((a, b) => a.localeCompare(b, "ko"))];
  }, [items]);

  const filteredItems = useMemo(() => {
    const keyword = itemSearch.trim().toLowerCase();
    return items.filter((item) => {
      const groupMatched = selectedItemGroup === "전체" || item.categoryName === selectedItemGroup;
      const keywordSource = [item.itemCode, item.storeName, item.machineName, item.categoryName, item.supplierName, item.name, item.spec, item.keywords]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return groupMatched && (!keyword || keywordSource.includes(keyword));
    });
  }, [items, itemSearch, selectedItemGroup]);

  const filteredStores = useMemo(() => {
    const keyword = customerSearchKeyword.trim().toLowerCase();
    if (!keyword) return stores;

    return stores.filter((store) => {
      const sourceMap: Record<CustomerSearchField, string> = {
        taxInvoiceCode: store.taxInvoiceCode || store.storeCode || "",
        taxInvoiceName: store.taxInvoiceName || store.storeName || "",
        machineVendor: store.machineVendor || "",
        deviceNumber: store.deviceNumber || "",
        machineCode: store.machineCode || "",
        machineName: store.machineModelName || store.machineNames || store.machineName || "",
        beanName: store.beanName || "",
        representativeName: store.representativeName || store.ownerName || "",
        contact1: store.contact1 || store.ownerPhone || "",
        address1: store.address1 || "",
        address2: store.address2 || "",
        asContent: store.asContent || "",
        installedAt: formatDate(store.installedAt),
        filterReplacedAt: formatDate(store.filterReplacedAt),
      };

      return sourceMap[customerSearchField].toLowerCase().includes(keyword);
    });
  }, [customerSearchField, customerSearchKeyword, stores]);

  const itemStoreMatches = useMemo(() => {
    const keyword = itemStoreSearch.trim().toLowerCase();
    if (!keyword) return stores.slice(0, 8);
    return stores
      .filter((store) => {
        const source = [
          store.storeName,
          store.taxInvoiceName,
          store.taxInvoiceCode,
          store.storeCode,
          store.ownerName,
          store.machineNames,
          store.machineName,
          store.machineCode,
          store.machineModelName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return source.includes(keyword);
      })
      .slice(0, 8);
  }, [itemStoreSearch, stores]);

  const selectedItemStore = useMemo(
    () => stores.find((store) => store.id === Number(selectedItemStoreId)),
    [selectedItemStoreId, stores]
  );

  const selectedItemStoreMachines = useMemo(
    () => machines.filter((machine) => machine.storeId === Number(selectedItemStoreId)),
    [machines, selectedItemStoreId]
  );

  const changeGroup = (group: GroupKey) => {
    setActiveGroup(group);
    setActiveTab(tabs[group][0].key);
  };

  const changeTab = (tab: TabKey) => {
    setActiveGroup(tabToGroup[tab]);
    setActiveTab(tab);
  };

  const writeLog = (title: string, data: unknown) => {
    const next = `[${new Date().toLocaleTimeString()}] ${title}\n${JSON.stringify(data, null, 2)}\n\n`;
    setLog((current) => next + current);
  };

  const run = (title: string, job: () => Promise<void>) => {
    setNotice(`${title} 처리 중...`);
    job()
      .then(() => setNotice(`${title} 완료`))
      .catch((error) => {
        setNotice(`${title} 실패: ${error?.message || error?.code || "요청을 확인해주세요"}`);
        writeLog(`${title} 실패`, error);
      });
  };

  const resetCustomerForm = () => {
    setEditingStoreId(null);
    setCustomerFormMode("create");
    setStoreName("");
    setBusinessNumber("");
    setTaxInvoiceCode("");
    setTaxInvoiceName("");
    setMachineVendor("");
    setCustomerMachineName("");
    setCustomerMachineCatalogId("");
    setDeviceNumber("");
    setBeanName("");
    setOwnerName("");
    setOwnerPhone("");
    setContactPhone2("");
    setCustomerAddress1("");
    setCustomerAddress2("");
    setAsContent("");
    setClosureStatus("운영중");
    setInstalledAt("");
    setFilterReplacedAt("");
    setPaymentType("PREPAID");
  };

  const openCustomerCreateModal = () => {
    resetCustomerForm();
    setIsCustomerModalOpen(true);
  };

  const openCustomerEditModal = (store: Store) => {
    setCustomerFormMode("edit");
    setEditingStoreId(store.id);
    setStoreName(store.storeName || "");
    setBusinessNumber(store.businessNumber || "");
    setTaxInvoiceCode(store.taxInvoiceCode || store.storeCode || "");
    setTaxInvoiceName(store.taxInvoiceName || store.storeName || "");
    setMachineVendor(store.machineVendor || "");
    setCustomerMachineName(store.machineModelName || store.machineName || store.machineNames || "");
    setCustomerMachineCatalogId(store.machineCatalogId ? String(store.machineCatalogId) : "");
    setDeviceNumber(store.deviceNumber || "");
    setBeanName(store.beanName || "");
    setOwnerName(store.representativeName || store.ownerName || "");
    setOwnerPhone(store.contact1 || store.ownerPhone || "");
    setContactPhone2(store.contact2 || "");
    setCustomerAddress1(store.address1 || "");
    setCustomerAddress2(store.address2 || "");
    setAsContent(store.asContent || "");
    setClosureStatus(store.closureStatus || (store.isActive === 0 ? "폐업" : "운영중"));
    setInstalledAt(store.installedAt ? String(store.installedAt).slice(0, 10) : "");
    setFilterReplacedAt(store.filterReplacedAt ? String(store.filterReplacedAt).slice(0, 10) : "");
    setPaymentType(store.paymentType || "PREPAID");
    setSelectedItemStoreId(String(store.id));
    loadStoreAssignedItems(String(store.id));
    setIsCustomerModalOpen(true);
  };

  const fetchMachineLinkedItemIds = async (catalogs: MachineCatalog[] = machineCatalogs) => {
    if (!catalogs.length) {
      return [];
    }

    const results = await Promise.all(
      catalogs.map((catalog) => adminApi<{ items: Item[] }>(`/api/machines/catalogs/${catalog.id}/items`))
    );
    const ids = new Set<number>();
    results.forEach((result) => {
      result.data.items.forEach((item) => ids.add(item.id));
    });
    return Array.from(ids);
  };

  const loadMachineLinkedItemIds = async (catalogs: MachineCatalog[] = machineCatalogs) => {
    setMachineLinkedItemIds(await fetchMachineLinkedItemIds(catalogs));
  };

  const loadAll = async () => {
    const [storeResult, itemResult, machineResult, catalogResult, orderResult, accountResult, ownerResult, inquiryResult] = await Promise.all([
      adminApi<{ items: Store[] }>("/api/stores?size=500"),
      adminApi<{ items: Item[] }>("/api/items?size=300"),
      adminApi<{ items: Machine[] }>("/api/machines"),
      adminApi<{ items: MachineCatalog[] }>("/api/machines/catalogs"),
      adminApi<{ items: Order[] }>("/api/orders?size=500"),
      adminApi<{ items: BankAccount[] }>("/api/bank-accounts"),
      adminApi<{ items: StoreOwner[] }>("/api/store-owners"),
      adminApi<{ items: Inquiry[] }>("/api/inquiries"),
    ]);

    setStores(storeResult.data.items);
    setItems(itemResult.data.items);
    setMachines(machineResult.data.items);
    setMachineCatalogs(catalogResult.data.items);
    setOrders(orderResult.data.items);
    setBankAccounts(accountResult.data.items);
    setStoreOwners(ownerResult.data.items);
    setInquiries(inquiryResult.data.items);
    await loadMachineLinkedItemIds(catalogResult.data.items);

    if (!selectedItemStoreId && storeResult.data.items[0]) {
      setSelectedItemStoreId(String(storeResult.data.items[0].id));
    }
    if (!selectedMachineCatalogId && catalogResult.data.items[0]) {
      setSelectedMachineCatalogId(String(catalogResult.data.items[0].id));
    }
  };

  const loadOrderItems = async (storeId: string) => {
    if (!storeId) {
      setOrderItems([]);
      return;
    }
    const result = await adminApi<{ items: Item[] }>(`/api/items?storeId=${storeId}`);
    setOrderItems(result.data.items);
  };

  const loadStoreAssignedItems = async (storeId: string) => {
    if (!storeId) {
      setStoreAssignedItems([]);
      return;
    }
    const result = await adminApi<{ items: Item[] }>(`/api/items?storeId=${storeId}`);
    setStoreAssignedItems(result.data.items);
  };

  const loadCatalogAssignedItems = async (catalogId: string) => {
    if (!catalogId) {
      setCatalogAssignedItems([]);
      return;
    }
    const result = await adminApi<{ items: Item[] }>(`/api/machines/catalogs/${catalogId}/items`);
    setCatalogAssignedItems(result.data.items);
  };

  const refreshCurrentTab = async () => {
    const startedAt = Date.now();
    setRefreshLoading(true);
    setNotice(`${activeInfo.label} 새로고침 중...`);

    try {
      let changed = false;

      const compareStores = (next: Store[]) => {
        changed = dataChanged(stores, next) || changed;
        setStores(next);
      };
      const compareItems = (next: Item[]) => {
        changed = dataChanged(items, next) || changed;
        setItems(next);
      };
      const compareMachines = (next: Machine[]) => {
        changed = dataChanged(machines, next) || changed;
        setMachines(next);
      };
      const compareCatalogs = (next: MachineCatalog[]) => {
        changed = dataChanged(machineCatalogs, next) || changed;
        setMachineCatalogs(next);
      };
      const compareOrders = (next: Order[]) => {
        changed = dataChanged(orders, next) || changed;
        setOrders(next);
      };
      const compareAccounts = (next: BankAccount[]) => {
        changed = dataChanged(bankAccounts, next) || changed;
        setBankAccounts(next);
      };
      const compareOwners = (next: StoreOwner[]) => {
        changed = dataChanged(storeOwners, next) || changed;
        setStoreOwners(next);
      };
      const compareInquiries = (next: Inquiry[]) => {
        changed = dataChanged(inquiries, next) || changed;
        setInquiries(next);
      };

      if (activeTab === "dashboard") {
        const [storeResult, itemResult, orderResult, inquiryResult] = await Promise.all([
          adminApi<{ items: Store[] }>("/api/stores?size=500"),
          adminApi<{ items: Item[] }>("/api/items?size=300"),
          adminApi<{ items: Order[] }>("/api/orders?size=500"),
          adminApi<{ items: Inquiry[] }>("/api/inquiries"),
        ]);
        compareStores(storeResult.data.items);
        compareItems(itemResult.data.items);
        compareOrders(orderResult.data.items);
        compareInquiries(inquiryResult.data.items);
      } else if (["orderInput", "orderList", "salesList", "ownerOrders"].includes(activeTab)) {
        const requests = [
          adminApi<{ items: Order[] }>("/api/orders?size=500"),
          adminApi<{ items: Store[] }>("/api/stores?size=500"),
        ] as const;
        const [orderResult, storeResult] = await Promise.all(requests);
        compareOrders(orderResult.data.items);
        compareStores(storeResult.data.items);

        if (activeTab === "orderInput") {
          const itemResult = await adminApi<{ items: Item[] }>("/api/items?size=300");
          compareItems(itemResult.data.items);
          if (selectedStoreId) {
            const orderItemResult = await adminApi<{ items: Item[] }>(`/api/items?storeId=${selectedStoreId}`);
            changed = dataChanged(orderItems, orderItemResult.data.items) || changed;
            setOrderItems(orderItemResult.data.items);
          }
        }
      } else if (activeTab === "ownerAccounts") {
        const [ownerResult, storeResult] = await Promise.all([
          adminApi<{ items: StoreOwner[] }>("/api/store-owners"),
          adminApi<{ items: Store[] }>("/api/stores?size=500"),
        ]);
        compareOwners(ownerResult.data.items);
        compareStores(storeResult.data.items);
      } else if (activeTab === "inquiries") {
        const inquiryResult = await adminApi<{ items: Inquiry[] }>("/api/inquiries");
        compareInquiries(inquiryResult.data.items);
      } else if (activeTab === "stores") {
        const [storeResult, catalogResult] = await Promise.all([
          adminApi<{ items: Store[] }>("/api/stores?size=500"),
          adminApi<{ items: MachineCatalog[] }>("/api/machines/catalogs"),
        ]);
        compareStores(storeResult.data.items);
        compareCatalogs(catalogResult.data.items);
      } else if (activeTab === "items") {
        const [storeResult, itemResult, machineResult, catalogResult] = await Promise.all([
          adminApi<{ items: Store[] }>("/api/stores?size=500"),
          adminApi<{ items: Item[] }>("/api/items?size=300"),
          adminApi<{ items: Machine[] }>("/api/machines"),
          adminApi<{ items: MachineCatalog[] }>("/api/machines/catalogs"),
        ]);
        compareStores(storeResult.data.items);
        compareItems(itemResult.data.items);
        compareMachines(machineResult.data.items);
        compareCatalogs(catalogResult.data.items);

        const nextLinkedIds = await fetchMachineLinkedItemIds(catalogResult.data.items);
        changed = dataChanged(machineLinkedItemIds, nextLinkedIds) || changed;
        setMachineLinkedItemIds(nextLinkedIds);

        if (selectedItemStoreId) {
          const assignedResult = await adminApi<{ items: Item[] }>(`/api/items?storeId=${selectedItemStoreId}`);
          changed = dataChanged(storeAssignedItems, assignedResult.data.items) || changed;
          setStoreAssignedItems(assignedResult.data.items);
        }
        if (selectedMachineCatalogId) {
          const catalogAssignedResult = await adminApi<{ items: Item[] }>(`/api/machines/catalogs/${selectedMachineCatalogId}/items`);
          changed = dataChanged(catalogAssignedItems, catalogAssignedResult.data.items) || changed;
          setCatalogAssignedItems(catalogAssignedResult.data.items);
        }
      } else if (activeTab === "accounts") {
        const accountResult = await adminApi<{ items: BankAccount[] }>("/api/bank-accounts");
        compareAccounts(accountResult.data.items);
      } else if (activeTab === "logs") {
        changed = false;
      }

      const message = changed
        ? `${activeInfo.label} 새로고침 완료: 변경된 데이터가 있습니다.`
        : `${activeInfo.label} 새로고침 완료: 변경된 데이터가 없습니다.`;
      setNotice(message);
      writeLog(`${activeInfo.label} 새로고침`, { changed, tab: activeTab });
    } catch (error: any) {
      setNotice(`${activeInfo.label} 새로고침 실패: ${error?.message || error?.code || "요청을 확인해주세요"}`);
      writeLog(`${activeInfo.label} 새로고침 실패`, error);
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < 650) {
        await new Promise((resolve) => window.setTimeout(resolve, 650 - elapsed));
      }
      setRefreshLoading(false);
    }
  };

  useEffect(() => {
    run("초기 데이터 조회", loadAll);
  }, []);

  useEffect(() => {
    run("주문 거래처별 품목 조회", () => loadOrderItems(selectedStoreId));
  }, [selectedStoreId]);

  useEffect(() => {
    run("품목관리 거래처별 품목 조회", () => loadStoreAssignedItems(selectedItemStoreId));
  }, [selectedItemStoreId]);

  useEffect(() => {
    run("머신별 품목 조회", () => loadCatalogAssignedItems(selectedMachineCatalogId));
  }, [selectedMachineCatalogId]);

  useEffect(() => {
    if (!itemStoreSearch.trim() || !itemStoreMatches.length) return;
    const selectedIsMatched = itemStoreMatches.some((store) => store.id === Number(selectedItemStoreId));
    if (!selectedIsMatched) {
      setSelectedItemStoreId(String(itemStoreMatches[0].id));
      setSelectedMachineId("");
    }
  }, [itemStoreSearch, itemStoreMatches, selectedItemStoreId]);

  const createStore = async () => {
    const isEdit = customerFormMode === "edit" && editingStoreId;
    const result = await adminApi<{ id: number }>(isEdit ? `/api/stores/${editingStoreId}` : "/api/stores", {
      method: isEdit ? "PUT" : "POST",
      body: JSON.stringify({
        storeCode: taxInvoiceCode,
        storeName: taxInvoiceName || storeName,
        businessNumber,
        taxInvoiceCode,
        taxInvoiceName,
        machineVendor,
        machineName: customerMachineName,
        machineCatalogId: Number(customerMachineCatalogId) || null,
        deviceNumber,
        beanName,
        representativeName: ownerName,
        contact1: ownerPhone,
        contact2: contactPhone2,
        address1: customerAddress1,
        address2: customerAddress2,
        asContent,
        closureStatus,
        installedAt,
        filterReplacedAt,
        ownerName,
        ownerPhone,
        paymentType,
      }),
    });
    setSelectedStoreId(String(result.data.id || editingStoreId));
    setIsCustomerModalOpen(false);
    resetCustomerForm();
    writeLog(isEdit ? "거래처 수정" : "거래처 등록", result);
    await loadAll();
  };

  const deleteStore = async (storeId: number) => {
    const result = await adminApi(`/api/stores/${storeId}`, {
      method: "DELETE",
    });
    writeLog("거래처 삭제", result);
    await loadAll();
  };

  const changeStoreClosure = async (storeId: number, nextStatus: "운영중" | "폐업") => {
    const result = await adminApi(`/api/stores/${storeId}/closure`, {
      method: "PATCH",
      body: JSON.stringify({ closureStatus: nextStatus }),
    });
    writeLog(`거래처 ${nextStatus}`, result);
    await loadAll();
  };

  const createItem = async () => {
    const nextItemCode = itemCode.trim();
    if (!nextItemCode) {
      throw new Error("품목코드를 입력해주세요.");
    }

    const result = await adminApi<{ id: number }>("/api/items", {
      method: "POST",
      body: JSON.stringify({
        itemCode: nextItemCode,
        categoryName,
        supplierName: itemSupplierName,
        name: itemName,
        spec: itemSpec,
        unit: "EA",
        purchasePrice: Number(purchasePrice),
        salePrice: Number(salePrice),
        keywords: itemKeywords,
        storeId: Number(selectedItemStoreId) || null,
        machineId: Number(selectedMachineId) || null,
        machineCatalogId: Number(selectedMachineCatalogId) || null,
        storeSalePrice: Number(salePrice),
      }),
    });
    setSelectedItemId(String(result.data.id));
    setSelectedItemGroup(categoryName || "전체");
    writeLog("품목 등록", result);
    await loadAll();
    await loadStoreAssignedItems(selectedItemStoreId);
    await loadCatalogAssignedItems(selectedMachineCatalogId);
  };

  const addCatalogItem = async (catalogId: number, itemId: number) => {
    const result = await adminApi(`/api/machines/catalogs/${catalogId}/items`, {
      method: "POST",
      body: JSON.stringify({ itemId }),
    });
    writeLog("머신 품목 연결", result);
    await loadAll();
    await loadCatalogAssignedItems(String(catalogId));
    await loadMachineLinkedItemIds();
    if (selectedItemStoreId) await loadStoreAssignedItems(selectedItemStoreId);
  };

  const removeCatalogItem = async (catalogId: number, itemId: number) => {
    const result = await adminApi(`/api/machines/catalogs/${catalogId}/items/${itemId}`, {
      method: "DELETE",
    });
    writeLog("머신 품목 해제", result);
    await loadAll();
    await loadCatalogAssignedItems(String(catalogId));
    await loadMachineLinkedItemIds();
    if (selectedItemStoreId) await loadStoreAssignedItems(selectedItemStoreId);
  };

  const addStoreItem = async (storeId: number, itemId: number, machineId?: number | null) => {
    const item = items.find((entry) => entry.id === itemId);
    const result = await adminApi("/api/items/store-items", {
      method: "POST",
      body: JSON.stringify({
        storeId,
        itemId,
        machineId: machineId || null,
        storeSalePrice: item ? Number(item.salePrice || 0) : undefined,
      }),
    });
    writeLog("거래처 기타 품목 연결", result);
    await loadStoreAssignedItems(String(storeId));
  };

  const removeStoreItem = async (storeItemId: number) => {
    const result = await adminApi(`/api/items/store-items/${storeItemId}`, {
      method: "DELETE",
    });
    writeLog("거래처 품목 해제", result);
    await loadStoreAssignedItems(selectedItemStoreId);
  };

  const createOrder = async (
    orderLines?: Array<{ storeItemId?: number; itemId: number; itemName: string; spec?: string; quantity: number; unitPrice: number }>
  ) => {
    const selectedItem = orderItems.find((item) => item.id === Number(selectedItemId)) || items.find((item) => item.id === Number(selectedItemId));
    const nextItems = orderLines?.length
      ? orderLines
      : [
          {
            itemId: Number(selectedItemId) || 0,
            storeItemId: selectedItem?.storeItemId,
            itemName: selectedItem?.name || itemName,
            spec: selectedItem?.spec || itemSpec,
            quantity: Number(quantity),
            unitPrice: Number(selectedItem?.salePrice || salePrice),
          },
        ];
    const result = await adminApi<{ id: number; orderNo: string }>("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        storeId: Number(selectedStoreId),
        requestChannel: "ADMIN",
        paymentMethod: "BANK_TRANSFER",
        requestMemo: manualOrderMemo || "카카오톡/전화/문자로 접수된 주문을 본사가 입력",
        manualApproved: false,
        paymentType,
        items: nextItems.map((line) => ({
          storeItemId: line.storeItemId || null,
          itemId: line.itemId || null,
          itemName: line.itemName,
          spec: line.spec || null,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
      }),
    });
    writeLog("수동 주문 입력", result);
    await loadAll();
    changeTab("orderInput");
  };

  const startOrder = async (orderId: number) => {
    const result = await adminApi(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        orderStatus: "ORDER_IN_PROGRESS",
        memo: "결제완료 또는 수동예외 주문 확인 후 발주 진행",
      }),
    });
    writeLog("발주 진행", result);
    await loadAll();
  };

  const confirmPayment = async (order: Order) => {
    const remain = Number(order.totalAmount) - Number(order.paidAmount || 0);
    const result = await adminApi(`/api/orders/${order.id}/shop-payment`, {
      method: "POST",
      body: JSON.stringify({
        amount: remain > 0 ? remain : 0,
        paymentMethod: order.paymentMethod || "BANK_TRANSFER",
        payerName: order.storeName,
        memo: "관리자 입금 확인으로 결제완료 처리",
      }),
    });
    writeLog("결제완료 반영", result);
    await loadAll();
  };

  const createBankAccount = async () => {
    const result = await adminApi<{ id: number }>("/api/bank-accounts", {
      method: "POST",
      body: JSON.stringify({ bankName, accountNumber, accountHolder, accountName: "기본 입금 계좌" }),
    });
    writeLog("계좌 등록", result);
    await loadAll();
  };

  const createStoreOwner = async () => {
    const result = await adminApi<{ id: number }>("/api/store-owners", {
      method: "POST",
      body: JSON.stringify({
        storeId: Number(selectedItemStoreId || selectedStoreId),
        loginId: ownerLoginId,
        name: ownerAccountName,
        phone: ownerAccountPhone,
        email: ownerAccountEmail,
      }),
    });
    writeLog("점주 계정 등록", result);
    await loadAll();
  };

  const answerInquiry = async (inquiryId: number) => {
    const result = await adminApi(`/api/inquiries/${inquiryId}/answer`, {
      method: "PATCH",
      body: JSON.stringify({ answer: inquiryAnswer, status: "ANSWERED" }),
    });
    writeLog("문의 답변", result);
    await loadAll();
  };

  const tabProps = {
    stats,
    dashboardOrderChart,
    stores,
    items,
    orderItems,
    storeAssignedItems,
    catalogAssignedItems,
    machineLinkedItemIds,
    machines,
    machineCatalogs,
    orders,
    bankAccounts,
    storeOwners,
    inquiries,
    log,
    setLog,
    readyOrders,
    paymentWaitingOrders,
    inProgressOrders,
    filteredStores,
    customerFormMode,
    editingStoreId,
    itemGroups,
    filteredItems,
    itemStoreMatches,
    selectedItemStore,
    selectedItemStoreMachines,
    selectedStoreId,
    setSelectedStoreId,
    selectedItemId,
    setSelectedItemId,
    selectedItemStoreId,
    setSelectedItemStoreId,
    selectedMachineId,
    setSelectedMachineId,
    selectedMachineCatalogId,
    setSelectedMachineCatalogId,
    storeName,
    setStoreName,
    businessNumber,
    setBusinessNumber,
    taxInvoiceCode,
    setTaxInvoiceCode,
    taxInvoiceName,
    setTaxInvoiceName,
    machineVendor,
    setMachineVendor,
    customerMachineName,
    setCustomerMachineName,
    customerMachineCatalogId,
    setCustomerMachineCatalogId,
    deviceNumber,
    setDeviceNumber,
    beanName,
    setBeanName,
    ownerName,
    setOwnerName,
    ownerPhone,
    setOwnerPhone,
    contactPhone2,
    setContactPhone2,
    customerAddress1,
    setCustomerAddress1,
    customerAddress2,
    setCustomerAddress2,
    asContent,
    setAsContent,
    closureStatus,
    setClosureStatus,
    installedAt,
    setInstalledAt,
    filterReplacedAt,
    setFilterReplacedAt,
    paymentType,
    setPaymentType,
    customerSearchField,
    setCustomerSearchField,
    customerSearchInput,
    setCustomerSearchInput,
    customerSearchKeyword,
    setCustomerSearchKeyword,
    isCustomerModalOpen,
    setIsCustomerModalOpen,
    openCustomerCreateModal,
    openCustomerEditModal,
    itemName,
    setItemName,
    itemSpec,
    setItemSpec,
    categoryName,
    setCategoryName,
    itemSupplierName,
    setItemSupplierName,
    itemCode,
    setItemCode,
    itemKeywords,
    setItemKeywords,
    itemSearch,
    setItemSearch,
    itemStoreSearch,
    setItemStoreSearch,
    selectedItemGroup,
    setSelectedItemGroup,
    purchasePrice,
    setPurchasePrice,
    salePrice,
    setSalePrice,
    quantity,
    setQuantity,
    manualOrderMemo,
    setManualOrderMemo,
    bankName,
    setBankName,
    accountNumber,
    setAccountNumber,
    accountHolder,
    setAccountHolder,
    ownerLoginId,
    setOwnerLoginId,
    ownerAccountName,
    setOwnerAccountName,
    ownerAccountPhone,
    setOwnerAccountPhone,
    ownerAccountEmail,
    setOwnerAccountEmail,
    inquiryAnswer,
    setInquiryAnswer,
    changeTab,
    run,
    createStore,
    deleteStore,
    changeStoreClosure,
    createItem,
    addCatalogItem,
    removeCatalogItem,
    addStoreItem,
    removeStoreItem,
    createOrder,
    startOrder,
    confirmPayment,
    createBankAccount,
    createStoreOwner,
    answerInquiry,
  };

  return {
    activeGroup,
    activeTab,
    activeInfo,
    notice,
    refreshLoading,
    changeGroup,
    changeTab,
    run,
    loadAll,
    refreshCurrentTab,
    tabProps,
  };
}
