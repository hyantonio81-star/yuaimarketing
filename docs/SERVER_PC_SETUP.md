# PC/서버용 실행 가이드 (Self-Hosted)

이 문서는 Nexus AI 앱을 PC 또는 자체 서버에서 단일 포트로 실행하는 방법을 설명합니다.

## 요구 사항

- **Node.js**: 18.x ~ 20.x (루트 `package.json`의 `engines` 참고)
- **npm**: 9+

## 빠른 시작

**중요: 아래 모든 명령은 반드시 `nexus-ai` 폴더 안에서 실행하세요.**  
(또는 `nexus-ai` 폴더에서 `start-server.bat` 더블클릭으로 실행 가능)

### 0. 시작 전 점검 (선택)

환경·의존성이 갖춰졌는지 확인하려면:

```bash
cd nexus-ai
npm run check-setup
```

- Node 18~20, FFmpeg, `backend/.env`(Supabase 등) 상태를 요약해서 보여줍니다.
- FFmpeg는 Windows에서 winget으로 설치한 경우 **새 터미널을 연 뒤**에만 인식될 수 있습니다. 자세한 설치 방법은 [FFMPEG_SETUP.md](./FFMPEG_SETUP.md) 참고.

### 1. 의존성 설치

```bash
cd nexus-ai
npm install
```

### 2. 환경 변수 설정

- **백엔드**: `backend/.env` 파일 생성 (또는 `backend/.env.example`을 복사 후 수정)
  - 최소한 Supabase 설정(`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) 필요
  - 서버 포트: `PORT=4000` (기본값)
- **프론트엔드**: PC/서버에서 **같은 포트**로 API + 웹을 제공할 경우 `VITE_API_URL`을 비워두거나 설정하지 않으면 자동으로 같은 호스트로 요청합니다.

### 3. 빌드 후 서버 실행 (권장)

한 번에 빌드하고 백엔드만 실행하면, 백엔드가 **같은 포트(기본 4000)**에서 API와 프론트 빌드 결과(SPA)를 함께 서빙합니다.

```bash
npm run build
npm run start:server
```

- **API**: `http://localhost:4000/api/*`, `http://localhost:4000/health`
- **웹 앱**: `http://localhost:4000/` (같은 포트)

다른 PC에서 접속하려면 `http://<서버IP>:4000` 으로 접속하면 됩니다. (방화벽에서 4000 포트 허용 필요)

---

## 다음 단계: 매번 클릭 없이 쓰기

서버를 켤 때마다 **반드시** 수동으로 실행할 필요는 없습니다. 편한 방법을 골라 쓰면 됩니다.

### 방법 1. 바탕화면 바로가기 (수동 실행)

서버를 **쓸 때만** 바탕화면 아이콘을 더블클릭해서 실행하려면:

1. **nexus-ai** 폴더에서 PowerShell을 연 뒤:
   ```powershell
   .\scripts\create-shortcut.ps1
   ```
2. 바탕화면에 **"YuantO Ai 서버"** 바로가기가 생깁니다.
3. 앞으로는 이 아이콘을 더블클릭하면 서버가 실행됩니다.

**또는** `start-server.bat` 파일을 우클릭 → **바로 가기 만들기** → 만든 바로가기를 바탕화면으로 옮겨도 됩니다.

### 방법 2. PC 켤 때마다 자동 실행 (선택)

컴퓨터를 켤 때마다 **자동으로** 서버가 떠 있게 하려면:

1. **nexus-ai** 폴더에서 PowerShell을 연 뒤:
   ```powershell
   .\scripts\add-to-startup.ps1
   ```
2. 다음 로그인(또는 재부팅)부터 Windows가 켜질 때 서버가 자동으로 실행됩니다.
3. 끄고 싶으면: **설정 → 앱 → 시작 프로그램** 에서 **"YuantO Ai 서버"** 를 끄면 됩니다.

정리하면:

- **바로가기만**: 필요할 때만 "YuantO Ai 서버" 아이콘(또는 배치 파일)을 실행.
- **시작 프로그램 등록**: PC 켤 때마다 자동 실행, 수동으로 스타트 서버 누를 필요 없음.

---

### 4. 빌드 없이 백엔드만 실행

이미 빌드된 상태에서 백엔드만 띄우려면:

```bash
npm run start:server
```

`frontend/dist`가 있으면 같은 포트에서 웹 앱도 함께 서빙됩니다.

## 스크립트 요약

| 스크립트 | 설명 |
|----------|------|
| `npm run dev` | 프론트(5173) + 백엔드(4000) 동시 개발 모드 |
| `npm run build` | 백엔드 + 프론트엔드 빌드 |
| `npm run start` | 빌드 후 `start:server` 실행 |
| `npm run start:server` | 백엔드만 실행 (이미 빌드된 경우 사용) |

## 환경 변수 (백엔드)

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `PORT` | 서버 포트 | `4000` |
| `PUBLIC_DIR` | 프론트 빌드 정적 폴더 절대 경로 (선택) | 없으면 `backend/../frontend/dist` 사용 |
| `ALLOWED_ORIGINS` | CORS 허용 오리진 (쉼표 구분) | 비우면 `*` |
| `GOV_TENDER_ENABLED` | 정부 입찰(Pillar 4) 활성화. `true`가 아니면 수동 모드(API 503) | `false` |
| Supabase 등 | `backend/.env.example` 참고 | - |

전체 환경 변수·의존성은 [ENV_AND_DEPS_체크리스트.md](./ENV_AND_DEPS_체크리스트.md)를 참고하세요.

## 동작 방식

- **개발**: `npm run dev` → 프론트는 Vite(5173), 백엔드는 Fastify(4000). 프론트에서 `VITE_API_URL=http://localhost:4000` 로 API 호출.
- **PC/서버**: `npm run build` 후 `npm run start:server` → 백엔드가 4000 포트에서 API(`/api`, `/health`)와 프론트 빌드(`frontend/dist`)를 함께 서빙. `frontend/dist`가 있으면 자동으로 SPA 라우팅(index.html 폴백) 적용.

## 문제 해결

- **실행이 안 될 때**: 반드시 **nexus-ai** 폴더에서 터미널을 열고 실행하세요. 상위 폴더(Yuanto-Market Intel)에서 실행하면 안 됩니다.
- **한 번에 실행**: `nexus-ai` 폴더에서 `start-server.bat` 더블클릭 → 빌드 후 서버 실행.
- **프론트가 안 뜨는 경우**: `nexus-ai`에서 `npm run build`를 한 번 실행해 `frontend/dist`가 생성되었는지 확인.
- **포트 사용 중**: `EADDRINUSE` 오류 시 4000 포트를 쓰는 프로세스를 종료한 뒤 다시 실행.
- **CORS 오류**: 서버에 다른 도메인에서 접속할 때는 `backend/.env`에 `ALLOWED_ORIGINS=https://your-domain.com` 형태로 설정.
