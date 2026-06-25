"use client";
import { useRef } from "react";
import "../../scss/mypage.scss";
import { useReactToPrint } from "react-to-print";
type OrderItem = {
  id: string;
  date: string;
  status: string;
  thumbnail: string;
  name: string;
  price: string;
  quantity: string;
};

type OrderModalProps = {
  open: boolean;
  date: string;
  items: OrderItem[];
  onClose: () => void;
};

export default function OrderModal({ open, date, items, onClose }: OrderModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `거래명세서_${date}`,
    pageStyle: `
    @page {
      size: A4 portrait;
      margin: 8mm;
    }

    body {
      margin: 0;
      background: #fff;
    }
  `,
  });
  if (!open) return null;

  const parsePrice = (price: string) => {
    return Number(price.replace(/[^0-9]/g, ""));
  };

  const supplyTotal = items.reduce((acc, item) => {
    return acc + parsePrice(item.price);
  }, 0);

  const vat = Math.floor(supplyTotal * 0.1);
  const total = supplyTotal + vat;

  return (
    <div className="statement_modal">
      <div className="statement_dim" onClick={onClose} />

      <div className="statement_modal_box">
        <div className="statement_modal_head">
          <div className="statement_modal_title">거래명세서</div>

          <div className="statement_modal_btns">
            <button type="button" onClick={handlePrint}>
              인쇄/저장
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
                    거목카페 龍 中
                  </td>
                </tr>

                <tr>
                  <td colSpan={2}>전라남도 담양군 용면 가마골 394 길가에 있는 카페건물</td>
                </tr>

                <tr>
                  <td>☎</td>
                  <td>010-2007-3255</td>
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
                  <td>{date} - 6</td>
                  <th>TEL</th>
                  <td>1522-0290</td>
                </tr>

                <tr>
                  <th>사업자등록번호</th>
                  <td>254-88-03655</td>
                  <th>성명</th>
                  <td className="stamp_target">
                    이정원
                    <img src="/leepresso_stamp.png" alt="" className="company_stamp_img" />
                  </td>
                </tr>

                <tr>
                  <th>상호</th>
                  <td colSpan={3}>주식회사 리프레소</td>
                </tr>

                <tr>
                  <th>주소</th>
                  <td colSpan={3}>충청남도 천안시 서북구 차암동 13 룩소르 비즈타워 지하1층 b107호</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="statement_total_head">
            <span>금 액 : 일십팔만사천팔백원 정</span>
            <strong>₩{total.toLocaleString()}</strong>
          </div>

          <table className="statement_item_table">
            <thead>
              <tr>
                <th style={{ width: "70px" }}>일자</th>
                <th colSpan={2}>품목명[규격]</th>
                <th style={{ width: "70px" }}>수량</th>
                <th style={{ width: "90px" }}>단가</th>
                <th style={{ width: "100px" }}>공급가액</th>
                <th style={{ width: "90px" }}>부가세</th>
                <th style={{ width: "70px" }}>적요</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => {
                const price = parsePrice(item.price);
                const itemVat = Math.floor(price * 0.1);

                return (
                  <tr key={item.id}>
                    <td>{item.date.slice(5).replace(".", "/")}</td>
                    <td colSpan={2}>{item.name}</td>
                    <td>{item.quantity.replace(/[^0-9]/g, "")}</td>
                    <td>{price.toLocaleString()}</td>
                    <td>{price.toLocaleString()}</td>
                    <td>{itemVat.toLocaleString()}</td>
                    <td></td>
                  </tr>
                );
              })}

              {Array.from({ length: 10 - items.length }).map((_, index) => (
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
                <td>{vat.toLocaleString()}</td>
                <th>합계</th>
                <td>{total.toLocaleString()}</td>
                <th>인수</th>
                <td>인</td>
              </tr>
            </tbody>
          </table>

          <div className="statement_footer">하나은행 358-910024-27704 주식회사 리프레소</div>
        </div>
      </div>
    </div>
  );
}
