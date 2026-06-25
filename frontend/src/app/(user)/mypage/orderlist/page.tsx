"use client";

import "../../scss/mypage.scss";
import { useEffect, useRef, useState } from "react";
import OrderModal from "./OrderModal";

export default function OrderListpage() {
  const [searchType, setSearchType] = useState("date");
  const [selectOpen, setSelectOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statementOpen, setStatementOpen] = useState(false);
  const [statementDate, setStatementDate] = useState("");
  const [statementItems, setStatementItems] = useState<typeof orderList>([]);

  const selectRef = useRef<HTMLDivElement>(null);

  const orderList = [
    {
      id: "ORD-20260428-004",
      date: "2026.04.28",
      status: "발주완료",
      thumbnail: "sample-cup.jpg",
      name: "PET 아이스컵 16온스",
      price: "43,500원",
      quantity: "2개",
    },
    {
      id: "ORD-20260428-001",
      date: "2026.04.28",
      status: "발주완료",
      thumbnail: "sample-cup.jpg",
      name: "망고 베이스 1kg",
      price: "12,500원",
      quantity: "1개",
    },
    {
      id: "ORD-20260428-005",
      date: "2026.04.28",
      status: "발주완료",
      thumbnail: "sample-cup.jpg",
      name: "PET 아이스컵 16온스",
      price: "43,500원",
      quantity: "2개",
    },
    {
      id: "ORD-20260428-006",
      date: "2026.04.28",
      status: "발주완료",
      thumbnail: "sample-cup.jpg",
      name: "망고 베이스 1kg",
      price: "12,500원",
      quantity: "1개",
    },
    {
      id: "ORD-20260428-007",
      date: "2026.04.28",
      status: "발주완료",
      thumbnail: "sample-cup.jpg",
      name: "PET 아이스컵 16온스",
      price: "43,500원",
      quantity: "2개",
    },
    {
      id: "ORD-20260428-008",
      date: "2026.04.28",
      status: "발주완료",
      thumbnail: "sample-cup.jpg",
      name: "망고 베이스 1kg",
      price: "12,500원",
      quantity: "1개",
    },
    {
      id: "ORD-20260415-002",
      date: "2026.04.15",
      status: "발주완료",
      thumbnail: "sample-powder.jpg",
      name: "초코 파우더 1kg",
      price: "13,500원",
      quantity: "1개",
    },
    {
      id: "ORD-20260410-001",
      date: "2026.04.10",
      status: "발주완료",
      thumbnail: "sample-powder.jpg",
      name: "바닐라 시럽 1L",
      price: "9,800원",
      quantity: "1개",
    },
    {
      id: "ORD-20260405-001",
      date: "2026.04.05",
      status: "발주완료",
      thumbnail: "sample-powder.jpg",
      name: "초코 소스 2kg",
      price: "18,000원",
      quantity: "1개",
    },
  ];

  const pageSize = 3;

  const groupedOrderList = orderList.reduce<Record<string, typeof orderList>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  const groupedOrderEntries = Object.entries(groupedOrderList);

  const totalPages = Math.ceil(groupedOrderEntries.length / pageSize);

  const pagedGroupedOrderEntries = groupedOrderEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const paginationItems = Array.from({ length: totalPages }, (_, index) => index + 1);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleStatementOpen = (date: string, orders: typeof orderList) => {
    setStatementDate(date);
    setStatementItems(orders);
    setStatementOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setSelectOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="mypage_area">
      <div className="mypage_back">
        <div className="order_list_page">
          <div className="order_page_head">
            <div className="mypage_label">Order History</div>
            <div className="section_title">주문내역</div>
          </div>

          <div className="order_search_box">
            <div className="order_select_custom" ref={selectRef}>
              <button type="button" className="order_select_trigger" onClick={() => setSelectOpen(!selectOpen)}>
                <span>{searchType === "date" ? "날짜" : "상품명"}</span>
                <span className="select_arrow">▾</span>
              </button>

              {selectOpen && (
                <div className="order_select_menu">
                  <button
                    type="button"
                    className={`order_select_option ${searchType === "date" ? "active" : ""}`}
                    onClick={() => {
                      setSearchType("date");
                      setSelectOpen(false);
                    }}
                  >
                    날짜
                  </button>

                  <button
                    type="button"
                    className={`order_select_option ${searchType === "product" ? "active" : ""}`}
                    onClick={() => {
                      setSearchType("product");
                      setSelectOpen(false);
                    }}
                  >
                    상품명
                  </button>
                </div>
              )}
            </div>

            <div className="order_input_wrap">
              {searchType === "date" ? (
                <>
                  <input type="date" className="order_search_input" />
                  <div className="date_icon">📅</div>
                </>
              ) : (
                <input className="order_search_input" placeholder="상품명을 입력하세요" />
              )}
            </div>

            <button type="button" className="order_search_btn">
              검색
            </button>
          </div>

          <div className="order_page_list">
            {pagedGroupedOrderEntries.map(([date, orders]) => (
              <div className="order_date_group" key={date}>
                <div className="order_page_top">
                  <div className="order_page_date">{date}</div>

                  <button type="button" className="statement_btn" onClick={() => handleStatementOpen(date, orders)}>
                    명세서 출력
                  </button>
                </div>

                <div className="order_group_items">
                  {orders.map((item, index) => (
                    <div className="order_page_item" key={`${item.id}-${index}`}>
                      <div className="order_page_body">
                        <div className={`order_page_status ${item.status === "발주완료" ? "done" : ""}`}>
                          {item.status}
                        </div>

                        <div className="order_page_thumb">
                          <img src={item.thumbnail} alt={item.name} />
                        </div>

                        <div className="order_page_info">
                          <div className="order_page_name">{item.name}</div>
                          <div className="order_page_id">{item.id}</div>
                        </div>

                        <div className="order_page_price">{item.price}</div>
                        <div className="order_page_quantity">{item.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {totalPages >= 1 && (
            <div className="main_pagination">
              <div className="main_pagination__center">
                <div className="main_pagination__numbers">
                  <button
                    type="button"
                    className="main_pagination__number"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    &lt;
                  </button>

                  {paginationItems.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`main_pagination__number ${currentPage === item ? "active" : ""}`}
                      onClick={() => handlePageChange(item)}
                    >
                      {item}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="main_pagination__number"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <OrderModal
        open={statementOpen}
        date={statementDate}
        items={statementItems}
        onClose={() => setStatementOpen(false)}
      />
    </div>
  );
}
