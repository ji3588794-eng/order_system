"use client";

import { Instagram, MessageCircle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import "../../scss/home.scss";

export default function BrandFooter() {
  const [openModal, setOpenModal] = useState<"terms" | "privacy" | null>(null);

  useEffect(() => {
    if (!openModal) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenModal(null);
      }
    };

    document.addEventListener("keydown", handleEsc);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);

      document.body.style.overflow = "";
    };
  }, [openModal]);

  const termsContent = useMemo(
    () =>
      `
제1조 (목적)
본 약관은 주식회사 리프레소(이하 "회사")가 운영하는 웹사이트에서 제공하는 브랜드 정보 제공, 무인카페 프랜차이즈 창업 상담 신청, 고객의 소리 게시판 서비스의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
  `.trim(),
    [],
  );

  const privacyContent = useMemo(
    () =>
      `
주식회사 리프레소(이하 "회사")는 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 보호하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.
  `.trim(),
    [],
  );

  const modalTitle = openModal === "terms" ? "이용약관" : openModal === "privacy" ? "개인정보처리방침" : "";

  const modalContent = openModal === "terms" ? termsContent : openModal === "privacy" ? privacyContent : "";

  return (
    <>
      <footer className="brand_footer">
        <div className="brand_footer__symbol" />

        <div className="brand_footer__inner">
          <div className="brand_footer__top">
            <div className="brand_footer__col brand_footer__col--brand">
              <div className="brand_footer__logo" />

              <p className="brand_footer__desc">
                가맹점주와 고객 모두를 위한 <br />
                <span>최고의 가성비 무인카페 브랜드</span>
              </p>

              <div className="brand_footer__sns">
                <a className="brand_footer__sns_btn">
                  <Instagram size={15} />
                </a>

                <a className="brand_footer__sns_btn">
                  <MessageCircle size={15} />
                </a>

                <a href="https://blog.naver.com/mhkopi" className="brand_footer__sns_btn">
                  B
                </a>
              </div>
            </div>

            <div className="brand_footer__col brand_footer__col--info">
              <h3 className="brand_footer__title">Company Info</h3>

              <ul className="brand_footer__info_list">
                <li>
                  <span className="label">상호명</span>
                  <span className="value">(주)리프레소</span>
                </li>

                <li>
                  <span className="label">대표자</span>
                  <span className="value">이정원</span>
                </li>

                <li>
                  <span className="label">사업자번호</span>
                  <span className="value">254-88-03655</span>
                </li>

                <li>
                  <span className="label">주소</span>
                  <span className="value">충남 천안시 서북구 차암동 13 룩소르비즈타워 B107호</span>
                </li>
              </ul>
            </div>

            <div className="brand_footer__col brand_footer__col--contact">
              <h3 className="brand_footer__title">Contact Us</h3>

              <div className="brand_footer__contact_group">
                <div className="brand_footer__contact_item">
                  <span className="label">가맹 문의</span>

                  <span className="value value--tel">1522-0290</span>
                </div>

                <div className="brand_footer__contact_item">
                  <span className="label">이메일 문의</span>

                  <span className="value">leepresso24@naver.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className="brand_footer__bottom">
            <div className="brand_footer__bottom_left">
              <div className="brand_footer__copyright">
                <p>© 2026 LEEPRESSO</p>

                <div className="dot" />

                <p>All rights reserved</p>
              </div>

              <div className="brand_footer__policy_buttons">
                <button onClick={() => setOpenModal("terms")}>이용약관</button>

                <button onClick={() => setOpenModal("privacy")}>개인정보처리방침</button>
              </div>
            </div>

            <p className="brand_footer__copy_notice">본 사이트의 무단 복제를 금합니다.</p>
          </div>
        </div>
      </footer>

      {openModal && (
        <div className="policy_modal">
          <button className="policy_modal__dim" onClick={() => setOpenModal(null)} />

          <div className="policy_modal__wrap">
            <div className="policy_modal__box">
              <div className="policy_modal__header">
                <div className="policy_modal__header_text">
                  <p className="policy_modal__eyebrow">LEEPRESSO POLICY</p>

                  <h3 className="policy_modal__title">{modalTitle}</h3>
                </div>

                <button className="policy_modal__close" onClick={() => setOpenModal(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="policy_modal__body">
                <div className="policy_modal__content">
                  <pre>{modalContent}</pre>
                </div>
              </div>

              <div className="policy_modal__footer">
                <div className="policy_modal__footer_inner">
                  <p className="policy_modal__contact">문의: 1522-0290 · mhddcoffee@naver.com</p>

                  <button className="policy_modal__confirm" onClick={() => setOpenModal(null)}>
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
