import { useState } from "react";
import { DataTable, Field, Panel } from "../../components/common";
import type { Store, StoreOwner } from "../../types";
import { money } from "../../utils/format";
import type { AdminTabProps } from "../types";

export function OwnerAccountsTab(props: AdminTabProps) {
  const {
    stores,
    selectedItemStoreId,
    setSelectedItemStoreId,
    ownerLoginId,
    setOwnerLoginId,
    ownerAccountName,
    setOwnerAccountName,
    ownerAccountPhone,
    setOwnerAccountPhone,
    ownerAccountEmail,
    setOwnerAccountEmail,
    run,
    createStoreOwner,
    storeOwners,
    refreshAction,
  } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const openCreate = () => {
    setModalMode("create");
    setOwnerLoginId("");
    setOwnerAccountName("");
    setOwnerAccountPhone("");
    setOwnerAccountEmail("");
    setIsModalOpen(true);
  };

  const openEdit = (owner: StoreOwner) => {
    setModalMode("edit");
    setSelectedItemStoreId(String(owner.storeId));
    setOwnerLoginId(owner.loginId);
    setOwnerAccountName(owner.name);
    setOwnerAccountPhone(owner.phone || "");
    setOwnerAccountEmail(owner.email || "");
    setIsModalOpen(true);
  };

  return (
    <Panel title="점주 계정" description="점주 쇼핑몰/마이페이지 로그인 계정을 거래처별로 관리합니다." action={refreshAction}>
      <div className="customerToolbar">
        <div />
        <button onClick={openCreate}>점주계정등록</button>
      </div>
      <DataTable
        headers={["", "거래처명", "로그인ID", "점주명", "연락처", "이메일", "주문건수", "구매금액", "문의건수", "사용", "관리"]}
        rows={(storeOwners as StoreOwner[]).map((owner, index) => [
          <span key="rowNo" className="rowNo">{index + 1}</span>,
          owner.storeName,
          <button key="login" className="linkButton" onClick={() => openEdit(owner)}>{owner.loginId}</button>,
          owner.name,
          owner.phone || "",
          owner.email || "",
          owner.orderCount,
          <span key="amount" className="amountText">{money(owner.orderAmount)}</span>,
          owner.inquiryCount,
          owner.isActive ? "YES" : "NO",
          <button key="edit" className="lookupButton" onClick={() => openEdit(owner)}>수정</button>,
        ])}
      />

      {isModalOpen && (
        <div className="modalBackdrop" role="dialog" aria-modal="true">
          <section className="modal customerModal">
            <div className="modalHead">
              <div>
                <h2>{modalMode === "edit" ? "점주 계정 수정" : "점주 계정 등록"}</h2>
                <p>거래처별 쇼핑몰 로그인 계정을 저장합니다.</p>
              </div>
              <button className="sub" onClick={() => setIsModalOpen(false)}>닫기</button>
            </div>
            <div className="formGrid ownerForm">
              <label>
                거래처명
                <select value={selectedItemStoreId} onChange={(event) => setSelectedItemStoreId(event.target.value)}>
                  <option value="">거래처 선택</option>
                  {(stores as Store[]).map((store) => (
                    <option key={store.id} value={store.id}>{store.storeName}</option>
                  ))}
                </select>
              </label>
              <Field label="로그인 ID" value={ownerLoginId} onChange={setOwnerLoginId} />
              <Field label="점주명" value={ownerAccountName} onChange={setOwnerAccountName} />
              <Field label="연락처" value={ownerAccountPhone} onChange={setOwnerAccountPhone} />
              <Field label="이메일" value={ownerAccountEmail} onChange={setOwnerAccountEmail} />
            </div>
            <div className="modalActions">
              <button className="sub" onClick={() => setIsModalOpen(false)}>취소</button>
              <button onClick={() => run(modalMode === "edit" ? "점주 계정 수정" : "점주 계정 등록", async () => { await createStoreOwner(); setIsModalOpen(false); })}>
                {modalMode === "edit" ? "수정" : "저장"}
              </button>
            </div>
          </section>
        </div>
      )}
    </Panel>
  );
}
