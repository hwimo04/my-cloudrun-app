# 📄 [Master PRD] AI 기반 합격 포트폴리오 로직 분석 & 큐레이션 플랫폼: FolioLogic (합격로그)

> **문서 버전:** v2.1 (모듈 분할 및 상호 참조 마스터 인덱스)  
> **최종 수정일:** 2026-11-23  
> **문서 상태:** AI 개발 실행용 마스터 요구사항 정의서 (Master Entrypoint)  
> **문서 분할 안내:** 컨텍스트 윈도우 관리 및 세부 모듈 집중 개발을 위해 본 문서는 5개의 세부 명세서로 분할되어 상호 참조됩니다.  

---

## 📌 PRD 모듈별 네비게이션 맵 (Table of Modules)

| 모듈 코드 | 문서명 | 주요 내용 | 링크 |
| :--- | :--- | :--- | :--- |
| **MOD-01** | **개요 및 페르소나** | 프로젝트 목적, 1줄 정의, 타깃 페르소나 3인 (김하은, 박준영, 이지훈) | [01_overview_and_personas.md](file:///c:/my%20folder/Ai/docs/prd/01_overview_and_personas.md) |
| **MOD-02** | **핵심 기능 상세 명세** | FEAT-01(매칭) ~ FEAT-05(북마크), **챗봇 가드레일 프롬프트**, **관리자 미들웨어 코드** | [02_features_spec.md](file:///c:/my%20folder/Ai/docs/prd/02_features_spec.md) |
| **MOD-03** | **비기능 및 모바일 가이드** | **모바일 퍼스트(375px~) 레이아웃**, 바텀 시트, 터치 44px, 가상키보드 100dvh, 성능/보안 | [03_non_functional_and_mobile.md](file:///c:/my%20folder/Ai/docs/prd/03_non_functional_and_mobile.md) |
| **MOD-04** | **기술 스택 및 DB 스키마** | Next.js 14, Supabase, Gemini Flash, **$0 운용 가이드**, **PostgreSQL DDL 스키마** | [04_tech_stack_and_database.md](file:///c:/my%20folder/Ai/docs/prd/04_tech_stack_and_database.md) |
| **MOD-05** | **성공 기준 및 완료 조건** | MVP 5대 완료 기준 (DoD), 인수 테스트 체크리스트 | [05_definition_of_done.md](file:///c:/my%20folder/Ai/docs/prd/05_definition_of_done.md) |

---

## 1. Executive Summary (핵심 요약)

* **서비스 명칭:** **FolioLogic (폴리오로직)** / 서브 브랜드: **합격로그 (PassLog)**
* **한 줄 정의:**  
  *"단순 디자인 감상을 넘어, 합격자의 기획 논리와 문제 해결 구조를 AI로 해부하고 대화하며 내 것으로 만드는 인터랙티브 포트폴리오 큐레이션 플랫폼"*
* **해결하는 핵심 문제:**  
  * 겉핥기식 디자인 열람(비핸스 등)과 고가 취업 컨설팅(30~50만 원)의 장벽 극복.
  * 비전공/문과/무스펙 등 구직자 각자의 조건에 맞는 합격 장표 논리를 AI로 벤치마킹.
* **핵심 차별점 (USP):**  
  멈춰 있는 정적 PDF가 아닌, 장표별 기획 로직을 AI가 주석으로 분석해주고, AI 챗봇과 실시간 질의응답을 나눌 수 있는 **살아있는 대화형 학습 환경**.

---

## 2. 4대 핵심 기능 하이라이트 (Core Features Summary)

1. **[FEAT-01] 내 상황 기반 AI 유사 합격자 매칭:**  
   전공, 직무, 프로젝트 수를 선택하면 나와 가장 유사한 합격자 포트폴리오 Top 3 즉시 추천.
2. **[FEAT-02] AI 기반 포트폴리오 로직 분석 뷰어:**  
   장표별 문제 정의 방식, 기획 프레임워크, 수치적 성과 도출 논리를 오버레이 주석으로 제공.
3. **[FEAT-03] 포트폴리오 전용 대화형 AI 챗봇 (엄격한 가드레일 탑재):**  
   장표에 대한 맥락 질의응답을 지원하되, 무관한 질문(주식, 날씨, 잡담 등)에는 반드시 **`"죄송합니다. 포토폴리오와 관련된 질문에만 답변할 수 있습니다."`** 단독 출력.
4. **[FEAT-04] 특정 관리자 이메일 기반 접근 제어 (`/admin` RBAC):**  
   Next.js Edge Middleware에서 `ADMIN_EMAILS` 환경변수와 세션 이메일을 대조하여 미인가 접근 시 즉시 `403 Forbidden` 차단.

---

## 3. 비기능 및 모바일 최적화 요약 (Mobile-First UX)

* **모바일 퍼스트 (375px~):** 취준생의 모바일 접속 특성을 반영하여 데스크톱보다 모바일 사용성을 최우선 개발.
* **가로 스크롤 제로:** 375px 화면에서 가로 잘림 현상 원천 차단 (`overflow-x: hidden`).
* **모바일 바텀 시트 (Bottom Sheet):** 모바일에서는 전체화면 슬라이더 + 하단 시트로 AI 주석/챗봇 제공.
* **가상 키보드 밀림 방지:** 모바일 인풋창 포커스 시 레이아웃 깨짐을 방지하는 `100dvh` 적용.

---

## 4. 기술 스택 & $0 저비용 운용 ($0 Zero-Cost Architecture)

* **Frontend / Hosting:** Next.js 14+ (App Router, TypeScript), Tailwind CSS, shadcn/ui, Vercel Free Tier
* **Backend / Database:** Supabase (PostgreSQL, Auth, Storage, RLS) Free Tier
* **AI Engine:** Google Gemini 1.5/2.0 Flash API (무관 질문 1문장 차단으로 토큰 비용 최소화)
* **스토리지 최적화:** 브라우저 Canvas WebP 초압축(장표당 300KB 이하)으로 1GB 무료 한도 내 3,500장 이상 수용.

---

## 5. AI 개발자를 위한 구현 가이드 (Developer Quick-Start)

AI 코딩 에이전트에게 작업을 지시할 때, 전체 문서를 한꺼번에 주입하지 않고 **모듈별로 분할 전달**하면 컨텍스트 낭비 없이 높은 정확도로 개발할 수 있습니다:

1. **Step 1 (DB & 백엔드 구축 시):**  
   👉 [04_tech_stack_and_database.md](file:///c:/my%20folder/Ai/docs/prd/04_tech_stack_and_database.md)의 DDL 스키마와 RLS 정책을 전달하여 Supabase 테이블 초기화.
2. **Step 2 (기능 및 챗봇 구현 시):**  
   👉 [02_features_spec.md](file:///c:/my%20folder/Ai/docs/prd/02_features_spec.md)의 FEAT-01 ~ FEAT-04 명세 및 미들웨어 소스 코드를 전달하여 컴포넌트 개발.
3. **Step 3 (모바일 반응형 검증 시):**  
   👉 [03_non_functional_and_mobile.md](file:///c:/my%20folder/Ai/docs/prd/03_non_functional_and_mobile.md)의 바텀 시트 및 100dvh 가이드를 전달하여 UI 다듬기.
4. **Step 4 (QA 및 배포 시):**  
   👉 [05_definition_of_done.md](file:///c:/my%20folder/Ai/docs/prd/05_definition_of_done.md)의 인수 테스트 체크리스트를 실행하여 완료 선언.
