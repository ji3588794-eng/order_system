"use client";

import "../scss/mypage.scss";
import { useRouter } from "next/navigation";

export default function Mypage() {
  const router = useRouter();

  const currentOrders = [
    {
      id: "CUR-20260508-001",
      thumbnail: "/images/product/sample-beans.jpg",
      name: "리프레소 시그니처 블렌드 원두 1kg",
      date: "2026.05.08",
      status: "발주준비중",
    },
    {
      id: "CUR-20260507-002",
      thumbnail: "/images/product/sample-cup.jpg",
      name: "PET 아이스컵 16온스",
      date: "2026.05.07",
      status: "발주준비중",
    },
    {
      id: "CUR-20260508-001",
      thumbnail: "/images/product/sample-beans.jpg",
      name: "리프레소 시그니처 블렌드 원두 1kg",
      date: "2026.05.08",
      status: "발주준비중",
    },
    {
      id: "CUR-20260507-002",
      thumbnail: "/images/product/sample-cup.jpg",
      name: "PET 아이스컵 16온스",
      date: "2026.05.07",
      status: "발주준비중",
    },
  ];

  const orderHistory = [
    {
      id: "ORD-20260428-004",
      date: "2026.04.28",
      name: "PET 아이스컵 16온스 외 1건",
      price: "43,500원",
      status: "발주완료",
    },
    {
      id: "ORD-20260415-002",
      date: "2026.04.15",
      name: "초코 파우더 1kg",
      price: "13,500원",
      status: "발주완료",
    },
  ];

  return (
    <div className="mypage_area">
      <div className="mypage_back">
        <section className="mypage_user_card">
          <div className="mypage_user_left">
            <div className="mypage_user_info">
              <div className="mypage_label">회원정보</div>

              <div className="mypage_user_name">리프레소 점주님</div>

              <div className="mypage_user_email">leepresso24@naver.com</div>
            </div>
          </div>

          <button className="mypage_edit_btn" onClick={() => router.push("/mypage/edit")}>
            정보 수정
          </button>
        </section>

        <section className="mypage_current_section">
          <div className="section_head">
            <div>
              <div className="mypage_label">Current Order</div>

              <div className="section_title">현재 주문내역</div>
            </div>
          </div>

          {currentOrders.length === 0 ? (
            <div className="current_empty">
              <div className="empty_logo">LEEPRESSO</div>

              <div className="empty_text">현재 진행중인 주문이 없습니다.</div>
            </div>
          ) : (
            <div className="current_slide">
              {currentOrders.map((item) => (
                <div className="current_card" key={item.id}>
                  <div className="current_thumb">
                    <img src={item.thumbnail} alt={item.name} />
                  </div>

                  <div className="current_info">
                    <div className="current_name">{item.name}</div>

                    <div className="current_date">주문날짜 {item.date}</div>

                    <div className="current_status">{item.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mypage_order_section">
          <div className="section_head">
            <div>
              <div className="mypage_label">Order History</div>

              <div className="section_title">주문내역</div>
            </div>
            {orderHistory.length !== 0 && (
              <button className="more_btn" onClick={() => router.push("/mypage/order")}>
                전체보기
              </button>
            )}
          </div>
          {orderHistory.length === 0 ? (
            <div className="current_empty">
              <div className="empty_logo">LEEPRESSO</div>

              <div className="empty_text">주문 내역이 없습니다.</div>
            </div>
          ) : (
            <div className="order_list">
              {orderHistory.map((item) => (
                <div className="order_item" key={item.id}>
                  <div className="order_info">
                    <div className="order_id">{item.id}</div>

                    <div className="order_name">{item.name}</div>

                    <div className="order_date">{item.date}</div>
                  </div>

                  <div className="order_price_box">
                    <div className="order_price">{item.price}</div>

                    <div className={`order_status ${item.status === "발주완료" ? "done" : ""}`}>{item.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
