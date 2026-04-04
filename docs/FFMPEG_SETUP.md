# FFmpeg 설치 가이드 (Shorts 영상 조립용)

Nexus AI Shorts 파이프라인에서 **편집 에이전트**가 이미지+TTS+BGM을 mp4로 조립할 때 FFmpeg가 필요합니다. 미설치 시 편집 단계는 스텁 경로만 반환합니다.

- **공식 다운로드·저장소 안내**: [FFmpeg Download / Git repositories](https://www.ffmpeg.org/download.html#repositories) — FFmpeg는 기본적으로 **소스 배포**이며, `ffmpeg-8.1.tar.xz` 같은 아카이브는 **직접 컴파일**용입니다. Windows에서 Shorts만 쓸 때는 아래 **바이너리 설치**가 현실적입니다.

---

## Windows

### 방법 1: winget (권장)

관리자 권한 없이 설치 가능합니다.

```powershell
winget install Gyan.FFmpeg --accept-package-agreements --accept-source-agreements
```

또는 프로젝트 루트에서:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-ffmpeg-windows.ps1
```

- 설치 후 **새 터미널을 열어야** `ffmpeg` 명령이 인식됩니다. (PATH 반영)
- 확인: 새 터미널에서 `ffmpeg -version`
- PATH에 잡히지 않으면 `backend/.env`에 **`FFMPEG_PATH=C:\실제경로\ffmpeg.exe`** 를 넣으면 백엔드가 해당 실행 파일을 사용합니다.

### 방법 2: 수동 설치

1. [https://www.gyan.dev/ffmpeg/builds/](https://www.gyan.dev/ffmpeg/builds/) 또는 [ffmpeg.org](https://ffmpeg.org/download.html)에서 Windows 빌드 다운로드.
2. 압축 해제 후 `bin` 폴더를 PATH에 추가 (시스템 환경 변수 또는 사용자 환경 변수).

### 방법 3: BtbN FFmpeg-Builds (GitHub 릴리스)

[ffmpeg.org](https://www.ffmpeg.org/download.html)에서도 “Windows builds by **BtbN**”으로 연결되는 자동 빌드입니다.

- 릴리스: [github.com/BtbN/FFmpeg-Builds/releases](https://github.com/BtbN/FFmpeg-Builds/releases)
- Windows 64비트 예: **`ffmpeg-master-latest-win64-gpl-shared.zip`** (또는 `-gpl` 정적에 가까운 패키지). 압축 해제 후 **`bin\ffmpeg.exe`** 를 사용합니다.
- **`-shared` 빌드**는 `ffmpeg.exe`와 같은 `bin` 안의 **DLL을 함께 두어야** 합니다. 폴더째 두고 `FFMPEG_PATH`만 `ffmpeg.exe` 절대 경로로 지정하는 방식이 안전합니다.
- Nexus Shorts는 일반적인 인코딩(`libx264` 등)을 쓰므로 **GPL** 빌드로 무방합니다. (배포·라이선스 정책이 엄격하면 LGPL 변형과 법무 검토를 고려하세요.)

`backend/.env` 예:

```env
FFMPEG_PATH=C:\도구\ffmpeg-master-latest-win64-gpl-shared\bin\ffmpeg.exe
```

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

- [SHORTS_AI_TEAMS_기획.md](./SHORTS_AI_TEAMS_기획.md) — 편집 에이전트(§4.6)
- [E2E_FIRST_RUN_기획.md](./E2E_FIRST_RUN_기획.md) — Shorts E2E 체크리스트
