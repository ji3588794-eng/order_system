"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "../../scss/home.scss";
import "../../scss/product.scss";
import ProductSection from "../../product/ProductSection";

const categoryList = [
  { id: 0, name: "전체" },
  { id: 1, name: "원두" },
  { id: 2, name: "원료" },
  { id: 3, name: "부자재" },
  { id: 4, name: "부품" },
];

const productList = [
  {
    id: 1,
    cate: 1,
    name: "리프레소 시그니처 블렌드 원두 1kg",
    price: "28,000원",
    desc: "고소한 바디감과 균형 잡힌 산미",
  },
  {
    id: 2,
    cate: 2,
    name: "바닐라 시럽 1L",
    price: "9,800원",
    desc: "카페 음료에 잘 어울리는 기본 시럽",
  },
  {
    id: 3,
    cate: 3,
    name: "테이크아웃 종이컵 13온스",
    price: "34,000원",
    desc: "매장 운영용 대용량 패키지",
  },
  {
    id: 4,
    cate: 4,
    name: "커피머신 추출 노즐 부품",
    price: "18,500원",
    desc: "내구성이 좋은 교체용 부품",
  },
  {
    id: 5,
    cate: 1,
    name: "다크 로스팅 에스프레소 원두 500g",
    price: "16,500원",
    desc: "진한 풍미와 깊은 크레마",
  },
  {
    id: 6,
    cate: 2,
    name: "헤이즐넛 파우더 500g",
    price: "7,900원",
    desc: "라떼 및 프라페용 원료",
  },
  {
    id: 7,
    cate: 3,
    name: "PET 아이스컵 16온스",
    price: "29,000원",
    desc: "투명도 높은 매장용 부자재",
  },
  {
    id: 8,
    cate: 4,
    name: "그라인더 호퍼 뚜껑",
    price: "12,000원",
    desc: "호환 가능한 교체형 부품",
  },
  {
    id: 9,
    cate: 1,
    name: "스페셜티 블렌드 원두 500g",
    price: "19,000원",
    desc: "부드러운 산미와 깔끔한 피니시",
  },
  {
    id: 10,
    cate: 2,
    name: "초코 파우더 1kg",
    price: "13,500원",
    desc: "모카와 초코라떼용 인기 원료",
  },
  {
    id: 11,
    cate: 3,
    name: "컵홀더 1000개입",
    price: "21,000원",
    desc: "매장 운영 필수 부자재",
  },
  {
    id: 12,
    cate: 4,
    name: "스팀 노브 교체 부품",
    price: "14,500원",
    desc: "교체가 쉬운 유지보수용 부품",
  },
];

type PaginationItem = number | "ellipsis";

export default function Home() {
  const [selectedCate, setSelectedCate] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const itemsPerPage = 4;

  const filteredProducts = useMemo(() => {
    if (selectedCate === 0) return productList;
    return productList.filter((item) => item.cate === selectedCate);
  }, [selectedCate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCate]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const pagedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1) as PaginationItem[];
    }

    const items: PaginationItem[] = [1];

    if (currentPage <= 3) {
      items.push(2, 3, 4, "ellipsis", totalPages);
      return items;
    }

    if (currentPage >= totalPages - 2) {
      items.push("ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      return items;
    }

    items.push("ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages);
    return items;
  }, [currentPage, totalPages]);

  const currentCategoryName = categoryList.find((c) => c.id === selectedCate)?.name ?? "전체 상품";

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCate(categoryId);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  return (
    <div className="main_area">
      <div className="main_back">
        <div className="main_container">
          <section className="main_banner">
            <div className="main_banner__content">
              {/* <h2 className="main_banner__title">
                카페 운영에 필요한
                <br />
                모든 자재를 한곳에서
              </h2>

              <p className="main_banner__desc">
                원두, 원료, 부자재, 부품까지
                <br />
                필요한 품목만 빠르게 확인하세요.
              </p> */}
            </div>
          </section>

          <section className="main_category">
            <div className="main_category__grid">
              {categoryList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`main_category__item ${selectedCate === item.id ? "active" : ""}`}
                  onClick={() => handleCategoryChange(item.id)}
                >
                  <span className="main_category__name">{item.name}</span>
                </button>
              ))}
            </div>
          </section>

          <ProductSection
            title={selectedCate === 0 ? "전체 상품" : currentCategoryName}
            total={filteredProducts.length}
            products={pagedProducts}
            currentPage={currentPage}
            totalPages={totalPages}
            paginationItems={paginationItems}
            onPageChange={handlePageChange}
            onDetail={(id) => router.push(`/detail/${id}`)}
          />
        </div>
      </div>
    </div>
  );
}
