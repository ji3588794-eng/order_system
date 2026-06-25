"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import ProductPagination from "./ProductPagination";

interface Product {
  id: number;
  name: string;
  desc: string;
  price: string;
}

interface Props {
  title: string;
  total?: number;
  products: Product[];
  itemsPerPage?: number;
  currentPage?: number;
  totalPages?: number;
  paginationItems?: Array<number | "ellipsis">;
  onPageChange?: (page: number) => void;
  onDetail: (id: number) => void;
}

export default function ProductSection({
  title,
  total: externalTotal,
  products,
  itemsPerPage = 8,
  currentPage: externalCurrentPage,
  totalPages: externalTotalPages,
  onPageChange,
  onDetail,
}: Props) {
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const isControlled = externalCurrentPage !== undefined && externalTotalPages !== undefined && onPageChange;

  const total = externalTotal ?? products.length;
  const currentPage = externalCurrentPage ?? internalCurrentPage;
  const totalPages = externalTotalPages ?? Math.ceil(total / itemsPerPage);

  useEffect(() => {
    setInternalCurrentPage(1);
  }, [products]);

  const pagedProducts = useMemo(() => {
    if (isControlled) return products;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return products.slice(startIndex, startIndex + itemsPerPage);
  }, [products, currentPage, itemsPerPage, isControlled]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    if (onPageChange) {
      onPageChange(page);
      return;
    }
    setInternalCurrentPage(page);
  };

  return (
    <div className="main_bottom_box">
      <section className="main_product">
        <div className="section_head">
          <div className="title">{title}</div>

          <div className="count">
            총 <strong>{total}</strong>개의 상품
          </div>
        </div>

        <div className="main_product__grid">
          {pagedProducts.map((item) => (
            <ProductCard key={item.id} item={item} onDetail={onDetail} />
          ))}
        </div>

        <ProductPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      </section>
    </div>
  );
}
