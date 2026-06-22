"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./stores.module.scss";
import StoreCard from "./StoreCard";
import StoreModal from "./StoreModal";
import { Search, Plus, MapPin, X, ChevronLeft, ChevronRight } from "lucide-react";

export interface StoreItem {
  idx: number;
  store_name: string;
  address: string;
  phone: string;
  hours: string;
  lat: number | string | null;
  lng: number | string | null;
  thumbnail_url: string;
  thumbnail_full_url?: string;
  is_active: number;
  created_at: string;
}

const ITEMS_PER_PAGE = 12; // 한 페이지에 12개 (4열 x 3줄)

export default function StoreManagementPage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [keyword, setKeyword] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedStore, setSelectedStore] = useState<StoreItem | null>(null);

  const fetchStores = async () => {
    try {
      const res = await api.get("/admin/stores");
      const list = res.data?.data || [];
      setStores(Array.isArray(list) ? (list as StoreItem[]) : []);
    } catch (err) {
      console.error("매장 목록 로딩 에러:", err);
      setStores([]);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // 검색어 변경 시 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword]);

  const handleReset = () => {
    setKeyword("");
    setCurrentPage(1);
  };

  const filteredStores = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return stores.filter((item) => {
      if (!item) return false;
      return (
        (item.store_name?.toLowerCase().includes(q) ?? false) ||
        (item.address?.toLowerCase().includes(q) ?? false) ||
        (item.phone?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [stores, keyword]);

  // 페이지네이션 데이터 추출
  const pagedStores = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStores.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStores, currentPage]);

  const totalPages = Math.ceil(filteredStores.length / ITEMS_PER_PAGE);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h2>매장 관리</h2>
          {/* <p>전국 매장 정보를 등록하고 효율적으로 관리하세요.</p> */}
        </div>

        <button
          className={styles.addBtn}
          onClick={() => {
            setSelectedStore(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} /> 신규 매장 추가
        </button>
      </header>

      {/* 개선된 검색 섹션 */}
      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="매장명, 주소 또는 전화번호를 입력하세요..."
          />
          {keyword && (
            <button className={styles.resetBtn} onClick={handleReset} title="검색어 초기화">
              <X size={16} />
            </button>
          )}
        </div>
        <div className={styles.countInfo}>
          검색 결과 <strong>{filteredStores.length}</strong>건
        </div>
      </div>

      <div className={styles.storeGrid}>
        {pagedStores.length > 0 ? (
          pagedStores.map((item) => (
            <StoreCard
              key={item.idx}
              item={item}
              onEdit={() => {
                setSelectedStore(item);
                setIsModalOpen(true);
              }}
              onRefresh={fetchStores}
            />
          ))
        ) : (
          <div className={styles.empty}>
            <MapPin size={40} className={styles.emptyIcon} />
            <p className={styles.emptyText}>해당하는 매장 정보가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)}>
            <ChevronLeft size={20} />
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              className={currentPage === i + 1 ? styles.activePage : ""}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => prev + 1)}>
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {isModalOpen && <StoreModal data={selectedStore} onClose={() => setIsModalOpen(false)} onSuccess={fetchStores} />}
    </div>
  );
}
