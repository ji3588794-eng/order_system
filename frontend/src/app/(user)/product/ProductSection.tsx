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
  products: Product[];
  itemsPerPage?: number;
  onDetail: (id: number) => void;
}

export default function ProductSection({ title, products, itemsPerPage = 8, onDetail }: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  const total = products.length;
  const totalPages = Math.ceil(total / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [products]);

  const pagedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return products.slice(startIndex, startIndex + itemsPerPage);
  }, [products, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
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
