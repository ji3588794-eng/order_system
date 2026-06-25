import { useMemo, useState } from "react";
import { Field, OrderTable, Panel } from "../../components/common";
import { AdminStatementModal, type StatementDetail } from "../../components/AdminStatementModal";
import { adminApi } from "../../services/adminApi";
import type { Item, Order, Store } from "../../types";
import { money, paymentLabel, paymentStatusLabel, wonNumber } from "../../utils/format";
import type { AdminTabProps } from "../types";

type CartLine = {
  key: string;
  storeItemId?: number;
  itemId: number;
  itemName: string;
  spec?: string;
  machineName?: string;
  quantity: number;
  unitPrice: number;
};

const paymentStatusOptions = [
  { value: "ALL", label: "전체" },
  { value: "UNPAID", label: "미결제" },
  { value: "PARTIAL_PAID", label: "부분결제" },
  { value: "PAID", label: "결제완료" },
  { value: "MONTHLY_BILLING", label: "월결제" },
  { value: "MANUAL_APPROVED", label: "수동예외" },
  { value: "REFUNDED", label: "환불" },
] as const;

export function OrderInputTab(props: AdminTabProps) {
  const {
    selectedStoreId,
    setSelectedStoreId,
    selectedItemId,
    setSelectedItemId,
    quantity,
    setQuantity,
    salePrice,
    setSalePrice,
    stores,
    orderItems,
    itemName,
    setItemName,
    itemSpec,
    setItemSpec,
    manualOrderMemo,
    setManualOrderMemo,
    paymentType,
    setPaymentType,
    orders,
    run,
    createOrder,
    confirmPayment,
    refreshAction,
  } = props;

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [orderKeyword, setOrderKeyword] = useState("");
  const [statementDetail, setStatementDetail] = useState<StatementDetail | null>(null);
  const [itemDetail, setItemDetail] = useState<StatementDetail | null>(null);

  const selectedStore = (stores as Store[]).find((store) => store.id === Number(selectedStoreId));
  const cartTotal = cartLines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const cartQuantity = cartLines.reduce((sum, line) => sum + line.quantity, 0);

  const sourceOrders = orders as Order[];
  const paymentStatusCounts = useMemo(() => {
    return sourceOrders.reduce<Record<string, number>>(
      (counts, order) => {
        counts.ALL += 1;
        counts[order.paymentStatus] = (counts[order.paymentStatus] || 0) + 1;
        return counts;
      },
      { ALL: 0 }
    );
  }, [sourceOrders]);

  const orderStoreNames = useMemo(() => {
    return Array.from(new Set(sourceOrders.map((order) => order.storeName).filter(Boolean))).sort();
  }, [sourceOrders]);

  const visiblePaymentOrders = useMemo(() => {
    const storeKeyword = storeFilter.trim().toLowerCase();
    const keyword = orderKeyword.trim().toLowerCase();

    return sourceOrders.filter((order) => {
      const orderDate = (order.orderDate || "").slice(0, 10);

      if (paymentStatusFilter !== "ALL" && order.paymentStatus !== paymentStatusFilter) return false;
      if (dateFrom && (!orderDate || orderDate < dateFrom)) return false;
      if (dateTo && (!orderDate || orderDate > dateTo)) return false;
      if (storeKeyword && !order.storeName.toLowerCase().includes(storeKeyword)) return false;

      if (keyword) {
        const haystack = [
          order.id,
          order.orderNo,
          order.storeName,
          order.ownerName,
          order.itemSummary,
          order.requestChannel,
          order.paymentMethod,
          order.paymentStatus,
          order.orderStatus,
          order.totalAmount,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(keyword)) return false;
      }

      return true;
    });
  }, [dateFrom, dateTo, orderKeyword, paymentStatusFilter, sourceOrders, storeFilter]);

  const storeMatches = useMemo(() => {
    const keyword = storeSearch.trim().toLowerCase();
    const source = stores as Store[];
    if (!keyword) return source.slice(0, 8);
    return source
      .filter((store) =>
        [
          store.storeName,
          store.taxInvoiceName,
          store.taxInvoiceCode,
          store.storeCode,
          store.ownerName,
          store.representativeName,
          store.contact1,
          store.ownerPhone,
          store.machineNames,
          store.machineName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword)
      )
      .slice(0, 10);
  }, [storeSearch, stores]);

  const itemMatches = useMemo(() => {
    const keyword = itemSearch.trim().toLowerCase();
    const source = orderItems as Item[];
    if (!keyword) return source;
    return source.filter((item) =>
      [item.itemCode, item.name, item.categoryName, item.spec, item.machineName, item.keywords]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [itemSearch, orderItems]);

  const selectStore = (store: Store) => {
    setSelectedStoreId(String(store.id));
    setStoreSearch(store.taxInvoiceName || store.storeName);
    setPaymentType(store.paymentType || "PREPAID");
    setSelectedItemId("");
    setItemName("");
    setItemSpec("");
    setSalePrice("");
    setItemSearch("");
    setCartLines([]);
  };

  const addItemToCart = (item: Item) => {
    const key = `${item.id}-${item.machineId || "master"}`;
    setSelectedItemId(String(item.id));
    setItemName(item.name);
    setItemSpec(item.spec || "");
    setSalePrice(wonNumber(item.salePrice || 0));
    setCartLines((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) {
        return current.map((line) => (line.key === key ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [
        ...current,
        {
          key,
          storeItemId: item.storeItemId,
          itemId: item.id,
          itemName: item.name,
          spec: item.spec || "",
          machineName: item.machineName || "",
          quantity: 1,
          unitPrice: Number(item.salePrice || 0),
        },
      ];
    });
  };

  const updateCartQuantity = (key: string, nextQuantity: number) => {
    setCartLines((current) =>
      current.map((line) => (line.key === key ? { ...line, quantity: Math.max(nextQuantity || 1, 1) } : line))
    );
  };

  const removeCartLine = (key: string) => {
    setCartLines((current) => current.filter((line) => line.key !== key));
  };

  const openCreate = () => {
    setSelectedStoreId("");
    setSelectedItemId("");
    setQuantity("1");
    setSalePrice("");
    setStoreSearch("");
    setItemSearch("");
    setCartLines([]);
    setManualOrderMemo("전화/문자 접수로 인한 관리자 수동 주문");
    setIsOrderModalOpen(true);
  };

  const submitOrder = async () => {
    await createOrder(
      cartLines.map((line) => ({
        itemId: line.itemId,
        storeItemId: line.storeItemId,
        itemName: line.itemName,
        spec: line.spec,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      }))
    );
    setPaymentStatusFilter("UNPAID");
    setIsOrderModalOpen(false);
  };

  const resetOrderFilters = () => {
    setPaymentStatusFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setStoreFilter("");
    setOrderKeyword("");
  };

  const openStatement = async (order: Order) => {
    const result = await adminApi<StatementDetail>(`/api/orders/${order.id}`);
    setStatementDetail(result.data);
  };

  const openItemDetail = async (order: Order) => {
    const result = await adminApi<StatementDetail>(`/api/orders/${order.id}`);
    setItemDetail(result.data);
  };

  return (
    <section className="tabPage">
      <Panel title="주문리스트" description="사용자 주문과 수동 주문의 결제상태를 확인합니다." action={refreshAction}>
        <div className="customerToolbar manualPaymentToolbar">
          <div className="paymentTabs orderStatusTabs">
            {paymentStatusOptions.map((option) => (
              <button
                key={option.value}
                className={paymentStatusFilter === option.value ? "paymentTab active" : "paymentTab"}
                onClick={() => setPaymentStatusFilter(option.value)}
              >
                {option.label} {paymentStatusCounts[option.value] || 0}
              </button>
            ))}
          </div>
          <button onClick={openCreate}>수동주문등록</button>
        </div>

        <div className="orderSearchPanel">
          <label>
            시작일
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label>
            종료일
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
          <label>
            거래처명
            <input
              list="order-store-filter-options"
              value={storeFilter}
              onChange={(event) => setStoreFilter(event.target.value)}
              placeholder="거래처명 선택 또는 입력"
            />
            <datalist id="order-store-filter-options">
              {orderStoreNames.map((storeName) => (
                <option key={storeName} value={storeName} />
              ))}
            </datalist>
          </label>
          <label className="orderKeywordField">
            통합검색
            <input
              value={orderKeyword}
              onChange={(event) => setOrderKeyword(event.target.value)}
              placeholder="주문번호, 품목명, 거래처명"
            />
          </label>
          <button type="button" className="sub" onClick={resetOrderFilters}>
            초기화
          </button>
          <span className="orderSearchCount">조회 {visiblePaymentOrders.length}건</span>
        </div>

        <OrderTable
          orders={visiblePaymentOrders}
          hideDueDate
          hideOrderStatus
          itemActions={(order) => (
            <button className="itemDetailButton" onClick={() => run("품목 상세 조회", () => openItemDetail(order))}>
              {order.itemSummary || "품목상세"}
            </button>
          )}
          actions={(order) =>
            ["UNPAID", "PARTIAL_PAID"].includes(order.paymentStatus) ? (
              <button
                className="lookupButton"
                onClick={() =>
                  run("결제확인", async () => {
                    await confirmPayment(order);
                    setPaymentStatusFilter("PAID");
                  })
                }
              >
                결제확인
              </button>
            ) : (
              <span className="paidBadge">{paymentStatusLabel(order.paymentStatus)}</span>
            )
          }
          printActions={(order) => (
            <button className="printButton" onClick={() => run("명세서 조회", () => openStatement(order))}>
              명세서
            </button>
          )}
        />
      </Panel>

      <AdminStatementModal detail={statementDetail} onClose={() => setStatementDetail(null)} />
      <OrderItemDetailModal detail={itemDetail} onClose={() => setItemDetail(null)} />

      {isOrderModalOpen && (
        <div className="modalBackdrop" role="dialog" aria-modal="true">
          <section className="modal customerModal orderWriteModal">
            <div className="modalHead">
              <div>
                <h2>수동주문등록</h2>
                <p>거래처와 품목을 선택하면 수량과 합계가 즉시 계산됩니다.</p>
              </div>
              <button className="sub" onClick={() => setIsOrderModalOpen(false)}>
                닫기
              </button>
            </div>

            <div className="orderWriteGrid">
              <section className="orderPickPanel">
                <h3>거래처 검색</h3>
                <input
                  value={storeSearch}
                  onChange={(event) => setStoreSearch(event.target.value)}
                  placeholder="거래처명, 세금계산서명, 연락처 검색"
                />
                <div className="pickList">
                  {storeMatches.map((store) => {
                    const active = selectedStoreId === String(store.id);
                    return (
                      <button key={store.id} className={active ? "pickRow active" : "pickRow"} onClick={() => selectStore(store)}>
                        <strong>{store.taxInvoiceName || store.storeName}</strong>
                        <span>{store.machineNames || store.machineName || "머신 미등록"}</span>
                        <em>{paymentLabel(store.paymentType)}</em>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="orderPickPanel">
                <h3>품목 검색 / 여러 개 담기</h3>
                <input
                  value={itemSearch}
                  onChange={(event) => setItemSearch(event.target.value)}
                  placeholder={selectedStoreId ? "품목명, 코드, 머신명 검색" : "거래처를 먼저 선택하세요"}
                  disabled={!selectedStoreId}
                />
                <div className="pickList">
                  {!selectedStoreId ? (
                    <div className="pickEmpty">거래처를 선택하면 품목이 표시됩니다.</div>
                  ) : itemMatches.length ? (
                    itemMatches.map((item) => {
                      const active = selectedItemId === String(item.id);
                      return (
                        <button
                          key={`${item.id}-${item.machineId || "item"}`}
                          className={active ? "pickRow active" : "pickRow"}
                          onClick={() => addItemToCart(item)}
                        >
                          <strong>{item.name}</strong>
                          <span>{[item.itemCode, item.spec, item.machineName].filter(Boolean).join(" / ")}</span>
                          <em>단가 {money(item.salePrice)}</em>
                        </button>
                      );
                    })
                  ) : (
                    <div className="pickEmpty">해당 거래처에 등록된 주문 가능 품목이 없습니다.</div>
                  )}
                </div>
              </section>
            </div>

            <div className="orderCartHead">
              <div>
                <span>선택 거래처</span>
                <strong>{selectedStore?.taxInvoiceName || selectedStore?.storeName || "-"}</strong>
              </div>
              <div>
                <span>담긴 품목</span>
                <strong>
                  {cartLines.length}종 / {cartQuantity}개
                </strong>
              </div>
              <div>
                <span>결제유형</span>
                <strong>{paymentLabel(paymentType)}</strong>
              </div>
              <div>
                <span>총 주문금액</span>
                <strong>{money(cartTotal)}</strong>
              </div>
            </div>

            <div className="orderCartTable">
              <div className="orderCartHeader">
                <span>품목명</span>
                <span>규격/머신</span>
                <span>단가</span>
                <span>수량</span>
                <span>금액</span>
                <span>관리</span>
              </div>
              {cartLines.length ? (
                cartLines.map((line) => (
                  <div key={line.key} className="orderCartRow">
                    <strong>{line.itemName}</strong>
                    <span>{[line.spec, line.machineName].filter(Boolean).join(" / ") || "-"}</span>
                    <span>{money(line.unitPrice)}</span>
                    <input type="number" min="1" value={line.quantity} onChange={(event) => updateCartQuantity(line.key, Number(event.target.value))} />
                    <span className="amountText">{money(line.quantity * line.unitPrice)}</span>
                    <button className="tableActionButton close" onClick={() => removeCartLine(line.key)}>
                      삭제
                    </button>
                  </div>
                ))
              ) : (
                <div className="orderCartEmpty">품목을 검색해 클릭하면 여기에 담깁니다.</div>
              )}
            </div>

            <div className="formGrid">
              <Field label="주문 메모" value={manualOrderMemo} onChange={setManualOrderMemo} />
            </div>

            <div className="modalActions">
              <button className="sub" onClick={() => setIsOrderModalOpen(false)}>
                취소
              </button>
              <button disabled={!selectedStoreId || !cartLines.length} onClick={() => run("수동 주문 입력", submitOrder)}>
                저장
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function OrderItemDetailModal({ detail, onClose }: { detail: StatementDetail | null; onClose: () => void }) {
  if (!detail) return null;

  const { order, items } = detail;

  return (
    <div className="modalBackdrop" role="dialog" aria-modal="true">
      <section className="modal orderItemDetailModal">
        <div className="modalHead">
          <div>
            <h2>주문 품목 상세</h2>
            <p>{order.orderNo} / {order.storeName}</p>
          </div>
          <button className="sub" onClick={onClose}>닫기</button>
        </div>

        <div className="orderItemDetailSummary">
          <div>
            <span>주문번호</span>
            <strong>{order.orderNo}</strong>
          </div>
          <div>
            <span>거래처</span>
            <strong>{order.storeName}</strong>
          </div>
          <div>
            <span>점주</span>
            <strong>{order.ownerName || "-"}</strong>
          </div>
          <div>
            <span>주문금액</span>
            <strong>{money(order.totalAmount)}</strong>
          </div>
        </div>

        <div className="orderItemDetailList">
          {items.map((item) => {
            const vendorName = item.supplierName || "업체 미지정";
            const machineName = item.machineCatalogModel || item.machineModelName || "-";

            return (
              <article key={item.id} className="orderItemDetailCard">
                <div className="orderItemDetailPrimary">
                  <div>
                    <span>제품 업체</span>
                    <strong>{vendorName}</strong>
                  </div>
                  <div>
                    <span>주문 수량</span>
                    <strong>{Number(item.quantity).toLocaleString("ko-KR")}개</strong>
                  </div>
                </div>

                <div className="orderItemDetailProduct">
                  <strong>{item.itemName}</strong>
                  <span>{[item.itemCode, item.categoryName, item.spec].filter(Boolean).join(" / ") || "-"}</span>
                  <em>{money(item.totalAmount)}</em>
                </div>

                <div className="orderItemDetailGrid">
                  <div><span>머신</span><strong>{machineName}</strong></div>
                  <div><span>머신코드</span><strong>{item.machineCode || "-"}</strong></div>
                  <div><span>주문단가</span><strong>{money(item.unitPrice)}</strong></div>
                  <div><span>입고단가</span><strong>{money(item.purchasePrice || 0)}</strong></div>
                  <div><span>기준 출고가</span><strong>{money(item.masterSalePrice || 0)}</strong></div>
                  <div><span>거래처 출고가</span><strong>{item.storeSalePrice == null ? "-" : money(item.storeSalePrice)}</strong></div>
                  <div><span>품목ID</span><strong>{item.itemId || "-"}</strong></div>
                  <div><span>거래처 품목ID</span><strong>{item.storeItemId || "-"}</strong></div>
                  <div><span>연결상태</span><strong>{item.storeItemActive === 0 ? "비활성" : "사용중"}</strong></div>
                  <div className="wide"><span>연결메모</span><strong>{item.storeItemMemo || "-"}</strong></div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
