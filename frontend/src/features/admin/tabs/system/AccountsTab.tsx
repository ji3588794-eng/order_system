import { useEffect, useState } from "react";
import { DataTable, Field, Panel } from "../../components/common";
import { adminApi } from "../../services/adminApi";
import type { BankAccount } from "../../types";
import { formatDate, money } from "../../utils/format";
import type { AdminTabProps } from "../types";

type BankTransaction = {
  id: number;
  accountNumber?: string;
  transactionDate?: string;
  transactionTime?: string;
  balanceChangeCode?: string;
  amount: number;
  outline?: string;
  branchName?: string;
  balance: number;
  currencyCode?: string;
};

type BankBalance = {
  accountNumber: string;
  currentBalance: number;
  payableAmount: number;
  unclearedCheckAmount: number;
  paymentStopAmount: number;
};

type BankRefreshResult = {
  transactions: BankTransaction[];
  balances: BankBalance[];
  status: string;
  message: string;
  retryAfterMs: number;
};

function bankStatusLabel(status: string) {
  return {
    READY: "대기",
    EMPTY: "조회전",
    OK: "정상",
    COOLDOWN: "대기",
    CONFIG_REQUIRED: "설정대기",
    ERROR: "오류",
  }[status] || status;
}

function readableBankMessage(status: string, message: string) {
  if (status === "CONFIG_REQUIRED") {
    return "하나은행 API 설정 전입니다. 운영 키를 입력하면 이 화면에서 잔액과 거래내역을 조회합니다.";
  }
  return message || "하나은행 거래내역은 새로고침 버튼을 눌러 조회합니다.";
}

