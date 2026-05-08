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
    if (!keyword.trim()) return;

    console.log("검색어:", keyword);

    // router.push(`/search?keyword=${keyword}`);
  };

  return (
    <>
      <header className="header_area">
        <div className="header_back">
          <div className="header_box left">
            <div className="logo_box" onClick={() => router.push("/")} style={{ cursor: "pointer" }} />
          </div>

          <div className="header_box right">
            <div className="header_action_wrap">
              <div className="search_wrap" ref={searchRef}>
                <div className="search_icon" onClick={() => setSearchOpen((prev) => !prev)} />

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
              <div className="cart_icon" onClick={() => router.push("/")}>
                <div className="cart_num_icon">1</div>
              </div>

              <div className="mypage_icon" onClick={() => router.push("/mypage")} />
            </div>
          </div>
        </div>
      </header>

      {searchOpen && <div className="header_dim" onClick={() => setSearchOpen(false)} />}
    </>
  );
}
