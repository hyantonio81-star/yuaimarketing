# 보안 점검 및 개선 사항

---

## 1. 적용된 보안

- **비밀번호 미포함**: 관리자/사용자 비밀번호는 코드·저장소에 없고, 시드 시에만 `backend/.env`의 `SEED_*`로 전달 후 실행.
- **Supabase**: 프론트는 anon key만 사용, 서버 전용 작업은 service_role(백엔드 `.env`에만).
- **로그인**: Supabase Auth 사용. `VITE_SUPABASE_*` 설정 시 `/login` 없이는 대시 접근 불가(ProtectedRoute).
- **패키지 비공개**: `package.json`의 `"private": true`로 npm 배포 방지.
- **Admin API**: `/api/admin/*`는 JWT 검증 후 `app_metadata.role === "admin"` 확인. 프론트는 `Authorization: Bearer <access_token>` 전송.
- **AI 백신·대응**: 사용자 입력 길이 제한(8KB), 프롬프트 인젝션 패턴 검사·완화, `handle-request`에 rate limit(IP당 1분 30회). 자세한 내용은 `docs/AI_SECURITY.md` 참고.
- **보안 헤더**: Vercel 배포 시 `vercel.json`에서 X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy 적용. 백엔드 서버(`server.ts`)에서도 동일 헤더(X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)를 응답에 추가.
- **API 입력 검증**: `backend/src/lib/apiSecurity.ts`에서 B2B/B2C 쿼리·바디 파라미터 정규화. 국가 코드는 화이트리스트(`countryMaster`)만 허용, HS코드·조직 ID·숫자·문자열 길이 제한, null 바이트 제거.
  - **B2B**: `market-score`, `market-report`, `integrated-marketing-strategy`, `classify-hs-code`, `tender-checklist`(쿼리), `match-buyers`, `buyer-profile`, `indices`, `trade-market-score`, `landed-cost`, `getB2bScope`(헤더/쿼리 orgId·country). POST: `marketing-strategy`, `evaluate-tender`, `generate-commercial-invoice`, `shipping-quotes` 바디 필드 sanitize 적용.
  - **B2C**: `getB2cScope`/`getOrgId`(헤더/쿼리), connections·order·price·promotion·reviews·churn·recommendations·settings·pending-approvals 등 라우트에서 SKU·이메일·리뷰 텍스트·숫자 등 sanitize 적용.
- **B2B/B2C 레이트 리밋**: `/api/b2b`, `/api/b2c` 전체에 `preHandler`로 `checkRateLimitApi` 적용. IP당 1분 120회 초과 시 429 반환.
- **CORS**: 환경 변수 `ALLOWED_ORIGINS`가 설정되면 해당 목록(쉼표 구분)만 허용. 미설정 시 `origin: true`. `methods`·`allowedHeaders`(Content-Type, Authorization, X-Organization-Id, X-Country) 명시.

---

## 2. 권장 추가 조치

| 항목 | 권장 내용 |
|------|-----------|
| **HTTPS** | Vercel/프로덕션은 기본 HTTPS. 로컬도 가능하면 HTTPS 사용. |
| **환경 변수** | `.env`는 Git 제외. Vercel/Supabase 등에는 대시보드에서만 설정. |
| **service_role 키** | 백엔드·시드 스크립트에서만 사용. 프론트·클라이언트에 노출 금지. |
| **비밀번호 정책** | Supabase Dashboard → Authentication → Settings에서 최소 길이·복잡도 설정 권장. |
| **RLS** | Supabase 테이블 추가 시 Row Level Security 활성화 및 정책으로 접근 제한. |
| **CORS** | 프로덕션에서는 `ALLOWED_ORIGINS`에 허용 도메인을 쉼표로 설정해 제한. 미설정 시 `origin: true`. |
| **세션** | Supabase가 세션·갱신 처리. 필요 시 JWT 만료·리프레시 설정은 Supabase Auth 설정에서 조정. |

---

## 3. 추후 개선 (선택)

- **Rate limiting 확대**: B2B/B2C는 IP당 1분 120회 적용됨. Redis 등으로 분산 저장 시 프로덕션 확장에 유리.
- **감사 로그**: Admin bootstrap·사용자 목록 조회 등을 DB 또는 로그에 기록(현재는 서버 로그에 bootstrap 생성만 기록).
- **2FA**: Supabase Auth MFA 활성화로 관리자 계정 이중 인증.
- **CORS 제한**: `ALLOWED_ORIGINS` 설정으로 이미 허용 도메인만 명시 가능.
