# 푸시 전 최종 점검 체크리스트

**점검 일자**: 적용 완료  
**빌드**: ✅ backend (tsc) + frontend (vite build) 성공  
**테스트**: ✅ 16 tests passed (backend)

---

## 1. 빌드·테스트

| 항목 | 결과 |
|------|------|
| `npm run build` (root) | ✅ 통과 |
| `npm test` (backend) | ✅ 16 passed |
| Lint (backend/frontend src) | ✅ 에러 없음 |

---

## 2. 수정된 TypeScript 오류

- **shorts.ts**: `request.routerPath` 미존재 → `request.url?.split("?")[0]?.endsWith("/youtube/callback")` 로 콜백 경로 판별하도록 변경.
- **shortsAgentService.ts**: `deployToPlatforms` 인자 타입 `DeployPlatform[]` 맞추기 위해 `merged.platforms as DeployPlatform[]`, `list: DeployPlatform[]` 명시.

---

## 3. 보안·동작 요약

| 구간 | 인증 | 레이트 리밋 | 비고 |
|------|------|-------------|------|
| `/api/shorts/*` | 로그인 필수 | IP당 1분 120회 | `GET .../youtube/callback` 만 예외 |
| `/api/content-automation/*` | 로그인 필수 | IP당 1분 120회 | - |
| Admin bootstrap | - | - | 프로덕션에서는 `ADMIN_BOOTSTRAP_ENABLED=true` 시에만 허용 |
| YouTube 토큰 | - | - | `YOUTUBE_TOKEN_ENCRYPTION_KEY` 설정 시 암호화 영속화 |

---

## 4. 푸시 전 확인 권장 사항

- [ ] `.env` / Vercel 환경 변수에 비밀값이 코드/저장소에 올라가 있지 않은지 확인.
- [ ] 프로덕션 배포 후 첫 방문 시 **로그인 필요** → Shorts·Content-Automation 사용 전 로그인 플로우 동작 확인.
- [ ] YouTube 연동 후 **재시작 후에도 유지**하려면 `YOUTUBE_TOKEN_ENCRYPTION_KEY` 설정 후 재배포.
- [ ] Admin bootstrap은 프로덕션에서 기본 비활성. 첫 admin 생성 시에만 `ADMIN_BOOTSTRAP_ENABLED=true` 설정 후 생성하고, 이후 `false` 로 변경 권장.

---

## 5. 변경/추가된 파일 (참고)

**보안·인증**  
- `backend/src/lib/auth.ts` (requireUser 추가)  
- `backend/src/routes/shorts.ts` (인증·레이트리밋·콜백 예외·ensureYoutubeStoreLoaded)  
- `backend/src/routes/contentAutomation.ts` (인증·레이트리밋)  
- `backend/src/routes/admin.ts` (bootstrap 프로덕션 기본 비활성)  
- `backend/src/services/youtubeUploadService.ts` (암호화 영속화)

**설정·문서**  
- `backend/.env.example` (ADMIN_BOOTSTRAP_ENABLED, YOUTUBE_* 등)  
- `docs/SECURITY.md` (적용 보안 항목 갱신)  
- `docs/PUSH_FINAL_CHECKLIST.md` (본 체크리스트)

**타입 수정**  
- `backend/src/services/shortsAgentService.ts` (DeployPlatform[] 타입 명시)
