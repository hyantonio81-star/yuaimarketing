# 보안 점검 및 개선 사항

---

## 1. 적용된 보안

- **비밀번호 미포함**: 관리자/사용자 비밀번호는 코드·저장소에 없고, 시드 시에만 `backend/.env`의 `SEED_*`로 전달 후 실행.
- **Supabase**: 프론트는 anon key만 사용, 서버 전용 작업은 service_role(백엔드 `.env`에만).
- **로그인**: Supabase Auth 사용. `VITE_SUPABASE_*` 설정 시 `/login` 없이는 대시 접근 불가(ProtectedRoute).
- **패키지 비공개**: `package.json`의 `"private": true`로 npm 배포 방지.

---

## 2. 권장 추가 조치

| 항목 | 권장 내용 |
|------|-----------|
| **HTTPS** | Vercel/프로덕션은 기본 HTTPS. 로컬도 가능하면 HTTPS 사용. |
| **환경 변수** | `.env`는 Git 제외. Vercel/Supabase 등에는 대시보드에서만 설정. |
| **service_role 키** | 백엔드·시드 스크립트에서만 사용. 프론트·클라이언트에 노출 금지. |
| **비밀번호 정책** | Supabase Dashboard → Authentication → Settings에서 최소 길이·복잡도 설정 권장. |
| **RLS** | Supabase 테이블 추가 시 Row Level Security 활성화 및 정책으로 접근 제한. |
| **CORS** | 백엔드 `@fastify/cors`는 현재 `origin: true`. 프로덕션에서는 허용 도메인만 나열 권장. |
| **세션** | Supabase가 세션·갱신 처리. 필요 시 JWT 만료·리프레시 설정은 Supabase Auth 설정에서 조정. |

---

## 3. 추후 개선 (선택)

- **Rate limiting**: API 남용 방지를 위해 백엔드에 rate limit 미들웨어 추가.
- **보안 헤더**: Helmet 등으로 X-Frame-Options, CSP 등 설정.
- **감사 로그**: 관리자 중요 작업을 DB나 로그에 기록.
- **2FA**: Supabase Auth MFA 활성화로 관리자 계정 이중 인증.
