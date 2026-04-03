# 환경 변수·의존성 체크리스트 (ENV & Dependencies)

새 환경에서 Nexus AI를 올릴 때 “뭐부터 켜야 하는지” 한 번에 보는 체크리스트입니다.

---

## 1. 런타임·도구

| 항목 | 필수/선택 | 사용처 | 없을 때 |
|------|-----------|--------|----------|
| Node.js 18.x ~ 20.x | 필수 | 전체 | 앱 기동 불가 |
| FFmpeg | 선택 | Shorts 영상 조립 | 편집 단계 스텁 반환(실제 mp4 미생성) |

---

## 2. 백엔드 환경 변수

### 2.1 공통

| 변수 | 필수/선택 | 설명 | 기본값 |
|------|-----------|------|--------|
| `PORT` | 선택 | 서버 포트 | `4000` |
| `ALLOWED_ORIGINS` | 선택 | CORS 허용 오리진 (쉼표 구분) | 비우면 `*` |
| `GOV_TENDER_ENABLED` | 선택 | 정부 입찰(Pillar 4) 활성화 | `false`(수동 모드) |
| `DAILY_ROUTINE_ENABLED` | 선택 | 24/7 일과 스케줄러 | `true`(미설정 시 활성) |
| `TZ` / `ROUTINE_TIMEZONE` | 선택 | 스케줄 기준 시간대 | `Asia/Seoul` |
| `VERCEL` | 선택 | `1` 이면 내장 스케줄러 비활성(외부 cron 사용) | - |

### 2.2 Supabase

| 변수 | 필수/선택 | 사용처 | 없을 때 |
|------|-----------|--------|----------|
| `SUPABASE_URL` | 필수(권장) | 인증·DB·24/7 이력·B2C 설정 | 로그인·이력·B2C 영속화 미동작 |
| `SUPABASE_ANON_KEY` | 필수(권장) | 클라이언트 인증 | 동일 |
| `SUPABASE_SERVICE_ROLE_KEY` | **Vercel·Shorts YouTube OAuth 시 필수**, 그 외 권장 | `youtube_oauth_store` upsert 등 서버 전용 DB | YouTube 연동 토큰이 사용자별로 저장되지 않음·기타 관리 API 제한 |

마이그레이션 `youtube_oauth_store` 적용 후, 프로덕션(Vercel) 백엔드 환경에 **반드시** `SUPABASE_SERVICE_ROLE_KEY`를 넣어야 Shorts에서 Google OAuth 완료 시 refresh 토큰이 DB에 남습니다.

### 2.3 Google

| 변수 | 필수/선택 | 사용처 | 없을 때 |
|------|-----------|--------|----------|
| `GOOGLE_API_KEY` / `YOUTUBE_API_KEY` | 선택 | Shorts 트렌드 수집(YouTube 검색) | 트렌드 스텁 1건 반환 |
| YouTube OAuth (클라이언트 ID/시크릿 등) | 선택 | Shorts 유튜브 업로드 | 업로드 시 스텁 URL 반환 |

### 2.4 OpenAI

| 변수 | 필수/선택 | 사용처 | 없을 때 |
|------|-----------|--------|----------|
| `OPENAI_API_KEY` | 선택 | Shorts 이미지(DALL·E), 기타 AI | 이미지 placeholder URL |

### 2.5 제휴·콘텐츠

| 변수 | 필수/선택 | 사용처 | 없을 때 |
|------|-----------|--------|----------|
| `SHEIN_AFFILIATE_FEED_URL` | 선택 | Shein 제휴 피드 | 스텁 상품 반환 |
| Threads Commerce 설정(Amazon Tag, Temu/Ali 파라미터) | 선택 | 포스트·블로그 제휴 링크 | 제휴 파라미터 미부착 |
| `BLOGGER_BLOG_ID` 등 | 선택 | 블로그 발행 | 스텁 postId 반환 |

### 2.6 정부 입찰(Pillar 4)

| 변수 | 필수/선택 | 사용처 | 없을 때 |
|------|-----------|--------|----------|
| `G2B_API_KEY` | 선택 | 나라장터 공공데이터 BidPublicInfoService | API 호출 실패 시 스텁/빈 결과 가능 |

---

## 3. 프론트엔드

| 변수 | 필수/선택 | 설명 |
|------|-----------|------|
| `VITE_API_URL` | 선택 | API 베이스 URL. 비우면 같은 호스트 사용 |

---

## 4. 프리셋별 최소 구성

| 목표 | 필요한 것 |
|------|------------|
| **대시보드만** | Node, Supabase(권장), 백엔드 `.env` 최소 |
| **Shorts E2E(업로드까지)** | + YouTube OAuth, **Supabase service role** + `youtube_oauth_store` 마이그레이션, (선택) OpenAI, **FFmpeg** ([FFMPEG_SETUP.md](./FFMPEG_SETUP.md)) |
| **Threads 포스트 발행** | + Threads Commerce 연동(토큰), Amazon RSS 또는 소스 1개 |
| **B2B 발송** | + B2B API·검증 설정; WhatsApp 등은 외부 자동화 |
| **24/7 스케줄** | + `DAILY_ROUTINE_ENABLED` 미설정 또는 true, Vercel이면 외부 cron |

---

## 5. 참고

- [SERVER_PC_SETUP.md](./SERVER_PC_SETUP.md) — PC/서버 실행
- [24_7_OPERATION.md](./24_7_OPERATION.md) — 스케줄러 환경 변수
- [AFFILIATE_TRACKING_LINKS.md](./AFFILIATE_TRACKING_LINKS.md) — 제휴 설정
- [DEPLOYMENT_VERCEL.md](./DEPLOYMENT_VERCEL.md) — Vercel 배포
