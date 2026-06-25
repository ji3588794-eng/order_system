"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "../../scss/home.scss";

export default function Header() {
  const router = useRouter();

  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, []);

  const handleSearch = () => {
    const searchText = keyword.trim();
    if (!searchText) return;

    router.push(`/search?keyword=${encodeURIComponent(searchText)}`);
    setSearchOpen(false);
  };

  return (
    <>
      <header className="header_area">
        <div className="header_inner">
          <div className="header_bottom">
            <div className="header_logo_box" onClick={() => router.push("/")}>
              <div className="header_logo"></div>
            </div>
            <div className="header_action_wrap">
              <div className="search_wrap" ref={searchRef}>
                <button
                  type="button"
                  className="search_icon"
                  onClick={() => setSearchOpen((prev) => !prev)}
                  aria-label="검색 열기"
                />

                <div className={`search_slide_box ${searchOpen ? "open" : ""}`}>
                  <input
                    type="text"
                    placeholder="검색어를 입력하세요."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                  />

                  <button type="button" className="search_submit" onClick={handleSearch}>
                    검색
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="mypage_icon"
                onClick={() => router.push("/mypage")}
                aria-label="마이페이지"
              />

              <button type="button" className="cart_icon" onClick={() => router.push("/cart")} aria-label="장바구니">
                <span className="cart_num_icon">1</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {searchOpen && <div className="header_dim" onClick={() => setSearchOpen(false)} />}
    </>
  );
}
