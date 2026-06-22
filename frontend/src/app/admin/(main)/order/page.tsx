"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./order.module.scss";
import { Search, Plus, PackageSearch, X, ChevronLeft, ChevronRight } from "lucide-react";
import OrderCard from "./OrderCard";
import OrderModal from "./OrderModal";

export interface OrderItem {
  idx: number;
  store_name: string;
  address: string;
  phone: string;
  order_time: string;
  order_status: "접수" | "처리중" | "완료" | "취소";
  machine: string;
  order_company: string;
  order_item: string;
  order_num: number;
  price: number;
}

const ITEMS_PER_PAGE = 12;

const dummyOrders: OrderItem[] = [
  {
    idx: 1,
    store_name: "천안 본점",
    address: "충청남도 천안시 서북구 불당동 123",
    phone: "041-123-4567",
    order_time: "2026-05-21 10:30",
    order_status: "접수",
    machine: "SV2",
    order_company: "리프레소",
    order_item: "블랙라운지",
    order_num: 2,
    price: 54000,
  },
  {
    idx: 2,
    store_name: "아산 배방점",
    address: "충청남도 아산시 배방읍 45",
    phone: "041-222-3333",
    order_time: "2026-05-21 11:15",
    order_status: "처리중",
    machine: "A1",
    order_company: "카페용품몰",
    order_item: "컵 13oz",
    order_num: 2,
    price: 78000,
  },
  {
    idx: 3,
    store_name: "대전 둔산점",
    address: "대전광역시 서구 둔산동 88",
    phone: "042-333-4444",
    order_time: "2026-05-20 16:40",
    order_status: "완료",
    machine: "SV1",
    order_company: "머신파트너",
    order_item: "복숭아액상",
    order_num: 6,
    price: 35000,
  },
  {
    idx: 4,
    store_name: "청주 복대점",
    address: "충청북도 청주시 흥덕구 복대동 21",
    phone: "043-555-1212",
    order_time: "2026-05-20 09:10",
    order_status: "취소",
    machine: "SV1",
    order_company: "리프레소",
    order_item: "초코",
    order_num: 12,
    price: 26000,
  },
];

export default function StoreManagementPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  const fetchOrders = async () => {
    // API 연동 시 사용
    /*
    try {
      const res = await api.get("/admin/order");
      const list = res.data?.data || [];
      setOrders(Array.isArray(list) ? (list as OrderItem[]) : []);
    } catch (err) {
      console.error("발주 목록 로딩 에러:", err);
      setOrders([]);
    }
    */

    setOrders(dummyOrders);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword]);

  const handleReset = () => {
    setKeyword("");
    setCurrentPage(1);
  };

  const filteredOrders = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    if (!q) return orders;

    return orders.filter((item) => {
      return (
        item.store_name.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.order_time.toLowerCase().includes(q) ||
        item.order_status.toLowerCase().includes(q) ||
        item.machine.toLowerCase().includes(q) ||
        item.order_company.toLowerCase().includes(q) ||
        item.order_item.toLowerCase().includes(q) ||
        String(item.price).includes(q)
      );
    });
  }, [orders, keyword]);

  const pagedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h2>발주 관리</h2>
        </div>

        <button
          type="button"
          className={styles.addBtn}
          onClick={() => {
            setSelectedOrder(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} /> 신규 발주 추가
        </button>
      </header>

      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />

          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="매장명, 업체명, 품목, 상태를 입력하세요..."
          />

          {keyword && (
            <button type="button" className={styles.resetBtn} onClick={handleReset} title="검색어 초기화">
              <X size={16} />
            </button>
          )}
        </div>

        <div className={styles.countInfo}>
          검색 결과 <strong>{filteredOrders.length}</strong>건
        </div>
      </div>

      <div className={styles.listTable}>
        <div className={styles.listHeader}>
          <span>매장명</span>
          <span>연락처</span>
          <span>발주시간</span>
          <span>상태</span>
          <span>장비</span>
          <span>업체</span>
          <span>품목</span>
          <span>수량</span>
          <span>금액</span>
          <span>관리</span>
        </div>

        {pagedOrders.length > 0 ? (
          pagedOrders.map((item) => (
            <OrderCard
              key={item.idx}
              item={item}
              onEdit={() => {
                setSelectedOrder(item);
                setIsModalOpen(true);
              }}
              onRefresh={fetchOrders}
            />
          ))
        ) : (
          <div className={styles.empty}>
            <PackageSearch size={40} className={styles.emptyIcon} />
            <p className={styles.emptyText}>해당하는 발주 정보가 없습니다.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)}>
            <ChevronLeft size={20} />
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              type="button"
              key={i + 1}
              className={currentPage === i + 1 ? styles.activePage : ""}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {isModalOpen && <OrderModal data={selectedOrder} onClose={() => setIsModalOpen(false)} onSuccess={fetchOrders} />}
    </div>
  );
}
