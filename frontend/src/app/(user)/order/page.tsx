"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "../scss/cart.scss";
import { useOrderStore } from "../store/orderStore";

type PaymentType = "bank" | "card";

export default function OrderPage() {
  const router = useRouter();
  const orderItems = useOrderStore((state) => state.orderItems);
  const clearOrderItems = useOrderStore((state) => state.clearOrderItems);

  const [paymentType, setPaymentType] = useState<PaymentType>("bank");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPrice = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [orderItems]);

  const formatPrice = (price: number) => {
    return `${price.toLocaleString("ko-KR")}원`;
  };

  const handlePostcodeSearch = () => {
    if (typeof window === "undefined") return;

    if (!window.daum || !window.daum.Postcode) {
      alert("주소 검색 서비스를 불러오는 중입니다.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data: any) {
        setPostcode(data.zonecode);
        setAddress(data.roadAddress || data.jibunAddress);
      },
    }).open();
  };

  const createShopOrder = async () => {
    const storeId =
      typeof window === "undefined"
        ? Number(process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || 1)
        : Number(localStorage.getItem("storeId") || process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || 1);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        storeId,
        requestChannel: "SHOP",
        paymentType: "PREPAID",
        paymentMethod: paymentType === "card" ? "CARD" : "BANK_TRANSFER",
        payerName: customerName || undefined,
        requestMemo: JSON.stringify({
          source: "user-order-page",
          customerName,
          phone,
          email,
          postcode,
          address,
          detailAddress,
          paymentMethod: paymentType,
        }),
        items: orderItems.map((item) => ({
          itemId: item.id,
          itemName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          vatAmount: 0,
        })),
      }),
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || "ORDER_CREATE_FAILED");
    }

    return result.data as { id: number; orderNo: string };
  };

  const handlePayment = async () => {
    if (orderItems.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const order = await createShopOrder();

      if (paymentType === "bank") {
        clearOrderItems();
        router.push(`/payment/success?method=bank&localOrderId=${order.id}&orderId=${order.orderNo}&amount=${totalPrice}`);
        return;
      }

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

      if (!clientKey) {
        alert("토스 클라이언트 키가 없습니다.");
        return;
      }

      const { loadTossPayments, ANONYMOUS } = await import("@tosspayments/tosspayments-sdk");
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({
        customerKey: ANONYMOUS,
      });

      await payment.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: totalPrice,
        },
        orderId: order.orderNo,
        orderName: orderItems.length === 1 ? orderItems[0].name : `${orderItems[0].name} 외 ${orderItems.length - 1}건`,
        successUrl: `${window.location.origin}/payment/success?method=card&localOrderId=${order.id}`,
        failUrl: `${window.location.origin}/payment/fail?localOrderId=${order.id}`,
        customerEmail: email || "test@test.com",
        customerName: customerName || "구매자",
      } as any);
    } catch (error) {
      console.error(error);
      alert("주문 생성 또는 결제 요청에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="order_area">
      <div className="order_inner">
        <div className="order_title_box">
          <div className="order_title">결제정보 입력</div>
          <div className="order_desc">배송정보와 결제수단을 확인해 주세요.</div>
        </div>

        <div className="order_layout">
          <div className="order_left">
            <div className="order_section">
              <div className="section_title">배송정보</div>

              <div className="form_grid">
                <div className="form_item">
                  <label>이름</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="이름을 입력하세요" />
                </div>

                <div className="form_item">
                  <label>연락처</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
                </div>

                <div className="form_item full">
                  <label>주소</label>

                  <div className="address_search_box">
                    <input type="text" value={postcode} placeholder="우편번호" readOnly />

                    <button type="button" onClick={handlePostcodeSearch}>
                      우편검색
                    </button>
                  </div>

                  <input type="text" value={address} placeholder="주소" readOnly />

                  <input
                    type="text"
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    placeholder="상세주소를 입력하세요"
                  />
                </div>

                <div className="form_item full">
                  <label>이메일</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
                </div>
              </div>
            </div>

            <div className="order_section">
              <div className="section_title">입금방법 선택</div>

              <div className="payment_select">
                <button
                  type="button"
                  className={paymentType === "bank" ? "active" : ""}
                  onClick={() => setPaymentType("bank")}
                >
                  무통장입금
                </button>

                <button
                  type="button"
                  className={paymentType === "card" ? "active" : ""}
                  onClick={() => setPaymentType("card")}
                >
                  카드결제
                </button>
              </div>

              {paymentType === "bank" && (
                <div className="bank_info_box">
                  <div className="bank_title">입금 계좌정보</div>

                  <div className="bank_row">
                    <span>은행</span>
                    <strong>하나은행</strong>
                  </div>

                  <div className="bank_row">
                    <span>계좌번호</span>
                    <strong>358-910024-27704</strong>
                  </div>

                  <div className="bank_row">
                    <span>예금주</span>
                    <strong>주식회사 리프레소</strong>
                  </div>

                  <div className="bank_notice">주문 후 입금 확인이 완료되면 상품 준비가 진행됩니다.</div>
                </div>
              )}
            </div>
          </div>

          <div className="order_right">
            <div className="order_summary">
              <div className="section_title">결제상품정보</div>

              <div className="order_product_list">
                {orderItems.map((item) => (
                  <div className="order_product" key={item.id}>
                    <div className="product_thumb">
                      <img src={item.image} alt={item.name} />
                    </div>

                    <div className="product_info">
                      <div className="product_name">{item.name}</div>
                      <div className="product_count">수량 {item.quantity}개</div>
                      <div className="product_price">{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="total_box">
                <span>합계</span>
                <strong>{formatPrice(totalPrice)}</strong>
              </div>

              <button type="button" className="payment_btn" onClick={handlePayment} disabled={orderItems.length === 0 || isSubmitting}>
                {isSubmitting ? "처리중" : paymentType === "card" ? "카드결제" : "주문접수"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
