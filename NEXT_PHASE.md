# NEXUS AI — 다음 단계 (개발 보완 → 배포)

Git 연동이 끝난 뒤 진행할 작업을 우선순위별로 정리했습니다.

---

## 1. 배포 (우선 추천)

앱을 인터넷에서 접속 가능하게 만듭니다.

| 구분 | 추천 서비스 | 설명 |
|------|-------------|------|
| **프론트엔드** | [Vercel](https://vercel.com) 또는 [Netlify](https://netlify.com) | GitHub 연동 후 `frontend` 폴더만 배포, 빌드 명령 `npm run build`, 출력 디렉터리 `dist` |
| **백엔드** | [Railway](https://railway.app) 또는 [Fly.io](https://fly.io) | GitHub 연동 후 `backend` 폴더 배포, 포트는 `process.env.PORT` 사용 (각 서비스가 자동 지정) |

- 배포 시 **환경 변수**를 각 플랫폼에 설정: `VITE_API_URL`(프론트), `SUPABASE_URL`·`SUPABASE_ANON_KEY` 등 (`.env.example` 참고).
- 백엔드 URL이 바뀌면 프론트엔드의 `VITE_API_URL`을 그 URL로 다시 설정 후 재배포.

---

## 2. Supabase 서버 권한 (선택)

관리자 작업(사용자 생성·테이블 초기화 등)이 필요하면:

- Supabase 대시보드 → **Settings → API** 에서 **service_role** 키 복사.
- `backend/.env`에 `SUPABASE_SERVICE_ROLE_KEY=복사한키` 추가.
- 자세한 내용: `docs/SUPABASE_SETUP.md`.

---

## 3. 실제 API 연동 (스텁 교체)

현재 많은 기능이 스텁(가짜 데이터)입니다. 실제 서비스로 전환하려면:

- **나라장터(G2B)** : 공공데이터 API 키 발급 후 `backend` 서비스 연동.
- **결제·이메일** : Stripe, SendGrid 등 연동.
- **AI 기능** : OpenAI / Claude 등 API 키를 `.env`에 넣고 해당 라우트·서비스에서 호출.

---

## 4. 선택 보완

- **다국어 확장**: B2B/B2C/Gov/SEO 페이지에도 `t()` 적용 후 ko/en/es 번역 추가.
- **테스트**: E2E(Playwright 등) 또는 주요 플로우 수동 테스트.
- **postcss 경고**: `frontend/package.json`에 `"type": "module"` 추가 시 경고가 사라질 수 있음.

---

## 작업 순서 제안

1. **배포** → 프론트·백엔드 각각 배포해 실제 URL 확인.
2. **환경 변수** → 배포 환경에 `.env` 값 설정.
3. 필요 시 **Supabase service role** 추가.
4. 이후 **실제 API·AI 연동**과 **다국어/테스트**는 단계적으로 진행.
