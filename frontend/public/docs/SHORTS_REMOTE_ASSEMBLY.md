# Shorts: Vercel 배포 + FFmpeg 원격 조립

Vercel 서버리스에는 **FFmpeg 바이너리가 없습니다**. 스크립트·이미지·TTS는 Vercel에서 돌아가도, **최종 mp4 조립**은 아래 중 하나가 필요합니다.

## 방법 A — 원격 조립 워커 (권장, Vercel 유지)

1. **Vercel 백엔드** 환경 변수  
   - `SHORTS_WORKER_SECRET` — 임의의 긴 비밀 문자열 (외부에 노출 금지)  
   - `SHORTS_DISABLE_REMOTE_ASSEMBLY` — 비우거나 설정하지 않음 (`1`이면 원격 조립 끔)

2. **FFmpeg가 설치된 PC·VPS**에서 같은 리포지토리 루트로 이동 후 환경 변수 설정:

   | 변수 | 예시 |
   |------|------|
   | `SHORTS_API_BASE` | `https://your-app.vercel.app/api/shorts` (끝 슬래시 없음) |
   | `SHORTS_WORKER_SECRET` | Vercel과 **동일**한 값 |
   | `SUPABASE_URL` | 백엔드와 동일 |
   | `SUPABASE_SERVICE_ROLE_KEY` | 백엔드와 동일 |

3. 주기 실행 (예: 1~5분마다 cron / 작업 스케줄러):

   ```bash
   npm run shorts:assembly-worker
   ```

4. 파이프라인이 `pending_assembly`(원격 조립 대기)로 남으면 워커가 claim → 로컬 FFmpeg 조립 → Supabase에 업로드 후 완료 처리합니다.

## 방법 B — 백엔드를 FFmpeg 있는 서버에 두기

Docker 등으로 **FFmpeg 포함 이미지**에 백엔드를 올리면 같은 프로세스에서 mp4까지 생성할 수 있습니다. 리포지토리 루트에서:

```bash
docker build -f backend/Dockerfile -t nexus-backend .
```

자세한 환경 변수는 `docs/SHORTS_AGENT.md`, `docs/ENV_AND_DEPS_체크리스트.md`를 참고하세요.

## YouTube 업로드

업로드는 **Google OAuth 연동**이 필요합니다. 앱에서 **설정 → 연동**에서 YouTube를 연결하세요. API 키만으로는 연동 화면이 사라지지 않습니다.
