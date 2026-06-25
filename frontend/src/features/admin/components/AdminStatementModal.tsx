import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import type { Order } from "../types";
import { formatDate } from "../utils/format";

export type StatementItem = {
  id: number;
  storeItemId?: number;
  itemId?: number;
  itemCode?: string;
  itemName: string;
  supplierName?: string;
  spec?: string;
  unit?: string;
  quantity: string | number;
  unitPrice: string | number;
  supplyAmount: string | number;
  vatAmount: string | number;
  totalAmount: string | number;
  categoryName?: string;
  purchasePrice?: string | number;
  masterSalePrice?: string | number;
  storeSalePrice?: string | number;
  keywords?: string;
  storeItemMemo?: string;
  storeItemActive?: number;
  itemScopeKey?: string;
  machineId?: number;
  machineModelName?: string;
  machineCode?: string;
  machineCompanyName?: string;
  machineName?: string;
  machineCatalogModel?: string;
};

export type StatementDetail = {
  order: Order & {
    ownerName?: string;
    ownerPhone?: string;
    address1?: string;
    address2?: string;
    businessNumber?: string;
  };
  items: StatementItem[];
};

type AdminStatementModalProps = {
  detail: StatementDetail | null;
  onClose: () => void;
};

const numberValue = (value: string | number | undefined) => Number(value || 0);

