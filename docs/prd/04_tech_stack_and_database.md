# 04. 기술 스택 및 데이터베이스 설계 (Tech Stack & Database Schema)

> **문서 코드:** `PRD-MOD-04`  
> **상위 마스터 문서:** [idea_prd.md](file:///c:/my%20folder/Ai/idea_prd.md)  
> **연관 모듈:** [02_features_spec.md](file:///c:/my%20folder/Ai/docs/prd/02_features_spec.md) | [05_definition_of_done.md](file:///c:/my%20folder/Ai/docs/prd/05_definition_of_done.md)  

---

## 1. 기술 스택 정의

| 영역 | 선정 기술 | 사유 및 제약 조건 |
| :--- | :--- | :--- |
| **프론트엔드 프레임워크** | **Next.js 14+ (App Router, TypeScript)** | React Server Components(RSC), Vercel 최적화 배포, SEO 친화적 |
| **스타일링** | **Tailwind CSS + shadcn/ui** | 모바일 퍼스트 반응형 및 유려한 UI 컴포넌트 신속 구축 |
| **호스팅 & 엣지 인프라** | **Vercel (Hobby Free Tier)** | 무중단 자동 Git CI/CD, Edge Middleware를 통한 라우트 보호, 비용 $0 |
| **백엔드 & 데이터베이스** | **Supabase (Free Tier)** | PostgreSQL, Supabase Auth (구글 소셜 로그인), Storage (포트폴리오 이미지), RLS |
| **인공지능 엔진** | **Google Gemini 1.5/2.0 Flash API** | 초고속 레이턴시, 저렴한 토큰 비용(Google AI Studio 무료 티어 한도 내 운용 가능) |

---

## 2. $0 무료/저비용 운용 전략 (Zero-Cost Operation)

1. **Gemini API 토큰 비용 통제:**
   * 무관한 질문은 사전 가드레일을 통해 1줄 표준 거절 텍스트만 출력함으로써 불필요한 토큰 소모를 원천 차단.
   * 장표별 AI 로직 분석 결과는 DB(`portfolio_pages.ai_analysis`)에 1회 생성 후 영구 저장(Caching)하여 중복 API 호출 $0화.
2. **스토리지 용량 최적화:**
   * 업로드되는 포트폴리오 장표 이미지는 업로드 전 클라이언트 Canvas에서 최대 해상도 1920px 및 WebP 변환을 거쳐 저장(Supabase 무료 스토리지 1GB 기준 장표 3,500장 이상 수용 가능).
3. **서버리스 아키텍처:**
   * 별도의 상시 가동 서버(EC2) 없이 Vercel Serverless Function만 사용하여 고정 비용 $0 유지.

---

## 3. 데이터베이스 스키마 설계 (Supabase PostgreSQL DDL)

```sql
-- 1. 사용자 프로필 및 역할 관리
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  target_job TEXT, -- e.g. "서비스 기획", "프론트엔드"
  background TEXT, -- e.g. "비전공", "문과", "전공"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 합격 포트폴리오 메타데이터
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, -- e.g. "비전공 문과의 토스 신입 PM 최종 합격 포트폴리오"
  job_category TEXT NOT NULL, -- "기획/PM" | "개발" | "디자인"
  applicant_background TEXT NOT NULL, -- "비전공/문과" | "전공" | "부트캠프"
  company_type TEXT NOT NULL, -- "대기업/유니콘" | "스타트업" | "금융권"
  total_pages INTEGER DEFAULT 1,
  thumbnail_url TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 포트폴리오 장표별 상세 및 AI 로직 분석
CREATE TABLE portfolio_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  page_title TEXT, -- e.g. "03. 문제 정의 및 가설 설정"
  ai_analysis JSONB NOT NULL, 
  -- {
  --   "problem_definition": "고객 이탈 지점을 정량 지표(퍼널 분석)로 증명함",
  --   "framework_used": "5 Whys 기법 및 더블 다이아몬드 모델",
  --   "key_takeaway": "단순 화면 개선이 아닌 비즈니스 전환율 15% 상승 논리를 구축함"
  -- }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(portfolio_id, page_number)
);

-- 4. 챗봇 대화 로그 및 가드레일 모니터링
CREATE TABLE chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_blocked BOOLEAN DEFAULT FALSE, -- 가드레일에 의해 거절되었는지 여부
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS 보안 정책 설정
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_pages ENABLE ROW LEVEL SECURITY;

-- 누구나 포트폴리오와 장표는 읽을 수 있음 (공개)
CREATE POLICY "Public Read Portfolios" ON portfolios FOR SELECT USING (true);
CREATE POLICY "Public Read Pages" ON portfolio_pages FOR SELECT USING (true);

-- 관리자만 수정/등록 가능 (환경변수나 관리자 이메일 검증)
-- 실제 운영 시 app_metadata.role = 'admin' 또는 관리자 이메일 조건 적용
```
