"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "../scss/search.scss";
import "../scss/product.scss";
import ProductSection from "../product/ProductSection";

const categoryList = [
  { id: 0, name: "전체" },
  { id: 1, name: "원두" },
  { id: 2, name: "원료" },
  { id: 3, name: "부자재" },
  { id: 4, name: "기타" },
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
    cate: 1,
    name: "다크 로스팅 에스프레소 원두 500g",
    price: "16,500원",
    desc: "진한 풍미와 깊은 크레마",
  },
  {
    id: 3,
    cate: 2,
    name: "바닐라 시럽 1L",
    price: "9,800원",
    desc: "카페 음료에 잘 어울리는 기본 시럽",
  },
  {
    id: 4,
    cate: 2,
    name: "초코 파우더 1kg",
    price: "13,500원",
    desc: "모카와 초코라떼용 인기 원료",
  },
  {
    id: 5,
    cate: 3,
    name: "테이크아웃 종이컵 13온스",
    price: "34,000원",
    desc: "매장 운영용 대용량 패키지",
  },
  {
    id: 6,
    cate: 3,
    name: "PET 아이스컵 16온스",
    price: "29,000원",
    desc: "투명도 높은 매장용 부자재",
  },
  {
    id: 7,
    cate: 4,
    name: "카페 청소 브러쉬",
    price: "7,000원",
    desc: "매장 관리에 필요한 기본 용품",
  },
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryKeyword = searchParams.get("keyword") ?? "";

  const [keyword, setKeyword] = useState(queryKeyword);
  const [selectedCate, setSelectedCate] = useState(0);

  useEffect(() => {
    setKeyword(queryKeyword);
  }, [queryKeyword]);

  const filteredProducts = useMemo(() => {
    const searchText = keyword.trim().toLowerCase();

    return productList.filter((item) => {
      const matchedKeyword =
        searchText === "" ||
        item.name.toLowerCase().includes(searchText) ||
        item.desc.toLowerCase().includes(searchText);

      const matchedCategory = selectedCate === 0 || item.cate === selectedCate;

      return matchedKeyword && matchedCategory;
    });
  }, [keyword, selectedCate]);

  const currentCategoryName = categoryList.find((item) => item.id === selectedCate)?.name ?? "전체";

  return (
    <div className="search_page">
      <div className="search_back">
        <div className="search_container">
          <div className="search_filter">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="search_filter__input"
              placeholder="검색어를 입력하세요"
            />

            <div className="search_filter__category">
              {categoryList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`search_filter__button ${selectedCate === item.id ? "active" : ""}`}
                  onClick={() => setSelectedCate(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="search_result">
            {filteredProducts.length > 0 ? (
              <ProductSection
                title={selectedCate === 0 ? "검색 결과" : currentCategoryName}
                products={filteredProducts}
                itemsPerPage={8}
                onDetail={(id) => router.push(`/detail/${id}`)}
              />
            ) : (
              <div className="search_empty">
                <div className="search_empty__title">검색 결과가 없습니다.</div>

                <div className="search_empty__desc">다른 검색어나 카테고리를 선택해보세요.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchContent />
    </Suspense>
  );
}
