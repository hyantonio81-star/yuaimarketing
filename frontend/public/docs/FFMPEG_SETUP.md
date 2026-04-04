# FFmpeg 설치 가이드 (Shorts 영상 조립용)

Nexus AI Shorts 파이프라인에서 **편집 에이전트**가 이미지+TTS+BGM을 mp4로 조립할 때 FFmpeg가 필요합니다. 미설치 시 편집 단계는 스텁 경로만 반환합니다.

- 공식: [ffmpeg.org/download](https://www.ffmpeg.org/download.html) — `ffmpeg-*.tar.xz` 는 **소스(컴파일용)** 입니다. Windows 개발은 **winget** 또는 **Gyan 빌드** 권장.

---

## Windows

### 방법 1: winget (권장)

관리자 권한 없이 설치 가능합니다.

```powershell
winget install Gyan.FFmpeg --accept-package-agreements --accept-source-agreements
```

- 설치 후 **새 터미널을 열어야** `ffmpeg` 명령이 인식됩니다. (PATH 반영)
- 확인: 새 터미널에서 `ffmpeg -version`
- PATH에 없으면 `backend/.env`에 **`FFMPEG_PATH`** 로 `ffmpeg.exe` 전체 경로 지정

### 방법 2: 수동 설치

1. [https://www.gyan.dev/ffmpeg/builds/](https://www.gyan.dev/ffmpeg/builds/) 또는 [ffmpeg.org](https://ffmpeg.org/download.html)에서 Windows 빌드 다운로드.
2. 압축 해제 후 `bin` 폴더를 PATH에 추가 (시스템 환경 변수 또는 사용자 환경 변수).

---

## macOS

```bash
brew install ffmpeg
```

---

## Linux (Ubuntu/Debian)

```bash
sudo apt update && sudo apt install -y ffmpeg
```

---

## 설치 확인

- 터미널에서 `ffmpeg -version` 실행 시 버전 정보가 나오면 성공.
- 프로젝트 루트에서 설정 체크 스크립트 실행:

```bash
cd nexus-ai
node scripts/check-setup.js
```

---

## 참고

- 리포지토리의 `docs/SHORTS_AGENT.md` — Vercel 배포 시 원격 조립·워커
- `docs/E2E_FIRST_RUN_기획.md` — Shorts E2E 체크리스트
