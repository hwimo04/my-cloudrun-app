# 03. 비기능 요구사항 및 모바일 최적화 가이드 (Non-Functional & Mobile Specs)

> **문서 코드:** `PRD-MOD-03`  
> **상위 마스터 문서:** [idea_prd.md](file:///c:/my%20folder/Ai/idea_prd.md)  
> **연관 모듈:** [02_features_spec.md](file:///c:/my%20folder/Ai/docs/prd/02_features_spec.md) | [04_tech_stack_and_database.md](file:///c:/my%20folder/Ai/docs/prd/04_tech_stack_and_database.md)  

---

## 1. [최우선 필수] 모바일 최적화 및 반응형 렌더링 (Mobile-First Responsiveness) ★★★

### 1.1 모바일 퍼스트 원칙 (Mobile-First Principle)
* 취업 준비생의 60% 이상이 이동 중(지하철, 도서관, 카페 등) 스마트폰으로 레퍼런스를 탐색하므로, **모바일 화면(375px~)에서의 사용성이 데스크톱보다 우선적으로 완벽해야 함**.

### 1.2 가로 스크롤(Horizontal Scroll) 발생 원천 금지
* 375px 최소 뷰포트(iPhone SE, Galaxy 기본형) 환경에서 좌우로 화면이 삐져나가거나 잘리는 가로 스크롤 현상이 일체 없어야 함 (`overflow-x: hidden`, 유동형 그리드 레이아웃 필수).

### 1.3 모바일 전용 반응형 분기 (Adaptive Split View)
* **데스크톱 (1024px 이상):**  
  * 좌측 포트폴리오 장표 뷰어(70%) + 우측 AI 로직 주석 & 챗봇 패널(30%) 2분할 뷰.
* **모바일 (1023px 이하):**  
  * 전체 화면을 가득 채우는 포트폴리오 슬라이더 중심.
  * 하단 고정 액션바에서 `[AI 로직 분석 보기]` 또는 `[AI 질문하기]` 탭 시 부드럽게 올라오는 **모바일 바텀 시트(Bottom Sheet)** UI 제공.

### 1.4 터치 조작 및 제스처 최적화
* 모든 터치 대상(버튼, 페이지네이션 칩, 탭)의 최소 터치 영역은 **44x44px 이상** 확보하여 오터치 방지.
* 장표 이미지는 모바일에서 손가락 좌우 스와이프(Swipe)로 직관적인 페이지 넘김 지원 및 더블 탭 확대 지원.

### 1.5 가상 키보드 밀림 및 레이아웃 파손 방지
* 챗봇 입력창을 탭하여 스마트폰 가상 키보드가 올라올 때 화면 전체가 찌그러지거나 인풋창이 가려지지 않도록 **`100dvh` (Dynamic Viewport Height)**, `env(safe-area-inset-bottom)` 및 `interactive-widget=resizes-content` 메타태그 적용 필수.

---

## 2. 성능 요구사항 (Performance)

* **초기 로딩:** Vercel 엣지 배포 기준 모바일 FCP(First Contentful Paint) **1.5초 이내**.
* **이미지 서빙 최적화:** 포트폴리오 원본 이미지는 Next.js `<Image />` 컴포넌트를 통해 WebP/AVIF로 자동 변환 서빙(장표당 300KB 이하).
* **AI 응답 체감 속도:** Gemini API 호출 시 `stream: true`를 적용하여 첫 토큰 렌더링까지의 시간(TTFT)을 **800ms 이하**로 유지.

---

## 3. 보안 요구사항 (Security)

* **Next.js Middleware 이중 방어:** 관리자 라우트(`/admin`)에 대한 Edge 레벨 선제적 차단.
* **Row Level Security (RLS):** Supabase 데이터베이스 레벨에서 비인가 사용자의 포트폴리오 수정/삭제 원천 차단.
* **API Key 은닉:** `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`는 반드시 서버 사이드(Route Handlers / Server Actions)에서만 접근.

---

## 4. 접근성 및 테마 (Accessibility & Theme)

* 장시간 텍스트를 읽는 구직자의 눈 피로도를 낮추기 위해 **다크 모드(Dark Mode)** 기본 지원 (Tailwind CSS `next-themes`).
* 모든 장표 이미지에 스크린 리더용 `alt` 텍스트(장표 제목 및 요약) 제공.
