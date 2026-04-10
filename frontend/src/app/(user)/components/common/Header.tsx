import { useState } from "react";
import "../../scss/home.scss";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearchToggle = () => {
    setSearchOpen((prev) => !prev);
  };

  return (
    <div className="header_area">
      <div className="header_back">
        <div className="header_box left">
          <div className="logo_box"></div>
        </div>

        <div className="header_box right">
          <div className="header_action_wrap">
            <div className="search_wrap">
              <div className="search_icon" onClick={handleSearchToggle}></div>

              <div className={`search_slide_box ${searchOpen ? "open" : ""}`}>
                <input type="text" placeholder="검색어를 입력하세요" />
                <button type="button" className="search_submit">
                  검색
                </button>
              </div>
            </div>

            <div className="menu_wrap">
              <div className="mypage_icon"></div>
            </div>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div
          className="header_dim"
          onClick={() => {
            setSearchOpen(false);
          }}
        ></div>
      )}
    </div>
  );
}
