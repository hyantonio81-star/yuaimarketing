# Shorts 영상 저장·계정 설정·검토·다중 플랫폼 — 구체 시나리오 및 개선안 기획

## 1. 현재 동작 요약

- **저장**: 업로드 완료(done) 또는 미리보기 후 대기(video_ready) 영상을 **서버 지정 경로**에 복사. 업로드된 영상 **7일**, 미업로드 **10일** 보관 후 파일 자동 삭제. 체크리스트(job 기록)는 유지.
- **전달**: **즉시 업로드**(immediate) 또는 **미리보기 후 업로드**(review_first) 선택 가능. 연동 시 YouTube 업로드, 미연동 시 스텁 URL.
- **Job**: **파일 영속화**(`data/shorts_jobs.json`) + 메모리. 재시작 시 로드. `videoUrl`·`videoPath`·`fileDeletedAt` 등 저장.

---

## 2. 구체 시나리오

### 2.1 시나리오 A: 저장 정책

| 구분 | 현재 | A-2 (권장·적용) |
|------|------|------------------|
| 업로드 후 | 파일 유지 안 함 | **업로드 성공 job** 지정 경로에 복사, **7일** 보관 후 파일 삭제, 체크리스트 유지 |
| 미업로드 | — | **video_ready** 10일 보관, 최대 10만 건 상한 후 오래된 것부터 파일 삭제 |
| 경로 | 없음 | `SHORTS_STORAGE_PATH/{jobId}/final.mp4`, 메타는 job 영속화에 포함 |
| 사용자 | — | "저장된 영상" 목록에서 조회·미리보기·다운로드, "체크리스트"에서 삭제 알림·업로드 로그 |

### 2.2 시나리오 B: 계정별 기본 설정

- YouTube 연동 계정별로 **언어, 음성, 포맷, 캐릭터, BGM, 자동 업로드 여부** 등을 기본값으로 저장.
- Shorts 실행 시 채널 선택 시 해당 기본값으로 폼 자동 채움. 사용자가 일부만 변경 가능.

### 2.3 시나리오 C: 미리보기 후 업로드

- **uploadMode**: `immediate`(기본) | `review_first`.
- `review_first`: 영상 조립까지 수행 → 상태 `video_ready`, 파일 저장 → 업로드는 하지 않음. 사용자가 "미리보기" 후 "업로드" 버튼으로 수동 업로드.

### 2.4 시나리오 D: 다중 플랫폼 (추후)

- TikTok, Instagram Reels, Facebook 연동 및 같은 영상을 단수/복수 채널로 배포. 별도 단계에서 구현.

---

## 3. 개선안 적용 현황

| 번호 | 개선안 | 상태 | 비고 |
|------|--------|------|------|
| 1 | 저장 정책 (경로·보관·목록·다운로드) | ✅ 적용 | SHORTS_STORAGE_PATH, job 영속화, GET /library, GET /jobs/:id/video |
| 2 | 계정별 기본 설정 | ✅ 적용 | shorts_channel_defaults.json, GET/PUT /channels/:key/defaults, 파이프라인 병합 |
| 3 | 미리보기 후 업로드 | ✅ 적용 | uploadMode, video_ready, POST /jobs/:id/upload |
| 4 | 자동/수동 업로드 옵션 | ✅ 적용 | defaults.autoUpload, 파이프라인 분기 |
| 5 | 다중 플랫폼 연동 | ✅ 적용(스텁) | YouTube 실제 연동, TikTok·Instagram·Facebook 스텁 URL 반환 |
| 6 | 단수/복수 배포 설정 | ✅ 적용 | 배포 플랫폼 다중 선택(체크박스), deployedUrls 저장·표시 |

---

## 4. 기술 요약

- **저장 경로**: `process.env.SHORTS_STORAGE_PATH` 또는 `backend/data/shorts` (jobId별 하위 폴더).
- **Job 영속화**: `backend/data/shorts_jobs.json`에 job 목록 저장. 서버 기동 시 로드, 갱신 시 저장.
- **채널 기본값**: `backend/data/shorts_channel_defaults.json`. 키는 channelKey(예: default).
- **보관·삭제 정책**:
  - **업로드된 영상(done)**: **7일** 보관 후 **파일 자동 삭제**. job 기록은 체크리스트로 유지(`videoPath` 제거, `fileDeletedAt` 기록).
  - **미업로드(video_ready)**: **10일** 보관. **최대 10만 건** 상한(`SHORTS_VIDEO_READY_MAX_COUNT` 환경변수, 기본 100000). 초과 시 오래된 것부터 파일 삭제, 체크리스트 유지.
  - 만료/상한 시 실제 mp4 파일 삭제 → 서버 공간 절약. `GET /library`, `GET /jobs` 호출 시 만료된 항목 정리 실행.
- **체크리스트**: `GET /api/shorts/checklist` — 파일 삭제된 항목(업로드 로그·미업로드 삭제 알림) 목록. `fileDeletedAt`·`videoUrl` 등으로 조회 가능.
- **다중 플랫폼**: `GET /api/shorts/platforms`로 목록 조회. 파이프라인·수동 업로드 시 `platforms` 배열로 선택. YouTube는 실제 연동, TikTok·Instagram·Facebook은 스텁 URL 반환(추후 API 연동 시 교체). job에 `deployedUrls: { youtube?, tiktok?, ... }` 저장.

---

## 5. 참고

- [IMPROVEMENT_PLAN_보강안.md](./IMPROVEMENT_PLAN_보강안.md)
- [E2E_FIRST_RUN_기획.md](./E2E_FIRST_RUN_기획.md)