export function AdminStatementModal({ detail, onClose }: AdminStatementModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: detail ? `거래명세서_${detail.order.orderNo}` : "거래명세서",
    pageStyle: `
      @page { size: A4 portrait; margin: 8mm; }
      body { margin: 0; background: #fff; }
    `,
  });

  if (!detail) return null;

  const { order, items } = detail;
  const supplyTotal = items.reduce((sum, item) => sum + numberValue(item.supplyAmount), 0);
  const vatTotal = items.reduce((sum, item) => sum + numberValue(item.vatAmount), 0);
  const total = items.reduce((sum, item) => sum + numberValue(item.totalAmount), 0);
  const statementDate = formatDate(order.orderDate).replaceAll("/", ".");

  const downloadHtml = () => {
    if (!printRef.current) return;

    const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>거래명세서_${order.orderNo}</title>
  <style>${statementDownloadCss}</style>
</head>
<body>${printRef.current.outerHTML}</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `거래명세서_${order.orderNo}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="statement_modal adminStatementModal">
      <div className="statement_dim" onClick={onClose} />

      <div className="statement_modal_box">
        <div className="statement_modal_head">
          <div className="statement_modal_title">거래명세서</div>

          <div className="statement_modal_btns">
            <button type="button" onClick={handlePrint}>
              인쇄/PDF저장
            </button>
            <button type="button" onClick={downloadHtml}>
              다운로드
            </button>
            <button type="button" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>

        <div className="statement_print_area" ref={printRef}>
          <div className="statement_title">거래명세서</div>

          <div className="statement_top">
            <table className="statement_customer_table">
              <tbody>
                <tr>
                  <td className="customer_name" colSpan={2}>
                    {order.storeName} 귀하
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>{[order.address1, order.address2].filter(Boolean).join(" ") || "-"}</td>
                </tr>
                <tr>
                  <td>TEL</td>
                  <td>{order.ownerPhone || "-"}</td>
                </tr>
              </tbody>
            </table>

            <table className="statement_supplier_table">
              <colgroup>
                <col className="col_vertical" />
                <col className="col_label" />
                <col className="col_value" />
                <col className="col_label small" />
                <col className="col_value small" />
              </colgroup>

              <tbody>
                <tr>
                  <th rowSpan={4} className="supplier_vertical">
                    공<br />급<br />자
                  </th>
                  <th>일련번호</th>
                  <td>{order.orderNo}</td>
                  <th>TEL</th>
                  <td>1522-0290</td>
                </tr>
                <tr>
                  <th>사업자등록번호</th>
                  <td>254-88-03655</td>
                  <th>성명</th>
                  <td className="stamp_target">
                    이정훈
                    <img src="/leepresso_stamp.png" alt="" className="company_stamp_img" />
                  </td>
                </tr>
                <tr>
                  <th>상호</th>
                  <td colSpan={3}>주식회사 리프레소</td>
                </tr>
                <tr>
                  <th>주소</th>
                  <td colSpan={3}>충청남도 천안시 서북구 차암로 13 루소비즈타워 지식산업센터 B107호</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="statement_total_head">
            <span>주문일자: {statementDate || "-"}</span>
            <strong>₩{total.toLocaleString()}</strong>
          </div>

          <table className="statement_item_table">
            <thead>
              <tr>
                <th style={{ width: "70px" }}>일자</th>
                <th colSpan={2}>품목명 [규격]</th>
                <th style={{ width: "70px" }}>수량</th>
                <th style={{ width: "90px" }}>단가</th>
                <th style={{ width: "100px" }}>공급가액</th>
                <th style={{ width: "90px" }}>부가세</th>
                <th style={{ width: "70px" }}>적요</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{statementDate.slice(5).replace(".", "/")}</td>
                  <td colSpan={2}>{[item.itemName, item.spec && `[${item.spec}]`].filter(Boolean).join(" ")}</td>
                  <td>{numberValue(item.quantity).toLocaleString()}</td>
                  <td>{numberValue(item.unitPrice).toLocaleString()}</td>
                  <td>{numberValue(item.supplyAmount).toLocaleString()}</td>
                  <td>{numberValue(item.vatAmount).toLocaleString()}</td>
                  <td></td>
                </tr>
              ))}

              {Array.from({ length: Math.max(10 - items.length, 0) }).map((_, index) => (
                <tr key={`empty-${index}`}>
                  <td></td>
                  <td colSpan={2}></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>

          <table className="statement_bottom_table">
            <tbody>
              <tr>
                <th>수량</th>
                <td>{items.length}</td>
                <th>공급가액</th>
                <td>{supplyTotal.toLocaleString()}</td>
                <th>VAT</th>
                <td>{vatTotal.toLocaleString()}</td>
                <th>합계</th>
                <td>{total.toLocaleString()}</td>
                <th>인수</th>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div className="statement_footer">하나은행 358-910024-27704 주식회사 리프레소</div>
        </div>
      </div>
    </div>
  );
}

const statementDownloadCss = `
body { margin: 0; background: #fff; font-family: Pretendard, Arial, sans-serif; }
.statement_print_area { width: 760px; margin: 24px auto; color: #000; background: #fff; font-size: 12px; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
th, td { border: 1px solid #222; padding: 4px 5px; font-size: 12px; line-height: 1.25; vertical-align: middle; }
.statement_title { text-align: center; font-size: 28px; font-weight: 900; margin-bottom: 12px; }
.statement_top { display: grid; grid-template-columns: 1fr 1.1fr; gap: 18px; margin-bottom: 6px; }
.statement_customer_table { text-align: center; }
.customer_name { font-size: 15px; font-weight: 900; }
.statement_supplier_table th, .statement_item_table th, .statement_bottom_table th { background: #f5f5f5; font-weight: 900; text-align: center; }
.supplier_vertical { width: 38px; background: #fff !important; }
.statement_total_head { height: 34px; border: 2px solid #000; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; margin-bottom: 4px; font-size: 18px; font-weight: 900; }
.statement_item_table td { height: 22px; text-align: center; }
.statement_item_table td:nth-child(2) { text-align: left; padding-left: 10px; }
.statement_item_table td:nth-child(4), .statement_item_table td:nth-child(5), .statement_item_table td:nth-child(6) { text-align: right; }
.statement_bottom_table { margin-top: 4px; }
.statement_bottom_table td { text-align: right; }
.statement_footer { font-size: 12px; margin-top: 4px; }
.stamp_target { position: relative; overflow: visible; }
.company_stamp_img { position: absolute; top: 50%; right: -12px; transform: translateY(-50%); width: 72px; height: 72px; object-fit: contain; opacity: 0.9; }
`;
