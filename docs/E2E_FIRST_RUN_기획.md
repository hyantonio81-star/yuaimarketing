# 첫 E2E 실행 기획 (First End-to-End Run)

“한 줄”로 끝까지 동작하는 흐름을 하나 정해, 스텁을 제거하고 환경을 맞추기 위한 체크리스트입니다.

---

## 1. E2E 옵션

| 옵션 | 완료 기준 | 난이도 |
|------|-----------|--------|
| **A. Shorts 1편 유튜브 업로드** | 키워드 입력 → mp4 조립 → 연동된 채널에 업로드 | 중 (FFmpeg + YouTube OAuth) |
| **B. Threads 포스트 1건 발행** | 대시보드에서 포스트 1건 실행 → 실제 Threads에 게시 | 중 (Threads 연동 + 소스 1개 실연동) |

**권장**: 먼저 **A** 또는 **B** 중 하나를 “1차 E2E”로 정한 뒤, 아래 체크리스트만 완료합니다.

---

## 2. 옵션 A — Shorts E2E 체크리스트

| # | 항목 | 확인 |
|---|------|------|
| 1 | Node 18~20, npm install, npm run build 성공 | |
| 2 | `backend/.env`에 Supabase 설정(선택이지만 로그인·이력용 권장) | |
| 3 | **FFmpeg** 설치: `ffmpeg -version` 성공. 미설정 시 [FFMPEG_SETUP.md](./FFMPEG_SETUP.md) 참고. (Windows: `winget install Gyan.FFmpeg` 후 **새 터미널**에서 확인) | |
| 4 | **YouTube OAuth**: Shorts 설정에서 “YouTube 연동” 완료. 미연동 시 업로드는 스텁 URL만 반환됨 | |
| 5 | (선택) `OPENAI_API_KEY`: 이미지 실생성. 없으면 placeholder URL 사용 | |
| 6 | 대시보드 → Shorts → 키워드 입력 후 “실행” → job 상태가 done, videoUrl 확인 | |
| 7 | YouTube 연동된 경우 해당 채널에 Shorts 1편 업로드됨 확인 | |

**실패 시**:  
- 편집 단계에서 스텁 반환 → FFmpeg 설치·경로 확인.  
- 업로드 후에도 스텁 URL → YouTube 연동 상태·콜백 완료 여부 확인.

---

## 3. 옵션 B — Threads 포스트 E2E 체크리스트

| # | 항목 | 확인 |
|---|------|------|
| 1 | Node 18~20, npm install, npm run build 성공 | |
| 2 | `backend/.env`에 Supabase 설정(권장) | |
| 3 | **Threads Commerce 연동**: 대시보드 SEO → Threads Commerce에서 토큰·연동 완료 | |
| 4 | **소스 1개**: Amazon RSS URL 또는 Shein 제휴 피드 URL 설정. 미설정 시 스텁 상품만 나올 수 있음 | |
| 5 | 대시보드 → Threads Commerce → 상품 선택 후 포스트 생성·발행 | |
| 6 | 실제 Threads 계정에 해당 포스트 게시됨 확인 | |

**실패 시**:  
- 포스트가 안 올라가면 연동(토큰)·Rate limit 확인.  
- 상품이 스텁만 나오면 소스(피드/RSS) URL·형식 확인.

---

## 4. 공통

- **의존성·환경**: [ENV_AND_DEPS_체크리스트.md](./ENV_AND_DEPS_체크리스트.md) 참고.  
- **스텁 제거 순서**: [STUB_REPLACEMENT_로드맵.md](./STUB_REPLACEMENT_로드맵.md) 참고.

---

## 5. 1차 수익 타깃과의 연결

- [IMPROVEMENT_PLAN_보강안.md](./IMPROVEMENT_PLAN_보강안.md) §2.4에서 정한 “1차 수익 타깃”(B2B 리드 / 제휴 전환 / Shorts)에 맞춰,  
  - Shorts가 1차면 **옵션 A** E2E를 먼저 완료하고,  
  - 제휴·포스트가 1차면 **옵션 B** E2E를 먼저 완료하는 것을 권장합니다.
