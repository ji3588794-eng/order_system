"use client";

import { useRouter, useSearchParams } from "next/navigation";
import "../../scss/cart.scss";

export default function PaymentFailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = searchParams.get("code");
  const message = searchParams.get("message") || "결제 처리 중 문제가 발생했습니다.";

  return (
    <div className="payment_result_area">
      <div className="payment_result_box">
        <div className="result_icon fail">!</div>

        <div className="result_title">결제에 실패했습니다.</div>

        <div className="result_desc">
          결제 진행 중 오류가 발생했습니다.
          <br />
          결제 정보를 다시 확인해 주세요.
        </div>

        <div className="payment_info_box">
          <div className="info_row">
            <span>오류코드</span>
            <strong>{code || "-"}</strong>
          </div>

          <div className="info_row">
            <span>실패사유</span>
            <strong>{message}</strong>
          </div>
        </div>

        <div className="result_btn_box">
          <button type="button" className="home_btn" onClick={() => router.push("/")}>
            홈으로
          </button>

          <button type="button" className="order_btn" onClick={() => router.back()}>
            다시결제
          </button>
        </div>
      </div>
    </div>
  );
}
