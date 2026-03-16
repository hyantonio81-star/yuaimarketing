# yuaimarketing.vercel.app 사이트 검토

검토일 기준 배포 상태 및 권장 설정·개선 사항입니다.

---

## 1. 현재 상태 (검토 결과)

| 항목 | 상태 |
|------|------|
| **접속** | https://yuaimarketing.vercel.app/ 정상 로드 |
| **UI** | YuantO Ai 대시보드, 4 Pillar 카드, 시스템 상태, 일일 루틴·선제적 알림·사용자 요청, 수익 모델·자체 평가 |
| **언어** | 기본 한국어, 언어 전환(한국어/English/Español) 동작 |
| **API** | `/api/health` 없음 → **프론트만 배포** 중 (백엔드 미배포) |
| **로그인** | Vercel에 `VITE_SUPABASE_*` 설정 시에만 로그인 필요, 미설정 시 로그인 없이 접근 가능 |

---

## 2. 필수·권장 Vercel 환경 변수

Vercel → **yuaimarketing** → **Settings** → **Environment Variables**에서 확인·설정하세요.

| 변수 | 필수 여부 | 값 예시 | 비고 |
|------|-----------|---------|------|
| `VITE_SUPABASE_URL` | 권장 | `https://xxxx.supabase.co` | 설정 시 로그인 필수, 미설정 시 누구나 접근 |
| `VITE_SUPABASE_ANON_KEY` | 권장 | Supabase anon key | 로그인·Supabase 기능용 |
| `VITE_API_URL` | 권장 | **비움** 또는 `https://yuaimarketing.vercel.app` | 비우면 상대 경로 `/api` 사용. 현재는 API 미배포라 대시보드의 일일 루틴·알림·사용자 요청 API 호출은 실패(빈 데이터). 나중에 API 배포 시 같은 도메인 쓰려면 비워 두기 |

- **프로덕션에서 로그인 적용**: 위 두 개 Supabase 변수를 반드시 설정하고 재배포.
- **API 배포 후**: `VITE_API_URL` 비워 두면 `https://yuaimarketing.vercel.app/api` 로 요청되므로, 같은 프로젝트에 API 배포하면 연동됨.

---

## 3. 개선 권장 사항

### 3.1 SEO·메타

- **index.html**에는 이미 `meta description`, `theme-color`, `favicon` 적용됨.
- 선택: `og:image`, `og:title`, `og:description` 추가 시 SNS 공유 시 미리보기 개선.

### 3.2 API 미배포 상태 안내

- 현재 백엔드가 Vercel에 없어 일일 루틴·선제적 알림·사용자 요청은 API 호출 실패 시 빈 값/무반응.
- 선택: API 연동 실패 시 "백엔드가 연결되지 않았습니다" 같은 짧은 메시지 표시하면 UX 개선.

### 3.3 프로덕션 API baseURL

- **frontend/src/lib/api.js**: `VITE_API_URL` 미설정 시 기본값이 `http://localhost:4000`라, 프로덕션에서도 localhost로 요청됨.
- **권장**: Vercel에서 `VITE_API_URL`을 **비움**(또는 `https://yuaimarketing.vercel.app`)으로 설정해 두고, 나중에 같은 도메인에 API 배포 시 `/api` 사용하도록 함.  
  또는 코드에서 `import.meta.env.PROD`일 때 기본값을 `""`로 두어 상대 경로만 쓰도록 변경 가능.

### 3.4 보안

- **로그인 필수화**: Supabase 변수 설정 후 재배포하면 비로그인 사용자는 `/login`으로 리다이렉트됨.
- **docs/SECURITY.md**: rate limiting, CORS, RLS, 2FA 등 추가 보안 항목 참고.

### 3.5 접근성·모바일

- Tailwind 기반 반응형 유지.
- 필요 시 버튼·링크에 `aria-label`, 포커스 스타일 점검.

---

## 4. 체크리스트 요약

- [ ] Vercel에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정 후 재배포 (로그인 적용)
- [ ] `VITE_API_URL` 비움 또는 프로덕션 URL로 설정 (API 배포 시 같은 도메인 연동)
- [ ] (선택) API 실패 시 사용자 안내 문구 추가
- [ ] (선택) og:image 등 SNS 메타 태그 추가
