# YouTube Shorts 에이전트

정부 입찰(Gov Tender)과 **별도**로 설치된 모듈입니다. 트렌드 수집 → 스크립트·캐릭터·이미지 → TTS → Shorts 영상 → YouTube 업로드 파이프라인을 제공합니다.

## 위치

- **프론트**: 사이드바 **Shorts 에이전트** → `/shorts` (정부 입찰 아래)
- **백엔드**: `GET/POST /api/shorts/*`

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
| `FRONTEND_ORIGIN` | (선택) OAuth 콜백 후 리다이렉트할 프론트 주소. 기본: `http://localhost:5173` |
| `OPENAI_API_KEY` | (선택) DALL·E 이미지 생성. 없으면 플레이스홀더 URL 사용 |

Google Cloud Console에서 **YouTube Data API v3** 사용 설정 후 OAuth 동의 화면·사용자 인증 정보에서 **웹 애플리케이션**으로 클라이언트 ID/시크릿 발급하고, **승인된 리디렉션 URI**에 `YOUTUBE_REDIRECT_URI` 값을 추가해야 합니다.

## 파이프라인 단계

1. **트렌드 수집** — YouTube Data API로 키워드 검색 (API 미설정 시 스텁 주제 1건)
2. **스크립트·캐릭터** — 주제당 훅·장면·선택한 아바타 프리셋으로 스크립트 생성
3. **이미지 생성** — `OPENAI_API_KEY` 있으면 DALL·E 3, 없으면 플레이스홀더
4. **TTS** — `google-tts-api`로 장면별 한국어 음성 생성 (API 키 불필요)
5. **영상 조립** — 스텁(실제 mp4 생성은 추후 FFmpeg 연동)
6. **업로드** — YouTube 연동 시 실업로드, 미연동 시 스텁 URL 반환

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
