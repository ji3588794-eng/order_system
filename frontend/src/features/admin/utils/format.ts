import type { Order } from "../types";

export function money(value: string | number) {
  return `${Math.round(Number(value || 0)).toLocaleString("ko-KR")}원`;
}

export function wonNumber(value: string | number) {
  return String(Math.round(Number(value || 0)));
}

export function formatDate(value?: string) {
  if (!value) return "";
  return value.slice(0, 10).replaceAll("-", "/");
}

export function dateRangeLabel(orders: Order[]) {
  const dates = orders.map((order) => formatDate(order.orderDate)).filter(Boolean).sort();
  if (!dates.length) return "조회된 기간 없음";
  return `${dates[0]} ~ ${dates[dates.length - 1]}`;
}

export function paymentLabel(value: string) {
  return { PREPAID: "선결제", MONTHLY: "월결제", SPECIAL: "별도협의" }[value] || value;
}

export function paymentStatusLabel(value: string) {
  return {
    UNPAID: "결제대기",
    PARTIAL_PAID: "부분결제",
    PAID: "결제완료",
    MONTHLY_BILLING: "월결제",
    MANUAL_APPROVED: "수동예외",
    REFUNDED: "환불",
  }[value] || value;
}

export function orderStatusLabel(value: string) {
  return {
    DRAFT: "임시저장",
    STATEMENT_READY: "결제대기",
    PAYMENT_REQUESTED: "결제요청",
    PAYMENT_CONFIRMED: "결제확인",
    MANUAL_APPROVED: "수동예외",
    ORDER_IN_PROGRESS: "발주진행",
    SHIPPED: "배송완료",
    COMPLETED: "완료",
    CANCELED: "취소",
  }[value] || value;
}

export function inquiryStatusLabel(value: string) {
  return {
    OPEN: "미답변",
    ANSWERED: "답변완료",
    CLOSED: "종료",
  }[value] || value;
}

export function inquiryTypeLabel(value: string) {
  return {
    ORDER: "주문",
    PAYMENT: "결제",
    MACHINE: "머신",
    ITEM: "품목",
    ETC: "기타",
  }[value] || value;
}
