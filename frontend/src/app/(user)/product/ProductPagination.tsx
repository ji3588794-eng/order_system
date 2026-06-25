"use client";

import { useMemo } from "react";

type PaginationItem = number | "ellipsis";

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ProductPagination({ currentPage, totalPages, onPageChange }: Props) {
  const safeTotalPages = Math.max(totalPages, 1);

  const paginationItems = useMemo(() => {
    if (safeTotalPages <= 5) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1) as PaginationItem[];
    }

    const items: PaginationItem[] = [1];

    if (currentPage <= 3) {
      items.push(2, 3, 4, "ellipsis", safeTotalPages);
      return items;
    }

    if (currentPage >= safeTotalPages - 2) {
      items.push("ellipsis", safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages);
      return items;
    }

    items.push("ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", safeTotalPages);

    return items;
  }, [currentPage, safeTotalPages]);

  return (
    <div className="main_pagination">
      <div className="main_pagination__center">
        <div className="main_pagination__numbers">
          <button
            type="button"
            className="main_pagination__number"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            &lt;
          </button>

          {paginationItems.map((item, index) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="main_pagination__ellipsis">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={`main_pagination__number ${currentPage === item ? "active" : ""}`}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            className="main_pagination__number"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === safeTotalPages}
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
