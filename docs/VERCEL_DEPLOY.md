# Vercel 배포 가이드 (NEXUS AI)

프론트엔드와 백엔드 API를 **한 Vercel 프로젝트**에서 함께 배포하는 방법입니다. Supabase는 이미 Vercel과 연동되어 있다고 가정합니다.

---

## 1. 저장소 연결

1. [Vercel](https://vercel.com) 로그인 후 **Add New Project**.
2. **Import**에서 GitHub 저장소 **hyantonio81-star/yuaimarketing** 선택.
3. **Root Directory**는 **비워 둡니다** (저장소 루트 = `nexus-ai` 기준).
4. Framework Preset은 **Other** 또는 **Vite**로 두어도 됩니다 (아래에서 빌드 설정 사용).

---

## 2. 빌드 설정 (자동 적용)

프로젝트 루트의 `vercel.json`이 다음을 지정합니다.

- **Build Command**: `npm run build` (backend → frontend 순서로 빌드)
- **Output Directory**: `frontend/dist`
- **API**: `api/` 폴더가 서버리스 함수로 배포되며, `/api/*` 요청을 백엔드(Fastify)로 전달

추가로 수정할 필요 없이 **Deploy**를 누르면 됩니다.

---

## 3. 환경 변수

Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**에서 아래 변수를 추가하세요.

### 프론트엔드 (빌드 시 사용)

| 이름 | 값 | 비고 |
|------|-----|------|
| `VITE_API_URL` | *(비움)* 또는 `https://your-app.vercel.app` | 비우면 같은 도메인 `/api` 사용 권장 |
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | Supabase 연동 시 그대로 사용 가능 |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Supabase 연동 시 그대로 사용 가능 |

### 백엔드(API) – 서버리스 함수

| 이름 | 값 | 비고 |
|------|-----|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL | 프론트와 동일 |
| `SUPABASE_ANON_KEY` | Supabase anon key | 프론트와 동일 |
| `SUPABASE_SERVICE_ROLE_KEY` | *(선택)* service_role 키 | 관리자 작업 필요 시만 |

**Supabase 연동**을 이미 했다면, Vercel에서 Supabase 변수를 불러와서 위 이름에 맞게 매핑해 두면 됩니다.

---

## 4. 배포 후 확인

- **프론트**: `https://your-project.vercel.app`
- **API 상태**: `https://your-project.vercel.app/api/health`  
  → `{ "status": "ok", "service": "nexus-ai-backend", "supabase": "configured" }` 형태면 정상입니다.

---

## 5. 프론트만 배포하는 경우 (API 없이)

백엔드는 다른 서버(Railway 등)에 두고, Vercel에서는 **프론트만** 올리고 싶다면:

1. Vercel에서 **Root Directory**를 **`frontend`**로 설정.
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Environment Variables**: `VITE_API_URL`에 백엔드 URL (예: `https://your-backend.railway.app`) 설정 후 재배포.

---

*배포 후 문제가 있으면 빌드 로그와 `/api/health` 응답을 확인하세요.*
