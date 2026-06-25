import { useEffect, useState } from "react";
import { DataTable, Field, Panel } from "../../components/common";
import { customerSearchFields } from "../../config/navigation";
import type { CustomerSearchField, Item, MachineCatalog, Machine, Store } from "../../types";
import { formatDate } from "../../utils/format";
import type { AdminTabProps } from "../types";

function escapeExcel(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function paymentTypeLabel(value?: string) {
  return {
    PREPAID: "선결제",
    MONTHLY: "월결제",
    SPECIAL: "별도협의",
  }[value || ""] || value || "";
}

export function CustomersTab(props: AdminTabProps) {
  const {
    customerSearchField,
    setCustomerSearchField,
    customerSearchInput,
    setCustomerSearchInput,
    setCustomerSearchKeyword,
    filteredStores,
    stores,
    openCustomerCreateModal,
    openCustomerEditModal,
    refreshAction,
  } = props;
  const downloadCustomerExcel = () => {
    const exportStores = stores as Store[];
    if (!exportStores.length) {
      window.alert("다운로드할 거래처 데이터가 없습니다.");
      return;
    }

    const columns = [
      "No.",
      "세금계산서 발행코드",
      "매장명",
      "사용 머신",
      "머신코드",
      "모델명",
      "기기번호",
      "머신회사명",
      "머신매입처",
      "원두명",
      "대표자명",
      "모바일",
      "연락처2",
      "주소1",
      "주소2",
      "A/S내용",
      "설치일자",
      "필터교체일자",
      "결제유형",
      "폐업현황",
    ];

    const rows = exportStores.map((store, index) => [
      index + 1,
      store.taxInvoiceCode || store.storeCode || "",
      store.taxInvoiceName || store.storeName || "",
      store.machineName || store.machineNames || store.machineModelName || "",
      store.machineCode || "",
      store.machineModelName || store.machineName || "",
      store.deviceNumber || "",
      store.machineCompanyName || "",
      store.machineVendor || "",
      store.beanName || "",
      store.representativeName || store.ownerName || "",
      store.contact1 || store.ownerPhone || "",
      store.contact2 || "",
      store.address1 || "",
      store.address2 || "",
      store.asContent || "",
      formatDate(store.installedAt),
      formatDate(store.filterReplacedAt),
      paymentTypeLabel(store.paymentType),
      store.closureStatus || (store.isActive === 0 ? "폐업" : "운영중"),
    ]);

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: "Malgun Gothic", Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; table-layout: fixed; }
            th { background: #1456d9; color: #ffffff; border: 1px solid #8fb0ef; font-weight: 700; text-align: center; padding: 8px; }
            td { border: 1px solid #c8d4e5; padding: 7px; mso-number-format:"\\@"; vertical-align: middle; white-space: normal; }
            .title { background: #10233f; color: #ffffff; font-size: 18px; font-weight: 700; text-align: left; }
            .summary { background: #eef5ff; color: #003a91; font-weight: 700; }
            .center { text-align: center; }
            .code { color: #003a91; font-weight: 700; }
            .name { color: #003a91; font-weight: 700; }
          </style>
        </head>
        <body>
          <table>
            <colgroup>
              ${columns.map((_, index) => `<col style="width:${index === 0 ? 48 : index === 13 || index === 14 ? 260 : index === 15 ? 220 : 130}px" />`).join("")}
            </colgroup>
            <tr><td class="title" colspan="${columns.length}">거래처 관리 다운로드</td></tr>
            <tr><td class="summary" colspan="${columns.length}">다운로드 데이터: ${exportStores.length}건 / 전체 데이터: ${(stores as Store[]).length}건</td></tr>
            <tr>${columns.map((column) => `<th>${escapeExcel(column)}</th>`).join("")}</tr>
            ${rows
              .map(
                (row) =>
                  `<tr>${row
                    .map((cell, index) => `<td class="${index === 0 || index === 16 || index === 17 || index === 18 || index === 19 ? "center" : index === 1 || index === 4 ? "code" : index === 2 ? "name" : ""}">${escapeExcel(cell)}</td>`)
                    .join("")}</tr>`
              )
              .join("")}
          </table>
        </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateSuffix = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `거래처관리_${dateSuffix}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Panel title="거래처 관리" description="세금계산서, 머신, 연락처, 설치 정보를 거래처별로 관리합니다." action={refreshAction}>
      <div className="customerToolbar">
        <div className="customerSearchBox">
          <div className="customerResultCount">
            <span>전체 <strong>{stores.length}</strong></span>
            <span>검색 <strong>{filteredStores.length}</strong></span>
          </div>
          <select value={customerSearchField} onChange={(event) => setCustomerSearchField(event.target.value as CustomerSearchField)}>
            {customerSearchFields.map((field) => (
              <option key={field.value} value={field.value}>{field.label}</option>
            ))}
          </select>
          <input
            value={customerSearchInput}
            onChange={(event) => setCustomerSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setCustomerSearchKeyword(customerSearchInput);
            }}
            placeholder="검색어 입력"
          />
          <button onClick={() => setCustomerSearchKeyword(customerSearchInput)}>검색</button>
          <button
            className="sub"
            onClick={() => {
              setCustomerSearchInput("");
              setCustomerSearchKeyword("");
            }}
          >
            초기화
          </button>
        </div>
        <div className="customerToolbarActions">
          <button className="customerExcelButton" onClick={downloadCustomerExcel}>EXCEL 다운로드</button>
          <button className="customerRegisterButton" onClick={openCustomerCreateModal}>거래처등록</button>
        </div>
      </div>

      <div className="customerTable">
        <DataTable
          headers={[
            "No.",
            "세금계산서 발행코드",
            "매장명",
            "모델명",
            "대표자명",
            "모바일",
            "주소1",
            "주소2",
            "설치일자",
          ]}
          rows={(filteredStores as Store[]).map((store, index) => {
            const currentClosureStatus = store.closureStatus || (store.isActive === 0 ? "폐업" : "운영중");
            const isClosed = currentClosureStatus === "폐업";

            return [
              <span key="rowNo" className="rowNo">{index + 1}</span>,
              store.taxInvoiceCode || store.storeCode || "",
              <button key="name" className="linkButton customerNameLink" onClick={() => openCustomerEditModal(store)}>
                {isClosed ? "[폐업] " : ""}{store.taxInvoiceName || store.storeName}
              </button>,
              store.machineModelName || store.machineName || "",
              store.representativeName || store.ownerName || "",
              store.contact1 || store.ownerPhone || "",
              store.address1 || "",
              store.address2 || "",
              formatDate(store.installedAt),
            ];
          })}
        />
      </div>
    </Panel>
  );
}

export function CustomerModal(props: AdminTabProps) {
  const {
    isCustomerModalOpen,
    setIsCustomerModalOpen,
    customerFormMode,
    businessNumber,
    setBusinessNumber,
    taxInvoiceCode,
    setTaxInvoiceCode,
    taxInvoiceName,
    setTaxInvoiceName,
    machineCatalogs,
    machineVendor,
    setMachineVendor,
    customerMachineCatalogId,
    setCustomerMachineCatalogId,
    customerMachineName,
    setCustomerMachineName,
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
    installedAt,
    setInstalledAt,
    filterReplacedAt,
    setFilterReplacedAt,
    paymentType,
    setPaymentType,
    editingStoreId,
    closureStatus,
    setClosureStatus,
    run,
    createStore,
    changeStoreClosure,
    items,
    storeAssignedItems,
    selectedItemStoreMachines,
    addStoreItem,
    removeStoreItem,
  } = props;
  const [addItemKeyword, setAddItemKeyword] = useState("");
  const [registeredItemKeyword, setRegisteredItemKeyword] = useState("");

  useEffect(() => {
    if (!isCustomerModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setAddItemKeyword("");
    setRegisteredItemKeyword("");

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCustomerModalOpen]);

  if (!isCustomerModalOpen) return null;

  const isEdit = customerFormMode === "edit";
  const assignedItemIds = new Set((storeAssignedItems as Item[]).map((item) => item.id));
  const addableItems = (items as Item[])
    .filter((item) => item.isActive !== 0 && !assignedItemIds.has(item.id))
    .sort((a, b) => `${a.categoryName || ""}${a.itemCode || ""}`.localeCompare(`${b.categoryName || ""}${b.itemCode || ""}`, "ko"));
  const matchesItemKeyword = (item: Item, keyword: string) => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return true;
    return [item.name, item.itemCode, item.categoryName, item.spec, item.machineName]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalized));
  };
  const filteredAddableItems = addableItems.filter((item) => matchesItemKeyword(item, addItemKeyword));
  const filteredRegisteredItems = (storeAssignedItems as Item[])
    .filter((item) => matchesItemKeyword(item, registeredItemKeyword));
  const primaryMachineId = (selectedItemStoreMachines as Machine[])[0]?.id || null;

  const handleMachineChange = (value: string) => {
    setCustomerMachineCatalogId(value);
    const catalog = (machineCatalogs as MachineCatalog[]).find((item) => item.id === Number(value));
    setCustomerMachineName(catalog?.modelName || "");
    setMachineVendor(catalog?.companyName || "");
  };

  const handleSubmit = () => {
    if (isEdit && !window.confirm("거래처 정보를 수정하시겠습니까?")) return;
    run(isEdit ? "거래처 수정" : "거래처 등록", async () => {
      await createStore();
      window.alert(isEdit ? "수정이 완료되었습니다." : "등록이 완료되었습니다.");
    });
  };

  return (
    <div className="modalBackdrop" role="dialog" aria-modal="true" aria-labelledby="customerModalTitle">
      <section className="modal customerModal customerStoreModal">
        <div className="modalHead">
          <div>
            <h2 id="customerModalTitle">{isEdit ? "거래처 수정" : "거래처등록"}</h2>
            <p>{isEdit ? "주요 정보와 주문 가능 품목을 한 화면에서 수정합니다." : "신규 거래처 기준정보와 사용할 머신을 등록합니다."}</p>
          </div>
          <button className="sub" onClick={() => setIsCustomerModalOpen(false)}>닫기</button>
        </div>
        <div className="customerModalBody">
          <div className="customerModalSummary">
            <div>
              <span>매장</span>
              <strong>{taxInvoiceName || "-"}</strong>
            </div>
            <div>
              <span>대표자</span>
              <strong>{ownerName || "-"}</strong>
            </div>
            <div>
              <span>머신</span>
              <strong>{customerMachineName || "-"}</strong>
            </div>
            <div>
              <span>{isEdit ? "주문품목" : "상태"}</span>
              <strong>{isEdit ? `${(storeAssignedItems as Item[]).length}개` : "신규"}</strong>
            </div>
          </div>
          <div className="customerFormGrid">
            <div className="customerFormHeader">
              <span>항목</span>
              <span>입력내용</span>
            </div>
            <Field label="사업자번호" value={businessNumber} onChange={setBusinessNumber} />
            <Field label="세금계산서 발행코드" value={taxInvoiceCode} onChange={setTaxInvoiceCode} />
            <Field label="매장명" value={taxInvoiceName} onChange={setTaxInvoiceName} />
            <label className="fieldWithHelp">
              <span>사용 머신</span>
              <div className="fieldControl">
                <select value={customerMachineCatalogId} onChange={(event) => handleMachineChange(event.target.value)}>
                  <option value="">머신 선택</option>
                  {(machineCatalogs as MachineCatalog[]).map((catalog) => (
                    <option key={catalog.id} value={catalog.id}>
                      {catalog.machineCode} / {catalog.modelName} / {catalog.companyName}
                    </option>
                  ))}
                </select>
                <small>머신을 선택하면 모델명과 머신매입처가 자동으로 입력됩니다.</small>
              </div>
            </label>
            <Field label="모델명" value={customerMachineName} onChange={setCustomerMachineName} />
            <Field label="기기번호" value={deviceNumber} onChange={setDeviceNumber} />
            <Field label="머신매입처" value={machineVendor} onChange={setMachineVendor} />
            <Field label="원두명" value={beanName} onChange={setBeanName} />
            <Field label="대표자명" value={ownerName} onChange={setOwnerName} />
            <Field label="모바일" value={ownerPhone} onChange={setOwnerPhone} />
            <Field label="연락처2" value={contactPhone2} onChange={setContactPhone2} />
            <Field label="주소1" value={customerAddress1} onChange={setCustomerAddress1} />
            <Field label="주소2" value={customerAddress2} onChange={setCustomerAddress2} />
            <Field label="A/S내용" value={asContent} onChange={setAsContent} />
            <Field label="설치일자" value={installedAt} onChange={setInstalledAt} type="date" />
            <Field label="필터교체일자" value={filterReplacedAt} onChange={setFilterReplacedAt} type="date" />
            <label>
              결제유형
              <select value={paymentType} onChange={(event) => setPaymentType(event.target.value)}>
                <option value="PREPAID">선결제</option>
                <option value="MONTHLY">월결제</option>
                <option value="SPECIAL">별도협의</option>
              </select>
            </label>
          </div>
          {isEdit && editingStoreId && (
            <section className="storeItemManagePanel">
            <div className="storeItemManageHead">
              <div>
                <h3>거래처 주문 품목</h3>
                <p>왼쪽에서 품목을 찾아 +를 누르면 오른쪽 등록 목록에 추가됩니다.</p>
              </div>
              <span>등록 {(storeAssignedItems as Item[]).length}개</span>
            </div>

            <div className="storeItemManageGrid">
              <div className="storeItemBox">
                <div className="storeItemBoxHead">
                  <strong>추가할 품목</strong>
                  <span>{filteredAddableItems.length} / {addableItems.length}개</span>
                </div>
                <div className="storeItemSearch">
                  <input
                    value={addItemKeyword}
                    onChange={(event) => setAddItemKeyword(event.target.value)}
                    placeholder="품목명, 코드, 규격 검색"
                  />
                  {addItemKeyword && (
                    <button type="button" onClick={() => setAddItemKeyword("")}>초기화</button>
                  )}
                </div>
                <div className="storeItemRows">
                  {filteredAddableItems.length ? (
                    filteredAddableItems.map((item) => (
                      <div key={item.id} className="storeItemRow">
                        <div>
                          <b>{item.name}</b>
                          <span>{[item.itemCode, item.categoryName, item.spec].filter(Boolean).join(" / ")}</span>
                        </div>
                        <button
                          type="button"
                          className="lookupButton"
                          onClick={() => run("거래처 품목 추가", () => addStoreItem(editingStoreId, item.id, primaryMachineId))}
                        >
                          +
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="storeItemEmpty">검색된 품목이 없습니다.</div>
                  )}
                </div>
              </div>

              <div className="storeItemTransferHint" aria-hidden="true">
                <span>추가하면</span>
                <b>&gt;</b>
                <em>등록됨</em>
              </div>

              <div className="storeItemBox">
                <div className="storeItemBoxHead">
                  <strong>등록된 품목</strong>
                  <span>{filteredRegisteredItems.length} / {(storeAssignedItems as Item[]).length}개</span>
                </div>
                <div className="storeItemSearch">
                  <input
                    value={registeredItemKeyword}
                    onChange={(event) => setRegisteredItemKeyword(event.target.value)}
                    placeholder="등록된 품목 검색"
                  />
                  {registeredItemKeyword && (
                    <button type="button" onClick={() => setRegisteredItemKeyword("")}>초기화</button>
                  )}
                </div>
                <div className="storeItemRows">
                  {filteredRegisteredItems.length ? (
                    filteredRegisteredItems.map((item) => (
                      <div key={item.storeItemId || item.id} className="storeItemRow">
                        <div>
                          <b>{item.name}</b>
                          <span>{[item.itemCode, item.categoryName, item.spec, item.machineName].filter(Boolean).join(" / ")}</span>
                        </div>
                        <button
                          type="button"
                          className="tableActionButton close"
                          onClick={() => item.storeItemId && run("거래처 품목 삭제", () => removeStoreItem(item.storeItemId))}
                        >
                          -
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="storeItemEmpty">검색된 품목이 없습니다.</div>
                  )}
                </div>
              </div>
            </div>
            </section>
          )}
        </div>
        <div className="modalActions">
          <button className="modalActionButton closeButton" onClick={() => setIsCustomerModalOpen(false)}>닫기</button>
          {isEdit && editingStoreId && (
            <button
              className={closureStatus === "폐업" ? "modalActionButton restoreButton" : "modalActionButton dangerButton"}
              onClick={() => {
                const nextStatus = closureStatus === "폐업" ? "운영중" : "폐업";
                const message = nextStatus === "폐업"
                  ? "선택한 거래처를 폐업 처리하시겠습니까?"
                  : "선택한 거래처를 운영중으로 전환하시겠습니까?";
                if (!window.confirm(message)) return;
                run(nextStatus === "폐업" ? "거래처 폐업처리" : "거래처 운영전환", async () => {
                  await changeStoreClosure(editingStoreId, nextStatus);
                  setClosureStatus(nextStatus);
                });
              }}
            >
              {closureStatus === "폐업" ? "운영전환" : "폐업처리"}
            </button>
          )}
          <button className="modalActionButton primaryButton" onClick={handleSubmit}>{isEdit ? "완료" : "저장"}</button>
        </div>
      </section>
    </div>
  );
}
