"use client";

import "../../scss/mypage.scss";

export default function EditPage() {
  return (
    <div className="mypage_area">
      <div className="mypage_back">
        <div className="mypage_edit_section">
          <div className="edit_head">
            <div className="mypage_label">Account Edit</div>
            <div className="section_title">회원정보 수정</div>
          </div>

          <div className="edit_form">
            <div className="edit_row readonly">
              <div className="edit_label">아이디</div>
              <input className="edit_input" value="leepresso24" readOnly />
            </div>

            <div className="edit_row">
              <div className="edit_label">비밀번호</div>
              <input className="edit_input" type="password" placeholder="새 비밀번호를 입력하세요" />
            </div>

            <div className="edit_row">
              <div className="edit_label">상호</div>
              <input className="edit_input" defaultValue="리프레소 강남점" />
            </div>

            <div className="edit_row readonly">
              <div className="edit_label">머신</div>
              <input className="edit_input" value="SV1" readOnly />
            </div>

            <div className="edit_row">
              <div className="edit_label">이름</div>
              <input className="edit_input" defaultValue="홍길동" />
            </div>

            <div className="edit_row">
              <div className="edit_label">연락처</div>
              <input className="edit_input" defaultValue="010-1234-5678" />
            </div>

            <div className="edit_row readonly">
              <div className="edit_label">사업자</div>
              <input className="edit_input" value="123-45-67890" readOnly />
            </div>

            <div className="edit_row">
              <div className="edit_label">세금계산서번호</div>
              <input className="edit_input" defaultValue="123-45-67890" />
            </div>
            <div className="edit_row">
              <div className="edit_label">이메일</div>
              <input className="edit_input" defaultValue="leepresso24@naver.com" />
            </div>
            <div className="edit_row">
              <div className="edit_label">주소</div>
              <input className="edit_input" defaultValue="서울특별시 강남구 테헤란로 123" />
            </div>

            <div className="edit_row">
              <div className="edit_label">배송지</div>
              <input className="edit_input" defaultValue="서울특별시 강남구 테헤란로 123" />
            </div>
          </div>

          <div className="edit_btn_box">
            <button className="edit_submit_btn">수정하기</button>
          </div>
        </div>
      </div>
    </div>
  );
}
