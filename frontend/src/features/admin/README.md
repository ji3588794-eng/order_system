# 관리자 프론트 구조

관리자 페이지는 `src/features/admin` 아래에서 기능 단위로 관리합니다.  
`app` 폴더는 라우트 진입점만 담당하고, 실제 화면/상태/API/UI는 feature 폴더 안에 둡니다.

## 라우트

- `src/app/page.tsx`: 기본 `/` 진입점
- `src/app/admin/page.tsx`: `/admin` 진입점
- 두 라우트 모두 `src/features/admin/OrderAdminPage.tsx`를 렌더링합니다.

## 핵심 파일

- `OrderAdminPage.tsx`: 좌측 메뉴, 헤더, 현재 탭 조립
- `hooks/useAdminPageController.ts`: 관리자 전체 상태, 필터링, API 액션, 탭 props 조립
- `types.ts`: 거래처, 품목, 머신, 주문, 점주, 문의 등 공통 타입
- `services/adminApi.ts`: 관리자 API 호출 공통 함수
- `components/common.tsx`: `Panel`, `Field`, `DataTable`, `OrderTable` 등 공통 UI
- `config/navigation.ts`: 좌측 메뉴/탭/거래처 검색 컬럼 설정
- `utils/format.ts`: 금액, 날짜, 상태 라벨 포맷

## 탭 구조

- `tabs/AdminTabContent.tsx`: 현재 탭에 맞는 화면 컴포넌트 선택
- `tabs/DashboardTab.tsx`: 대시보드
- `tabs/orders/`: 수동 주문/결제, 발주 확인, 전체 주문내역
- `tabs/owners/`: 점주 계정, 점주 주문내역, 문의내역
- `tabs/base/`: 거래처 관리, 품목 관리
- `tabs/system/`: 계좌 관리, API 통신 로그

새 탭을 추가할 때는 `types.ts`의 `TabKey`, `config/navigation.ts`, `tabs/AdminTabContent.tsx`를 함께 수정하면 됩니다.