export function AccountsTab({
  bankName,
  setBankName,
  accountNumber,
  setAccountNumber,
  accountHolder,
  setAccountHolder,
  run,
  createBankAccount,
  bankAccounts,
  refreshAction,
}: AdminTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [balances, setBalances] = useState<BankBalance[]>([]);
  const [apiStatus, setApiStatus] = useState("READY");
  const [apiNotice, setApiNotice] = useState("하나은행 거래내역은 새로고침 버튼을 눌러 조회합니다.");
  const [retryAfterMs, setRetryAfterMs] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const primaryAccount = (bankAccounts as BankAccount[])[0];
  const latestBalance = balances[0];

  const applyBankResult = (data: BankRefreshResult) => {
    setTransactions(data.transactions || []);
    setBalances(data.balances || []);
    setApiStatus(data.status);
    setApiNotice(readableBankMessage(data.status, data.message));
    setRetryAfterMs(data.retryAfterMs || 0);
    if (data.retryAfterMs > 0) window.setTimeout(() => setRetryAfterMs(0), data.retryAfterMs);
  };

  useEffect(() => {
    adminApi<BankRefreshResult>("/api/bank-accounts/hana-b2b/transactions")
      .then((result) => applyBankResult(result.data))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setModalMode("create");
    setBankName("하나은행");
    setAccountNumber("");
    setAccountHolder("");
    setIsModalOpen(true);
  };

  const openEdit = (account: BankAccount) => {
    setModalMode("edit");
    setBankName(account.bankName);
    setAccountNumber(account.accountNumber);
    setAccountHolder(account.accountHolder);
    setIsModalOpen(true);
  };

  const refreshTransactions = async () => {
    if (retryAfterMs > 0) {
      setApiNotice(`안정성을 위해 잠시 후 다시 조회해주세요. 남은 시간 약 ${Math.ceil(retryAfterMs / 1000)}초`);
      return;
    }

    setIsRefreshing(true);
    try {
      const result = await adminApi<BankRefreshResult>("/api/bank-accounts/hana-b2b/refresh", {
        method: "POST",
        body: JSON.stringify({}),
      });
      applyBankResult(result.data);
    } catch (error: any) {
      setApiStatus("ERROR");
      setApiNotice(error?.message || "하나은행 거래내역 조회 중 오류가 발생했습니다.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <section className="tabPage accountsManagement">
      <Panel title="하나은행 기준계좌" description="현재 운영에서 사용할 본사 입금 계좌와 하나은행 API 조회 상태를 관리합니다." action={refreshAction}>
        <div className="accountPrimaryLayout">
          <div className="accountPrimaryCard">
            <span>운영 기준계좌</span>
            <strong>{primaryAccount?.accountNumber || "등록된 계좌 없음"}</strong>
            <em>{primaryAccount ? `${primaryAccount.bankName} / ${primaryAccount.accountHolder}` : "계좌등록 버튼으로 하나은행 계좌를 등록하세요."}</em>
          </div>
          <div className="accountPrimaryActions">
            <button onClick={openCreate}>계좌등록</button>
            {primaryAccount && <button className="sub" onClick={() => openEdit(primaryAccount)}>기준계좌 수정</button>}
          </div>
        </div>

        <div className="accountTableFull accountListTable compactAccountList">
          <DataTable
            headers={["은행", "계좌번호", "예금주", "계좌명", "사용", "관리"]}
            rows={(bankAccounts as BankAccount[]).map((account) => [
              account.bankName,
              <button key="account" className="linkButton" onClick={() => openEdit(account)}>{account.accountNumber}</button>,
              account.accountHolder,
              account.accountName || "",
              account.isActive ? "사용" : "미사용",
              <button key="edit" className="tableActionButton edit" onClick={() => openEdit(account)}>수정</button>,
            ])}
          />
        </div>
      </Panel>

      <Panel title="하나은행 B2B 계좌정보조회" description="하나은행 계좌의 거래내역과 잔액을 조회해 결제 확인 및 정산 기준으로 사용합니다.">
        <div className="accountRefreshToolbar">
          <div className={apiStatus === "ERROR" ? "accountApiStatus error" : "accountApiStatus"}>
            <strong>{bankStatusLabel(apiStatus)}</strong>
            <span>{apiNotice}</span>
          </div>
          <button disabled={isRefreshing || retryAfterMs > 0} onClick={refreshTransactions}>
            {isRefreshing ? "조회중" : retryAfterMs > 0 ? `${Math.ceil(retryAfterMs / 1000)}초 후 조회` : "거래내역/잔액 새로고침"}
          </button>
        </div>

        <div className="accountBalanceGrid">
          <div>
            <span>현재잔액</span>
            <strong>{money(latestBalance?.currentBalance || 0)}</strong>
          </div>
          <div>
            <span>지급가능잔액</span>
            <strong>{money(latestBalance?.payableAmount || 0)}</strong>
          </div>
          <div>
            <span>미결제타점권금액</span>
            <strong>{money(latestBalance?.unclearedCheckAmount || 0)}</strong>
          </div>
          <div>
            <span>지급정지금액</span>
            <strong>{money(latestBalance?.paymentStopAmount || 0)}</strong>
          </div>
        </div>

        <div className="accountTableFull accountTransactionTable">
          <DataTable
            headers={["", "거래일자", "시간", "구분", "적요", "취급점명", "거래금액", "거래후잔액", "통화", "계좌번호"]}
            rows={transactions.map((transaction, index) => [
              <span key="rowNo" className="rowNo">{index + 1}</span>,
              formatDate(transaction.transactionDate),
              transaction.transactionTime || "",
              transaction.balanceChangeCode || "",
              transaction.outline || "",
              transaction.branchName || "",
              <span key="amount" className="amountText">{money(transaction.amount)}</span>,
              <span key="balance" className="amountText">{money(transaction.balance)}</span>,
              transaction.currencyCode || "KRW",
              transaction.accountNumber || "",
            ])}
          />
        </div>
      </Panel>

      {isModalOpen && (
        <div className="modalBackdrop" role="dialog" aria-modal="true">
          <section className="modal customerModal">
            <div className="modalHead">
              <div>
                <h2>{modalMode === "edit" ? "계좌 수정" : "계좌등록"}</h2>
                <p>하나은행 B2B 조회와 입금 확인에 사용할 기준 계좌입니다.</p>
              </div>
              <button className="sub" onClick={() => setIsModalOpen(false)}>닫기</button>
            </div>
            <div className="formGrid three">
              <Field label="은행명" value={bankName} onChange={setBankName} />
              <Field label="계좌번호" value={accountNumber} onChange={setAccountNumber} />
              <Field label="예금주" value={accountHolder} onChange={setAccountHolder} />
            </div>
            <div className="modalActions">
              <button className="sub" onClick={() => setIsModalOpen(false)}>취소</button>
              <button onClick={() => run(modalMode === "edit" ? "계좌 수정" : "계좌 등록", async () => { await createBankAccount(); setIsModalOpen(false); })}>
                {modalMode === "edit" ? "수정" : "저장"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
