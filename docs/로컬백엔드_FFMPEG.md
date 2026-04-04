# 로컬 백엔드 + FFmpeg (Vercel에는 키만 두고 Shorts 조립은 PC에서)

Vercel에는 **환경 변수만** 두고, **`backend/.env`는 비어 있는** 상태에서는 로컬에서 백엔드를 띄울 수 없습니다.  
Shorts **실제 mp4**는 **API가 실행되는 머신**에서 FFmpeg를 쓰므로, PC에서 조립하려면 **로컬 `backend/.env`**에 최소 설정을 넣고, 브라우저는 **`http://localhost:5173`** 처럼 **로컬 프론트**로 접속해야 합니다.

---

## 1. `backend/.env` 만들기

1. `backend/.env.example` 을 복사해 `backend/.env` 로 저장합니다.
2. **Vercel** → Project → **Settings** → **Environment Variables** 에서 아래 이름들을 **그대로** 복사해 로컬 `.env`에 붙입니다.  
   (값은 Vercel과 **동일**하게 맞추면 됩니다. Git에는 **올리지 마세요**.)

   **권장(로컬 API 동작 최소):**

   | 변수 | 비고 |
   |------|------|
   | `SUPABASE_URL` | Vercel과 동일 |
   | `SUPABASE_ANON_KEY` | Vercel과 동일 |
   | `SUPABASE_SERVICE_ROLE_KEY` | Vercel과 동일 (YouTube 토큰 DB 저장) |
   | `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` / `YOUTUBE_REDIRECT_URI` | 연동·업로드 시 |
   | `YOUTUBE_OAUTH_STATE_SECRET` 또는 `CONNECTION_PIN_SECRET` | 프로덕션과 동일 권장 |
   | 기타 Vercel에 넣은 AI 키 등 | Shorts·기능 쓰는 만큼 |

3. **로컬에만** 추가:

   ```env
   # PC의 ffmpeg.exe (BtbN 등 압축 해제 경로)
   FFMPEG_PATH=C:\Users\YOUR_USER\Downloads\ffmpeg-...\bin\ffmpeg.exe

   # Vite(5173) → API(4000) CORS (로컬 개발)
   ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

4. `YOUTUBE_REDIRECT_URI` 가 `https://xxx.vercel.app/...` 만 있으면 **로컬에서 OAuth 콜백이 안 맞을 수 있습니다.**  
   로컬로 연동 테스트할 때는 Google 콘솔에  
   `http://localhost:4000/api/youtube/oauth/callback`  
   를 추가하고, `.env`에 동일 URI를 넣는 방식을 쓰거나, **연동만 Vercel URL에서** 마칩니다.

---

## 2. 프론트가 로컬 API를 쓰게 하기

- **권장:** 루트에서 `npm run dev` → 프론트 `http://localhost:5173` 접속.  
  `VITE_API_URL` 을 비우면 **같은 호스트의 `/api`** 가 Vite 프록시로 **localhost:4000** 에 붙습니다.
- `frontend/.env` 에 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 는 **Vercel과 동일 값** (로그인용).

**주의:** 배포된 **`https://xxx.vercel.app`** 만 쓰면 API는 계속 **Vercel**이라 PC의 FFmpeg는 쓰이지 않습니다.

---

## 3. 실행 순서

```bash
cd nexus-ai
npm run dev
```

- 백엔드: `http://localhost:4000`
- 프론트: `http://localhost:5173` ← 여기로 접속해 Shorts 실행

확인:

```bash
node scripts/check-setup.js
curl http://localhost:4000/api/shorts/health
```

`ffmpegInstalled` 가 `true` 이고 `deployTarget` 이 `standard` 이면 로컬 FFmpeg 경로가 잡힌 것입니다.

---

## 4. 요약

| 하고 싶은 것 | 해야 할 것 |
|--------------|------------|
| Vercel만 쓰기 | FFmpeg 없음 → 원격 워커 또는 스텁 |
| **PC에서 실제 mp4** | `backend/.env` + `FFMPEG_PATH` + **localhost:5173** 으로 개발 |
| 키는 Vercel에만 있음 | 로컬 `.env`에 **같은 키를 수동 복사** (자동 동기화 없음) |

자세한 FFmpeg 설치: [FFMPEG_SETUP.md](./FFMPEG_SETUP.md)
