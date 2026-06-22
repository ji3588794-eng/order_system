"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "../../scss/cart.scss";

type PaymentStatus = "loading" | "success" | "fail";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [message, setMessage] = useState("결제 승인 중입니다.");

  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get("paymentKey");
      const orderId = searchParams.get("orderId");
      const amount = searchParams.get("amount");

      if (!paymentKey || !orderId || !amount) {
        setStatus("fail");
        setMessage("결제 정보가 올바르지 않습니다.");
        return;
      }

      const res = await fetch("/api/toss/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amount),
        }),
      });

      if (!res.ok) {
        setStatus("fail");
        setMessage("결제 승인에 실패했습니다.");
        return;
      }

      setStatus("success");
      setMessage("결제가 완료되었습니다.");
    };

    confirmPayment();
  }, [searchParams]);

  const formatPrice = (price: string | null) => {
    if (!price) return "-";
    return Number(price).toLocaleString("ko-KR") + "원";
  };

  return (
    <div className="payment_result_area">
      <div className="payment_result_box">
        <div className={`result_icon ${status}`}>
          {status === "loading" && "..."}
          {status === "success" && "✓"}
          {status === "fail" && "!"}
        </div>

        <div className="result_title">{message}</div>

        <div className="result_desc">
          {status === "loading" && "잠시만 기다려 주세요."}
          {status === "success" && "주문 내역을 확인하신 뒤 상품 준비가 진행됩니다."}
          {status === "fail" && "결제 정보를 다시 확인한 뒤 재시도해 주세요."}
        </div>

        <div className="payment_info_box">
          <div className="info_row">
            <span>주문번호</span>
            <strong>{orderId || "-"}</strong>
          </div>

          <div className="info_row">
            <span>결제금액</span>
            <strong>{formatPrice(amount)}</strong>
          </div>
        </div>

        <div className="result_btn_box">
          <button type="button" className="home_btn" onClick={() => router.push("/")}>
            홈으로
          </button>

          <button type="button" className="order_btn" onClick={() => router.push("/order")}>
            주문페이지
          </button>
        </div>
      </div>
    </div>
  );
}
