# YouTube Shorts AI 팀 기획 (분야별 에이전트)

## 1. 개요

동영상 생성 파이프라인을 **분야별 AI 팀(에이전트)** 로 나누어 역할·입출력 계약을 명확히 하고, BGM·캐릭터 아바타·영상 조립을 추가한다.

## 2. 에이전트 구성

| 팀(에이전트) | 담당 | 입력 | 출력 | 구현 파일 |
|--------------|------|------|------|-----------|
| **트렌드/리서치** | 주제 수집 | keywords, options | TrendTopic[] | shortsTrendAgent.ts |
| **스크립트/캐릭터** | 대본·캐릭터 설계 | TrendTopic, avatarPresetId | ShortsScript | shortsScriptAgent.ts |
| **비주얼(아바타·장면)** | 캐릭터 1인 제작 + 장면 이미지 | ShortsScript, avatarPresetId | characterImageUrl?, sceneImages | shortsVisualAgent.ts |
| **보이스(TTS)** | 장면별 음성 | ShortsScript.scenes | sceneAudios[] | shortsVoiceAgent.ts |
| **BGM** | 배경음 선택/다운로드 | durationSeconds, genre? | bgmPath \| null | shortsBgmAgent.ts |
| **편집/조립** | 이미지+TTS+BGM → mp4 | script, sceneImages, sceneAudios, bgmPath? | videoPath, thumbnailPath | shortsEditAgent.ts |
| **배포** | YouTube 업로드 | videoPath, meta | videoId, url | shortsDeployAgent.ts |

## 3. 데이터 흐름

```
keywords → [트렌드] → topics
  → [스크립트] → script
  → [비주얼] → characterImageUrl, sceneImages
  → [보이스] → sceneAudios
  → [BGM] → bgmPath (optional)
  → [편집] → videoPath, thumbnailPath
  → [배포] → videoId, url
```

오케스트레이터(`shortsAgentService`)는 위 순서로 각 에이전트를 호출하고, 실패 시 해당 단계만 재시도·로깅할 수 있도록 설계한다.

## 4. 상세

### 4.1 트렌드 에이전트
- YouTube Data API로 키워드당 Shorts 후보 수집.
- API 미설정 시 스텁 주제 1건 반환.

### 4.2 스크립트 에이전트
- 주제 1개 + 아바타 프리셋 ID → 훅·장면 3개·캐릭터 힌트.
- 추후 LLM 연동으로 연변·캐릭터 다양화 가능.

### 4.3 비주얼 에이전트
- **캐릭터 1인 제작**: 아바타 힌트로 기준 이미지 1장 먼저 생성 → `characterImageUrl` (썸네일/1장면 활용).
- **장면 이미지**: 동일 힌트로 장면별 이미지 생성 (기존 DALL·E/placeholder).
- 출력: characterImageUrl(선택), sceneImages[].

### 4.4 보이스 에이전트
- google-tts-api로 장면별 텍스트 → mp3 파일 경로.
- 출력: sceneAudios[] (sceneIndex, audioPath).

### 4.5 BGM 에이전트
- 옵션 A: 무료 BGM 라이브러리(URL)에서 장르·길이에 맞춰 선택 후 다운로드 → 로컬 경로 반환.
- 옵션 B: BGM 없음(null) 반환 시 편집 단계에서 TTS만 사용.
- 초기: 길이만 입력받아 선택지 1~2개 또는 null.

### 4.6 편집 에이전트
- **입력**: script, sceneImages(url 또는 path), sceneAudios(path), bgmPath?(optional).
- **동작**: 이미지 URL은 임시 다운로드 → FFmpeg로 이미지 시퀀스(장면별 duration) + TTS 오디오 + BGM(볼륨 낮춤) 믹스 → mp4 생성. 썸네일은 1장면 이미지 또는 첫 프레임.
- **환경**: 시스템에 `ffmpeg` 설치 필요. 미설치 시 스텁 반환 또는 에러 메시지.

### 4.7 배포 에이전트
- 기존 YouTube OAuth + multipart 업로드. 추후 TikTok/인스타 등 확장.

## 5. 디렉터리 구조

```
backend/src/services/
  shorts/
    shortsTrendAgent.ts
    shortsScriptAgent.ts
    shortsVisualAgent.ts
    shortsVoiceAgent.ts
    shortsBgmAgent.ts
    shortsEditAgent.ts
    shortsDeployAgent.ts
    index.ts
  shortsAgentService.ts   (오케스트레이터만 유지, shorts/* 호출)
  shortsImageService.ts   (비주얼 에이전트에서 사용)
  shortsTtsService.ts     (보이스 에이전트에서 사용)
  youtubeUploadService.ts (배포 에이전트에서 사용)
```

## 6. 적용 순서

1. ~~기획 문서 정리 (본 문서)~~
2. ~~에이전트 모듈 분리 (trend, script, visual, voice, bgm, edit, deploy)~~
3. ~~BGM 에이전트 추가 (라이브러리 또는 null)~~
4. ~~편집 에이전트 실구현 (FFmpeg 연동)~~
5. ~~비주얼 에이전트에 캐릭터 1인 제작 단계 추가~~
6. ~~shortsAgentService를 오케스트레이터로 리팩터링~~

**구현 완료.** `backend/src/services/shorts/` 하위 에이전트 모듈 및 오케스트레이터 적용됨. FFmpeg 미설치 시 편집 단계는 스텁 경로 반환.
