# 🚀 안티그래비티(Antigravity) & 스티치(Stitch) 적용 프롬프트 가이드

> **문서 버전:** v1.0  
> **기준 PRD:** [idea_prd.md](file:///c:/my%20folder/Ai/idea_prd.md) 및 [docs/prd/](file:///c:/my%20folder/Ai/docs/prd/) 모듈 전체  
> **용도:**  
> 1. **안티그래비티 (Antigravity):** 전체 풀스택 개발(Next.js + Supabase + Gemini + Vercel)을 자율적으로 수행시키는 마스터 개발 프롬프트  
> 2. **스티치 (Google Stitch):** UI/UX 화면 디자인 및 프로토타입 화면을 생성시키는 디자인 생성 프롬프트  

---

## Part 1. 안티그래비티 (Antigravity) 풀스택 개발 마스터 프롬프트

> 💡 **사용 방법:** 안티그래비티 새 세션을 열고 아래 프롬프트를 그대로 입력하세요.

당신은 시니어 풀스택 개발자입니다.
워크스페이스의 idea_prd.md 와 docs/prd/ 의 요구사항을 바탕으로 'FolioLogic (합격로그)'를 구현해 주세요.
단, PRD의 기술 스택(Next.js/Supabase/Vercel)은 무시하고 아래 아키텍처로 구현합니다.

### 1. 아키텍처 (반드시 준수)
- 프론트엔드 + 앱 서버: Google Apps Script 웹앱 (gas/ 폴더, clasp로 push)
  - Code.gs: doGet 라우팅(?page=admin), 데이터 처리, Cloud Run 호출(UrlFetchApp)
  - index.html: 메인/포트폴리오 뷰어/챗봇 UI (google.script.run 으로 Code.gs 호출)
  - admin.html: 관리자 페이지
  - 데이터 저장소: 구글 시트 (시트: portfolios, portfolio_pages, chat_logs)
- AI 백엔드: Cloud Run (server/ 폴더, Python)
  - main.py (Flask), requirements.txt, Dockerfile, .dockerignore
  - POST /chat : {question, context} 받아 Gemini 응답 반환
  - GEMINI_API_KEY, GEMINI_MODEL 은 환경변수로만 읽기 (google-genai 패키지 사용)
  - 요청 헤더 X-API-Token 이 환경변수 API_TOKEN 과 다르면 401 (무단 호출 방지)
  - PORT 환경변수로 리슨 (기본 8080)
- 배포: GitHub Actions(.github/workflows/deploy.yml)가 server/ 를 us-central1 Cloud Run에 배포
  - 기존 Secrets: GCP_SA_KEY, GEMINI_API_KEY 사용. API_TOKEN 시크릿도 추가로 주입
- GAS의 비밀값(CLOUD_RUN_URL, API_TOKEN, ADMIN_EMAILS)은 Script Properties에 저장. 코드에 하드코딩 금지

### 2. 필수 요구사항
- 모바일 대응: HtmlService는 HTML 안의 viewport 메타태그를 무시하므로
  doGet에서 .addMetaTag('viewport', 'width=device-width, initial-scale=1') 반드시 적용.
  375px 폭에서 가로 스크롤 없음.
- 관리자 접근 제어: Session.getActiveUser().getEmail() 이 ADMIN_EMAILS 에 없거나 빈 문자열이면
  admin.html 대신 "접근 권한이 없습니다" 페이지 반환. 관리자용 서버 함수도 같은 검사 수행.
- 챗봇 가드레일: 포트폴리오와 무관한 질문에는 정확히
  "죄송합니다. 포트폴리오와 관련된 질문에만 답변할 수 있습니다." 만 출력.
  (Cloud Run의 system instruction + 응답 검증 둘 다 적용)
- .gitignore 에 .env, .clasp.json 외 민감 파일 제외. .env는 절대 커밋하지 않음.

### 3. 진행 방식 (토큰 절약)
각 Step을 끝내면 멈추고, 만든 파일 목록과 내가 직접 실행할 명령어만 짧게 보고하세요.
내가 "다음"이라고 하면 다음 Step으로 갑니다. 설명은 최소화하고 코드는 TODO 없이 완성하세요.

- Step 1: 폴더 구조 + .gitignore + server/ (main.py, requirements.txt, Dockerfile, .dockerignore)
- Step 2: .github/workflows/deploy.yml
- Step 3: gas/ (appsscript.json, Code.gs, 시트 초기화 함수 setupSheets)
- Step 4: index.html (메인, 포트폴리오 뷰어, 챗봇 UI, 모바일 우선)
- Step 5: admin.html + 관리자 접근 제어
- Step 6: docs/prd/05_definition_of_done.md 기준 점검 체크리스트 출력

---

## Part 2. 스티치 (Google Stitch) UI/UX 디자인 생성 프롬프트

> 💡 **사용 방법:** Google Stitch 웹 콘솔 또는 Stitch 도구(`generate_screen_from_text`)에 각 화면별 프롬프트를 입력하세요.

### 🎨 디자인 시스템 & 스타일 가이드 (공통 기준)
* **컨셉:** 신뢰감과 전문성을 주는 모던 에듀테크 & 커리어 분석 플랫폼
* **컬러 팔레트:**
  * Primary: Deep Slate Navy (`#0F172A`) & Modern Indigo (`#4F46E5`)
  * Accent (합격/매칭 점수): Vivid Emerald Mint (`#10B981`)
  * Background: Clean Off-White (`#F8FAFC`) / 다크모드 시 Dark Charcoal (`#090D16`)
  * Surface: White Card with subtle border (`border-slate-200`, `shadow-sm`)
* **타이포그래피:** 가독성이 뛰어난 산세리프 (Inter / Pretendard)
* **모바일 최우선:** 375px 모바일 뷰포트에서도 여백과 가독성이 완벽하게 보장되는 레이아웃

---

### [화면 1] 메인 홈 및 30초 맞춤 합격작 매칭 모달
```text
Design a clean, modern mobile-first web interface for 'FolioLogic' (an AI-powered portfolio logic analysis platform for junior job seekers).

[Main Layout Elements]
- Header: Minimalist navbar with 'FolioLogic' logo (indigo gradient), '합격 족보 탐색', 'AI 매칭', and Google Login button.
- Hero Section: Bold headline: "디자인 감상을 넘어, 합격자의 기획 논리를 해부하다" with a prominent CTA button: "[30초 만에 내 맞춤 합격작 찾기]".
- Quick Filter Chips: "전체", "서비스 기획/PM", "프론트엔드", "UI/UX", "비전공/문과", "부트캠프".
- Portfolio Grid Cards: Display 4 cards. Each card has a crisp portfolio thumbnail preview, applicant background badge (e.g., '비전공 문과', '토스 합격'), job title, view count, and a green highlight badge: '합격 로직 분석 8장 포함'.

[AI Matching Modal Pop-up]
- An elegant centered modal with 3 quick selector steps:
  1. 희망 직무 (PM, Frontend, UI/UX)
  2. 출신 배경 (비전공, 전공, 부트캠프)
  3. 보유 프로젝트 수 (0개, 1개, 2개 이상)
- An active CTA button: "[나와 가장 유사한 합격작 3개 추천받기]" with shimmer effect.
Style: Clean minimalist tech aesthetic, Tailwind slate-900 typography, soft rounded-2xl cards.
```

---

### [화면 2] 포트폴리오 로직 분석 뷰어 (Desktop Split & Mobile Bottom Sheet)
```text
Design an interactive portfolio slide viewer for 'FolioLogic' that dissects the logic and reasoning behind an accepted job portfolio.

[Desktop Layout - Split View]
- Left (65% width): High-resolution slide viewer showing Page 03: "Problem Definition & Metric Funnel". Includes slide navigation arrows, slide count "03 / 12", zoom buttons, and subtle highlighted bounding boxes on the slide image.
- Right (35% width): "AI 로직 심층 분석 (AI Logic Breakdown)" panel.
  - Card 1 [문제 정의 논리]: Explains why the candidate used a quantitative metric funnel instead of simple screenshots.
  - Card 2 [기획 프레임워크]: Highlights 'Double Diamond Model' & '5 Whys'.
  - Card 3 [핵심 성과]: "전환율 14.8% 개선 논리 증명".
  - Floating Action Button: "[AI 챗봇에게 이 장표 질문하기]" in indigo color.

[Mobile Responsive State (375px width)]
- Full-screen horizontal slide swipe view.
- Floating bottom bar with page indicator and a prominent button: "[AI 로직 분석 보기 (3)]".
- Interactive Bottom Sheet partially expanded from the bottom showing the concise takeaway cards without covering the slide image.
Style: Professional product analytics vibe, high contrast, clean typography, badge accents in mint and indigo.
```

---

### [화면 3] 포트폴리오 전용 AI 챗봇 및 도메인 가드레일 거절 화면
```text
Design a specialized AI Chatbot slide-over panel interface for 'FolioLogic'.

[Chat Header]
- Title: "포트폴리오 전문 AI 멘토" with an active green status dot.
- Subtitle: "현재 보고 계신 장표의 기획 의도와 기술 스택에 대해 질문하세요."

[Chat Conversation Area]
- Message 1 (User): "3페이지 프로젝트에서 왜 A/B 테스트 대신 정성 인터뷰 방식을 택했는지 설명해 줘."
- Message 2 (AI): Clear, structured response breaking down the candidate's initial resource constraints and qualitative interview validity.
- Message 3 (User): "오늘 테슬라 주식 살까? 그리고 내일 날씨 알려줘." (Irrelevant / Off-topic Question)
- Message 4 (AI Guardrail Fallback State):
  - Warning/Notice style bubble with subtle amber border.
  - Exact text: "죄송합니다. 포토폴리오와 관련된 질문에만 답변할 수 있습니다."
  - Follow-up Suggestion Chip: "[이 장표의 핵심 문제 정의 방식 보기]", "[면접 예상 질문 추출]"
- Bottom Input Bar: Fixed at bottom with safe-area spacing, placeholder: "포트폴리오에 대해 궁금한 점을 입력하세요...", send icon.
Style: Polished modern chat UI (similar to Linear/Notion AI), responsive, clean bubble spacing.
```

---

### [화면 4] 관리자 포트폴리오 업로드 및 검수 대시보드 (`/admin`)
```text
Design an administrative management dashboard for 'FolioLogic' restricted to authorized admin emails only.

[Header & Auth Badge]
- Admin Banner with red/indigo tag: "[Admin Only / 접근 승인됨: admin@foliologic.com]".
- Tab navigation: "포트폴리오 등록", "장표 및 AI 분석 검수", "접근 권한 관리".

[Main Content - Portfolio Upload Form]
- Drag-and-drop file upload zone for Multi-page PDF or WebP slide images.
- Metadata Form Fields:
  - 포트폴리오 제목 (e.g. '비전공 문과의 토스 신입 PM 최종 합격 포트폴리오')
  - 직무 카테고리 (Dropdown: 기획/PM, 프론트엔드, UI/UX)
  - 지원자 배경 (비전공, 전공, 부트캠프)
  - 합격 기업군 (대기업, 스타트업, 금융권)
- AI Auto-Annotation Generator Button: "[장표별 AI 로직 분석 자동 생성하기 (Gemini Flash)]".
- Preview Table: Shows uploaded slide thumbnails with editable text inputs for Problem Definition, Framework, and Key Takeaway.
Style: Sleek SaaS dashboard, dense information architecture, dark slate navigation sidebar, clean data tables.
```
