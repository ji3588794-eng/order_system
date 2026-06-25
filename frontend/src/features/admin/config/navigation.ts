import type { CustomerSearchField, GroupKey, TabKey } from "../types";

export const groups: { key: GroupKey; label: string }[] = [
  { key: "work", label: "업무" },
  { key: "owner", label: "점주관리" },
  { key: "base", label: "기준정보" },
  { key: "system", label: "시스템" },
];

export const tabs: Record<GroupKey, { key: TabKey; label: string; description: string }[]> = {
  work: [
    { key: "dashboard", label: "대시보드", description: "거래처, 품목, 주문, 문의 현황과 7일 주문 추이를 확인합니다." },
    { key: "orderInput", label: "주문리스트", description: "수동 주문 입력과 결제확인을 한 화면에서 처리합니다." },
    { key: "orderList", label: "발주리스트", description: "쇼핑몰 또는 관리자 확인으로 결제완료된 주문만 발주 진행합니다." },
    { key: "salesList", label: "전체내역", description: "결제대기, 결제완료, 발주진행, 완료 주문을 전체 조회합니다." },
  ],
  owner: [
    { key: "ownerAccounts", label: "점주 계정", description: "쇼핑몰 마이페이지에 로그인할 점주 계정을 관리합니다." },
    { key: "ownerOrders", label: "점주 주문내역", description: "모든 점주의 주문, 구매금액, 진행상태를 확인합니다." },
    { key: "inquiries", label: "문의내역", description: "점주가 마이페이지에서 남긴 문의와 답변 상태를 확인합니다." },
  ],
  base: [
    { key: "stores", label: "거래처 관리", description: "세금계산서, 머신, 원두, 연락처, 설치 정보를 거래처별로 관리합니다." },
    { key: "items", label: "품목 관리", description: "거래처와 머신별 주문 가능 품목과 단가를 관리합니다." },
    { key: "accounts", label: "계좌 관리", description: "입금 안내와 확인에 사용할 본사 계좌를 관리합니다." },
  ],
  system: [{ key: "logs", label: "통신 로그", description: "관리자 화면에서 API로 보낸 요청 결과를 확인합니다." }],
};

export const customerSearchFields: { value: CustomerSearchField; label: string }[] = [
  { value: "taxInvoiceCode", label: "세금계산서발행코드" },
  { value: "taxInvoiceName", label: "매장명" },
  { value: "machineVendor", label: "머신매입처" },
  { value: "deviceNumber", label: "기기번호" },
  { value: "machineCode", label: "머신코드" },
  { value: "machineName", label: "모델명" },
  { value: "beanName", label: "원두명" },
  { value: "representativeName", label: "대표자명" },
  { value: "contact1", label: "모바일" },
  { value: "address1", label: "주소1" },
  { value: "address2", label: "주소2" },
  { value: "asContent", label: "A/S내용" },
  { value: "installedAt", label: "설치일자" },
  { value: "filterReplacedAt", label: "필터교체일자" },
];
