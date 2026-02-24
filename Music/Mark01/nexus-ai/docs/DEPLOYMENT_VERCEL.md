# Vercel 배포 가이드 (yuaimarketing)

로컬에서는 정상인데 **웹앱(yuaimarketing.vercel.app)에서 API 404**가 나오면, 대부분 **Vercel 프로젝트 루트** 설정 때문입니다.

## 1. Root Directory 필수 확인

Vercel 대시보드 → 프로젝트 **Settings** → **General** → **Root Directory**

- **반드시** API·백엔드·프론트가 함께 있는 폴더를 루트로 두어야 합니다.
- 해당 폴더 안에 아래가 **같은 레벨**에 있어야 합니다:
  - `api/` (폴더)
  - `backend/`
  - `frontend/`
  - `package.json`
  - `vercel.json`

**예시**

- 저장소 구조가 `리포지토리/nexus-ai/api/`, `nexus-ai/backend/`, `nexus-ai/frontend/` 이라면  
  → Root Directory: **`nexus-ai`**
- 저장소 루트에 바로 `api/`, `backend/`, `frontend/` 가 있다면  
  → Root Directory: **비움** (`.`)

Root를 `frontend`만 두면 `api/`가 배포에 포함되지 않아 **모든 /api/* 요청이 404**가 됩니다.

## 2. 배포 후 API 동작 확인

1. **헬스 체크**  
   브라우저에서 열기:  
   `https://yuaimarketing.vercel.app/api/health`  
   - **200** + JSON (`status: "ok"`) → API 배포 정상  
   - **404** → Root Directory(또는 배포 구조) 재확인

2. **백엔드 연동**  
   `https://yuaimarketing.vercel.app/api/markets/countries`  
   - **200** + 데이터 → 전체 API 정상  
   - **503** → 백엔드 빌드/로드 실패 (빌드 로그에서 `backend/dist` 생성 여부 확인)

## 3. 빌드 설정 (vercel.json 기준)

- **Build Command**: `npm run build` (backend + frontend 빌드, Vercel과 CI 동일)
- **Output Directory**: `frontend/dist` (프론트 정적 파일)
- **Install Command**: `npm install`
- **Node**: `.nvmrc`에 20 사용 권장 (Vercel·CI와 동일)

`api/` 아래 파일은 자동으로 서버리스 함수로 배포됩니다. Root Directory가 위와 같이 올바르면 `/api/health`, `/api/markets/countries` 등이 동작합니다. SPA 라우트(`/competitors`, `/market-intel` 등)는 `vercel.json`의 rewrites로 `index.html`에 연결됩니다.

## 4. CI (GitHub Actions)와의 호환

- `.github/workflows/ci.yml`에서 `main`/`master` 푸시·PR 시 **install → lint → build** 실행 (Vercel 빌드와 동일).
- 같은 스크립트를 쓰므로 CI 통과 시 Vercel 배포도 동일 환경에서 빌드됩니다.

## 5. 요약

| 증상 | 확인 사항 |
|------|-----------|
| `/api/*` 전부 404 | Root Directory = `api/`가 있는 폴더인지 확인 |
| `/api/health` 200, 나머지 404/503 | 백엔드 빌드·로드 확인 (빌드 로그, `backend/dist`) |
| 로컬만 되고 배포에서만 404 | Vercel Root Directory 및 저장소 구조 확인 |
