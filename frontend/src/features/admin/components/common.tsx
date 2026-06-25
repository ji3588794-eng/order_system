import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Order } from "../types";
import { formatDate, money, orderStatusLabel, paymentStatusLabel } from "../utils/format";

function paymentMethodLabel(value?: string) {
  return {
    CARD: "카드",
    BANK_TRANSFER: "무통장",
    CASH: "현금",
    MANUAL: "수동",
    ETC: "기타",
  }[value || ""] || "-";
}

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panelHead">
        <div>
          <h2>{title}</h2>
        </div>
        {action && <div className="panelHeadAction">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export function Stat({ title, value, danger = false }: { title: string; value: string | number; danger?: boolean }) {
  return (
    <div className={danger ? "stat dangerStat" : "stat"}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label>
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function OrderTable({
  orders,
  actions,
  itemActions,
  printActions,
  hideDueDate = false,
  hideOrderStatus = false,
}: {
  orders: Order[];
  actions?: (order: Order) => ReactNode;
  itemActions?: (order: Order) => ReactNode;
  printActions?: (order: Order) => ReactNode;
  hideDueDate?: boolean;
  hideOrderStatus?: boolean;
}) {
  const headers = ["No.", "일자", "주문번호", "매장명", "점주", "품목", "주문금액", "결제방법", "결제상태"];

  if (!hideDueDate) {
    headers.push("납기일자");
  }

  if (!hideOrderStatus) {
    headers.push("진행상태");
  }

  headers.push("처리", "명세서");

  return (
    <div className="lookupArea">
      <DataTable
        headers={headers}
        rows={orders.map((order, index) => {
          const cells: (string | number | ReactNode)[] = [
            <span key="rowNo" className="rowNo">{index + 1}</span>,
            formatDate(order.orderDate) || "-",
            <span key="orderNo" className="blueText">{order.orderNo || `O${order.id}`}</span>,
            <strong key="store" className="storeName">{order.storeName}</strong>,
            order.ownerName || "-",
            itemActions ? itemActions(order) : order.itemSummary || "",
            <span key="amount" className="amountText">{money(order.totalAmount)}</span>,
            paymentMethodLabel(order.paymentMethod || (order.requestChannel === "ADMIN" ? "BANK_TRANSFER" : undefined)),
            <span key="payment" className="statusDone">{paymentStatusLabel(order.paymentStatus)}</span>,
          ];

          if (!hideDueDate) {
            cells.push(formatDate(order.dueDate || order.orderDate));
          }

          if (!hideOrderStatus) {
            cells.push(<span key="status" className="statusDone">{orderStatusLabel(order.orderStatus)}</span>);
          }

          cells.push(actions ? actions(order) : <button className="lookupButton">조회</button>);
          cells.push(printActions ? printActions(order) : <button key="print" className="printButton">명세서</button>);
          return cells;
        })}
      />
    </div>
  );
}

export function DataTable({ headers, rows }: { headers: string[]; rows: (string | number | ReactNode)[][] }) {
  const pageSize = 20;
  const [page, setPage] = useState(1);
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});
  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleRows = rows.slice(startIndex, startIndex + pageSize);
  const gridTemplateColumns = useMemo(
    () => headers.map((_, index) => (columnWidths[index] ? `${columnWidths[index]}px` : defaultColumnTemplate(index, headers.length))).join(" "),
    [columnWidths, headers]
  );
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).filter((pageNumber) => {
    if (totalPages <= 7) return true;
    if (pageNumber === 1 || pageNumber === totalPages) return true;
    return Math.abs(pageNumber - currentPage) <= 2;
  });

  useEffect(() => {
    setPage(1);
  }, [rows.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setColumnWidths({});
  }, [headers]);

  const startResize = (columnIndex: number, startX: number, target: HTMLElement) => {
    const startWidth = target.closest(".tableCell")?.getBoundingClientRect().width || 90;

    const onMove = (event: MouseEvent) => {
      const nextWidth = Math.max(46, startWidth + event.clientX - startX);
      setColumnWidths((current) => ({ ...current, [columnIndex]: nextWidth }));
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="tableWrap">
      <div className="tableFrame">
        <div className="resizableTable" style={{ gridTemplateColumns }}>
          {headers.map((header, index) => (
            <div key={`head-${header}-${index}`} className="tableCell tableHeadCell" role="columnheader" title={header}>
              <span>{header}</span>
              <button
                aria-label={`${header} 컬럼 너비 조절`}
                className="columnResizeHandle"
                onMouseDown={(event) => {
                  event.preventDefault();
                  startResize(index, event.clientX, event.currentTarget);
                }}
              />
            </div>
          ))}
          {rows.length === 0 ? (
            <div className="tableCell emptyTableCell" style={{ gridColumn: `1 / span ${headers.length}` }}>
              데이터가 없습니다.
            </div>
          ) : (
            visibleRows.flatMap((row, rowIndex) =>
              headers.map((_, cellIndex) => {
                const value = row[cellIndex] ?? "";
                const title = typeof value === "string" || typeof value === "number" ? String(value) : undefined;
                return (
                  <div key={`${currentPage}-${rowIndex}-${cellIndex}`} className="tableCell" role="cell" title={title}>
                    {value}
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
      <div className="tablePager">
        <span>
          {rows.length ? `${startIndex + 1}-${Math.min(startIndex + pageSize, rows.length)} / ${rows.length}` : "0 / 0"}
        </span>
        <div className="tablePagerButtons">
          <button className="sub" disabled={currentPage === 1} onClick={() => setPage(1)}>처음</button>
          <button className="sub" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>이전</button>
          {pageNumbers.map((pageNumber, index) => {
            const previous = pageNumbers[index - 1];
            return (
              <span key={pageNumber} className="pageNumberWrap">
                {previous && pageNumber - previous > 1 && <span className="pageGap">...</span>}
                <button className={pageNumber === currentPage ? "pageButton active" : "pageButton"} onClick={() => setPage(pageNumber)}>
                  {pageNumber}
                </button>
              </span>
            );
          })}
          <button className="sub" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(value + 1, totalPages))}>다음</button>
          <button className="sub" disabled={currentPage === totalPages} onClick={() => setPage(totalPages)}>끝</button>
        </div>
      </div>
    </div>
  );
}

function defaultColumnTemplate(index: number, total: number) {
  if (index === 0) return "minmax(32px, 0.35fr)";
  if (index === 2) return "minmax(92px, 0.85fr)";
  if (index === total - 1) return "minmax(68px, 0.7fr)";
  if (index <= 4) return "minmax(78px, 1fr)";
  return "minmax(64px, 1fr)";
}
