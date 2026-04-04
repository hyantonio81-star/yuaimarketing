# YouTube Shorts 에이전트

정부 입찰(Gov Tender)과 **별도**로 설치된 모듈입니다. 트렌드 수집 → 스크립트·캐릭터·이미지 → TTS → Shorts 영상 → YouTube 업로드 파이프라인을 제공합니다.

## 위치

- **프론트**: 사이드바 **Shorts 에이전트** → `/shorts`, **연재 프로젝트** → `/shorts/serial`
- **백엔드**: `GET/POST /api/shorts/*`

## 배포 토폴로지 (Vercel + FFmpeg)

- **Vercel**에서는 일반적으로 FFmpeg 바이너리가 없어 로컬 조립이 불가합니다. `GET /api/shorts/health`는 `ffmpegInstalled`, `deployTarget`, `remoteAssemblyEnabled`, `workerSecretConfigured`(서버에 `SHORTS_WORKER_SECRET` 존재 여부)를 반환합니다.
- **Docker (FFmpeg 포함 백엔드)**: 리포지토리 루트에서 `docker build -f backend/Dockerfile .` 후 컨테이너로 실행. 앱 내 정적 안내: `/docs/SHORTS_REMOTE_ASSEMBLY.md`, `/docs/FFMPEG_SETUP.md`.
- **원격 조립**: `VERCEL=1`(또는 `SHORTS_DELEGATE_ASSEMBLY=1`)이고 FFmpeg가 없으면, 파이프라인이 자산을 스토리지에 올린 뒤 job 상태를 `pending_assembly`로 두고 매니페스트를 저장합니다.
- **워커**: 루트에서 `npm run shorts:assembly-worker` — 환경 변수 `SHORTS_API_BASE`(예: `https://…/api/shorts`), `SHORTS_WORKER_SECRET`, 그리고 백엔드와 동일한 Supabase 키(업로드용). 워커는 `assembly/pending-jobs` → `claim` → 로컬 FFmpeg 조립 → `complete` 순으로 호출합니다.
- **끄기**: `SHORTS_DISABLE_REMOTE_ASSEMBLY=1` 이면 원격 조립 분기가 비활성화됩니다.

## YouTube 업로드 프리셋

- Job에 `pipelineFormat`(`shorts` | `long`)이 저장되며, 업로드 시 카테고리·태그·공개 URL이 프리셋에 맞게 달라집니다 (Shorts: `/shorts/{id}`, 롱폼: `watch?v=`).
- `YOUTUBE_UPLOAD_PRIVACY` — `private` | `unlisted` | `public` (기본 `private`).
- `YOUTUBE_POLL_PROCESSING` — `0`이 아니면 업로드 후 처리 상태를 짧게 폴링하고 job에 `youtubeProcessingStatus` 등을 기록합니다.

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/shorts/trends` | 트렌드 주제 수집 (쿼리: `keywords`, `max_per_keyword`) |
| GET | `/api/shorts/avatars` | 아바타 프리셋 목록 |
| GET | `/api/shorts/youtube/auth-url` | YouTube OAuth 인증 URL (연동 버튼용) |
| GET | `/api/shorts/youtube/callback` | OAuth 콜백 (code → 토큰 저장, 프론트로 리다이렉트) |
| GET | `/api/shorts/youtube/status` | YouTube 연동 여부 |
| POST | `/api/shorts/youtube/disconnect` | YouTube 연동 해제 |
| POST | `/api/shorts/run` | 파이프라인 1회 실행 (body: `keywords`, `avatarPresetId`, `enableTts`) |
| GET | `/api/shorts/jobs` | 작업 목록 (쿼리: `limit`) |
| GET | `/api/shorts/jobs/:jobId` | 작업 1건 상세 |

## 환경 변수 (백엔드)

| 변수 | 설명 |
|------|------|
| `GOOGLE_API_KEY` 또는 `YOUTUBE_API_KEY` | YouTube Data API (트렌드 검색용) |
| `YOUTUBE_CLIENT_ID` | Google OAuth 2.0 클라이언트 ID (연동·업로드용) |
| `YOUTUBE_CLIENT_SECRET` | Google OAuth 2.0 시크릿 |
| `YOUTUBE_REDIRECT_URI` | (선택) 콜백 URL. 기본: `http://localhost:4000/api/shorts/youtube/callback` |
| `YOUTUBE_OAUTH_STATE_SECRET` 또는 `CONNECTION_PIN_SECRET` | **Vercel/프로덕션 필수** — 없으면 OAuth 후에도 계정 목록이 비어 있음(토큰이 레거시 placeholder 사용자 행에만 저장됨) |
| `FRONTEND_ORIGIN` | (선택) OAuth 콜백 후 리다이렉트할 프론트 주소. 기본: `http://localhost:5173` |
| `GEMINI_API_KEY` | (선택) 스크립트 등 **텍스트** LLM 우선(`gemini-1.5-flash`). Vercel에도 백엔드 환경 변수로 설정 후 재배포 |
| `OPENAI_API_KEY` | (선택) DALL·E **이미지** 생성. 없으면 플레이스홀더 URL. 스크립트는 Gemini 없을 때 보조로 사용 가능 |

Google Cloud Console에서 **YouTube Data API v3** 사용 설정 후 OAuth 동의 화면·사용자 인증 정보에서 **웹 애플리케이션**으로 클라이언트 ID/시크릿 발급하고, **승인된 리디렉션 URI**에 `YOUTUBE_REDIRECT_URI` 값을 추가해야 합니다.

## 파이프라인 단계

1. **트렌드 수집** — YouTube Data API로 키워드 검색 (API 미설정 시 스텁 주제 1건)
2. **스크립트·캐릭터** — `GEMINI_API_KEY`(우선) 또는 `OPENAI_API_KEY`로 LLM 스크립트, 없으면 규칙 기반 폴백
3. **이미지 생성** — `OPENAI_API_KEY` 있으면 DALL·E 3, 없으면 플레이스홀더 (Gemini는 현재 이미지 경로 미사용)
4. **TTS** — `google-tts-api`로 장면별 한국어 음성 생성 (API 키 불필요)
5. **영상 조립** — FFmpeg 있으면 로컬 조립; Vercel·위임 모드면 `pending_assembly` 후 외부 워커
6. **업로드** — YouTube 연동 시 실업로드(프리셋·처리 폴링 반영), 미연동 시 오류

## 아바타 프리셋

- **쇼츠봇** — 미니멀 일러스트
- **VTuber 스타일** — 애니메이션 스타일
- **3D 캐릭터** — 3D 렌더
- **만화 캐릭터** — 만화 스타일

프리셋은 스크립트의 `imagePromptHint`에 반영되어 이미지 생성 시 일관된 캐릭터 톤을 유지합니다.

## 확장 시

- `assembleVideo`: FFmpeg로 이미지+오디오 합성해 실제 mp4 생성
- `generateScriptForTopic`: LLM 연동으로 연변·캐릭터 다양화
- 스케줄러(크론/큐)로 `runPipelineOnce` 주기 실행 시 자율 업로드
