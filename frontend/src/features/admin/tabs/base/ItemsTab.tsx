import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DataTable, Field, Panel } from "../../components/common";
import type { Item, MachineCatalog } from "../../types";
import { money, wonNumber } from "../../utils/format";
import type { AdminTabProps } from "../types";

type ItemMode = "hierarchy" | "all";

export function ItemsTab(props: AdminTabProps) {
  const {
    categoryName,
    setCategoryName,
    run,
    createItem,
    itemCode,
    setItemCode,
    itemName,
    setItemName,
    itemSpec,
    setItemSpec,
    itemSupplierName,
    setItemSupplierName,
    purchasePrice,
    setPurchasePrice,
    salePrice,
    setSalePrice,
    itemKeywords,
    setItemKeywords,
    items,
    setSelectedItemId,
    machineCatalogs,
    catalogAssignedItems,
    machineLinkedItemIds,
    selectedMachineCatalogId,
    setSelectedMachineCatalogId,
    addCatalogItem,
    removeCatalogItem,
    refreshAction,
  } = props;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<ItemMode>("hierarchy");
  const [connectedItemSearch, setConnectedItemSearch] = useState("");
  const [candidateItemSearch, setCandidateItemSearch] = useState("");
  const [allItemSearch, setAllItemSearch] = useState("");

  const selectedCatalog = (machineCatalogs as MachineCatalog[]).find(
    (catalog) => catalog.id === Number(selectedMachineCatalogId)
  );

  const allMachineLinkedItemIds = useMemo(
    () => new Set((machineLinkedItemIds as number[]) || []),
    [machineLinkedItemIds]
  );

  const machineCandidateItems = useMemo(
    () => (items as Item[]).filter((item) => !allMachineLinkedItemIds.has(item.id)),
    [items, allMachineLinkedItemIds]
  );

  const connectedMachineItems = useMemo(
    () => (catalogAssignedItems as Item[]).filter((item) => itemMatches(item, connectedItemSearch)),
    [catalogAssignedItems, connectedItemSearch]
  );

  const candidateMachineItems = useMemo(
    () => machineCandidateItems.filter((item) => itemMatches(item, candidateItemSearch)),
    [machineCandidateItems, candidateItemSearch]
  );

  const filteredAllItems = useMemo(
    () => (items as Item[]).filter((item) => itemMatches(item, allItemSearch)),
    [items, allItemSearch]
  );

  const openCreate = () => {
    setItemCode("");
    setCategoryName("");
    setItemSupplierName("");
    setItemName("");
    setItemSpec("");
    setPurchasePrice("");
    setSalePrice("");
    setItemKeywords("");
    setIsModalOpen(true);
  };

  const openEdit = (item: Item) => {
    setSelectedItemId(String(item.id));
    setItemCode(item.itemCode || String(item.id).padStart(5, "0"));
    setCategoryName(item.categoryName || "");
    setItemSupplierName(item.supplierName || "");
    setItemName(item.name);
    setItemSpec(item.spec || "");
    setPurchasePrice(wonNumber(item.purchasePrice || 0));
    setSalePrice(wonNumber(item.salePrice || 0));
    setItemKeywords(item.keywords || "");
    if (item.machineCatalogId) setSelectedMachineCatalogId(String(item.machineCatalogId));
    setIsModalOpen(true);
  };

  const rowActions = (action: ReactNode) => (
    <div key="actions" className="tableActions">
      {action}
    </div>
  );

  const compactRows = (source: Item[], action: (item: Item) => ReactNode, linkLabel?: (item: Item) => string) =>
    source.map((item, index) => [
      <span key="rowNo" className="rowNo">{index + 1}</span>,
      item.itemCode || String(item.id).padStart(5, "0"),
      item.supplierName || "",
      <button key="name" className="linkButton" onClick={() => openEdit(item)}>{item.name}</button>,
      item.spec || "",
      <span key="purchase" className="amountText">{money(item.purchasePrice)}</span>,
      <span key="sale" className="amountText">{money(item.salePrice)}</span>,
      rowActions(action(item)),
    ]);

  const fullRows = (source: Item[]) =>
    source.map((item, index) => [
      <span key="rowNo" className="rowNo">{index + 1}</span>,
      <button key="code" className="linkButton" onClick={() => openEdit(item)}>
        {item.itemCode || String(item.id).padStart(5, "0")}
      </button>,
      item.categoryName || "",
      item.supplierName || "",
      <button key="name" className="linkButton" onClick={() => openEdit(item)}>{item.name}</button>,
      item.spec || "",
      <span key="purchase" className="amountText">{money(item.purchasePrice)}</span>,
      <span key="sale" className="amountText">{money(item.salePrice)}</span>,
      item.isActive === 0 ? "NO" : "YES",
    ]);

  return (
    <section className="itemManagement">
      <Panel title="품목 관리" description="머신별 기본 품목과 거래처별 기타 품목을 분리해서 관리합니다." action={refreshAction}>
        <div className="itemTopBar">
          <div className="itemTabBar">
            <button className={mode === "hierarchy" ? "" : "sub"} onClick={() => setMode("hierarchy")}>계층그룹명</button>
            <button className={mode === "all" ? "" : "sub"} onClick={() => setMode("all")}>전체 품목</button>
          </div>
          <div className="itemCreateBar">
            <button onClick={openCreate}>품목등록</button>
          </div>
        </div>

        {mode === "hierarchy" && (
          <div className="itemModeStack">
            <div className="machineGroupBar">
              {(machineCatalogs as MachineCatalog[]).map((catalog) => (
                <button
                  key={catalog.id}
                  className={selectedMachineCatalogId === String(catalog.id) ? "machineGroup active" : "machineGroup"}
                  onClick={() => setSelectedMachineCatalogId(String(catalog.id))}
                >
                  <span className="machineGroupText">
                    <strong className="machineCompanyName">{catalog.companyName}</strong>
                    <span className="machineModelName">({catalog.modelName})</span>
                  </span>
                  <em className="machineItemCount">{catalog.itemCount || 0}개</em>
                </button>
              ))}
            </div>

            <div className="itemSectionHead">
              <strong>{selectedCatalog ? `${selectedCatalog.modelName} / ${selectedCatalog.companyName}` : "머신을 선택하세요"}</strong>
              <span>왼쪽은 현재 머신 기본 품목, 오른쪽은 해당 머신에 추가할 수 있는 기타 후보 품목입니다.</span>
            </div>

            <div className="itemSplitGrid">
              <div className="itemSplitPanel">
                <div className="splitPanelHeader">
                  <div>
                    <strong>등록된 품목</strong>
                    <span>{connectedMachineItems.length} / {(catalogAssignedItems as Item[]).length}</span>
                  </div>
                  <input value={connectedItemSearch} onChange={(event) => setConnectedItemSearch(event.target.value)} placeholder="등록 품목 검색" />
                </div>
                <DataTable
                  headers={["", "품목코드", "제품업체", "품목명", "규격", "입고단가", "출고단가", "관리"]}
                  rows={compactRows(connectedMachineItems, (item) => (
                    <button
                      key="remove"
                      className="tableActionButton close"
                      onClick={() => selectedCatalog && run("머신 품목 해제", () => removeCatalogItem(selectedCatalog.id, item.id))}
                    >
                      해제
                    </button>
                  ))}
                />
              </div>
              <div className="itemSplitPanel">
                <div className="splitPanelHeader">
                  <div>
                    <strong>기타 후보 품목</strong>
                    <span>{candidateMachineItems.length} / {machineCandidateItems.length}</span>
                  </div>
                  <input value={candidateItemSearch} onChange={(event) => setCandidateItemSearch(event.target.value)} placeholder="후보 품목 검색" />
                </div>
                <DataTable
                  headers={["", "품목코드", "제품업체", "품목명", "규격", "입고단가", "출고단가", "관리"]}
                  rows={compactRows(candidateMachineItems, (item) => (
                    <button
                      key="add"
                      className="tableActionButton restore"
                      disabled={!selectedCatalog}
                      onClick={() => selectedCatalog && run("머신 품목 연결", () => addCatalogItem(selectedCatalog.id, item.id))}
                    >
                      추가
                    </button>
                  ))}
                />
              </div>
            </div>
          </div>
        )}

        {mode === "all" && (
          <div className="itemModeStack itemAllPanel">
            <div className="itemSectionHead itemAllSectionHead">
              <div>
                <strong>전체 품목 리스트</strong>
                <span>{filteredAllItems.length} / {(items as Item[]).length}</span>
              </div>
              <div className="itemAllSearch">
                <input
                  value={allItemSearch}
                  onChange={(event) => setAllItemSearch(event.target.value)}
                  placeholder="품목코드, 분류, 품목명, 규격 검색"
                />
                <button className="sub" onClick={() => setAllItemSearch("")}>초기화</button>
              </div>
            </div>
            <DataTable
              headers={["", "품목코드", "분류", "제품업체", "품목명", "규격정보", "입고단가", "출고단가", "사용"]}
              rows={fullRows(filteredAllItems)}
            />
          </div>
        )}
      </Panel>

      {isModalOpen && (
        <div className="modalBackdrop" role="dialog" aria-modal="true">
          <section className="modal customerModal">
            <div className="modalHead">
              <div>
                <h2>품목등록</h2>
                <p>품목 원장을 등록하고 선택한 머신에도 바로 연결할 수 있습니다.</p>
              </div>
              <button className="sub" onClick={() => setIsModalOpen(false)}>닫기</button>
            </div>
            <div className="formGrid customerFormGrid">
              <label>
                연결 머신
                <select value={selectedMachineCatalogId} onChange={(event) => setSelectedMachineCatalogId(event.target.value)}>
                  <option value="">선택 안함</option>
                  {(machineCatalogs as MachineCatalog[]).map((catalog) => (
                    <option key={catalog.id} value={catalog.id}>
                      {catalog.machineCode} / {catalog.modelName} / {catalog.companyName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>품목코드</span>
                <div className="fieldControl">
                  <input value={itemCode} onChange={(event) => setItemCode(event.target.value)} />
                  <small>기존 품목코드 컬럼에 저장될 값입니다. 자동생성 없이 직접 입력하세요.</small>
                </div>
              </label>
              <Field label="분류" value={categoryName} onChange={setCategoryName} />
              <Field label="제품업체" value={itemSupplierName} onChange={setItemSupplierName} />
              <Field label="품목명" value={itemName} onChange={setItemName} />
              <Field label="규격정보" value={itemSpec} onChange={setItemSpec} />
              <Field label="입고단가" value={purchasePrice} onChange={setPurchasePrice} />
              <Field label="출고단가" value={salePrice} onChange={setSalePrice} />
            </div>
            <div className="modalActions">
              <button className="sub" onClick={() => setIsModalOpen(false)}>취소</button>
              <button onClick={() => run("품목 저장", async () => { await createItem(); setIsModalOpen(false); })}>저장</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function itemMatches(item: Item, keyword: string) {
  const nextKeyword = keyword.trim().toLowerCase();
  if (!nextKeyword) return true;

  return [
    item.itemCode,
    item.categoryName,
    item.supplierName,
    item.name,
    item.spec,
    item.keywords,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(nextKeyword);
}
