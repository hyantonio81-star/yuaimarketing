# 다중 채널·제휴 전략 — 웹앱에서만 설정·운영

푸시/배포 이후 **코드 수정 없이** 웹앱 UI에서만 "툭딱" 설정하고 운영할 수 있도록 구성한 내용을 정리합니다.

---

## 1. 원칙: 웹에서만 설정·운영

- **채널 추가·계정 프로필·제휴 설정** 등은 모두 **웹앱(설정 > 연동, Shorts, 콘텐츠 자동화)** 에서만 변경합니다.
- 설정값은 서버의 **파일 저장소**(`data/` 디렉터리)에 영속화되므로, 재배포 후에도 유지됩니다.
- 새 **플랫폼**(예: TikTok API)이나 새 **마켓 타입**을 코드에 한 번 추가한 뒤에는, "어떤 계정을 쓸지·어떤 테마/언어/마켓을 쓸지"는 전부 웹에서 설정합니다.

---

## 2. 채널 프로필 (계정별 주제·언어·제휴)

### 목적

- 계정이 여러 개일 때 **주제(테마)·언어·제휴 집중**을 계정별로 구분합니다.
- 같은 영상을 전 계정에 올리지 않고, **주제·언어에 맞는 계정만** 선택해 업로드할 수 있도록 합니다.

### 저장 위치

- **백엔드**: `data/channel-profiles.json`
- **키**: `{platform}:{accountKey}` (예: `youtube:default`, `youtube:yt_2`)

### 프로필 필드

| 필드 | 설명 |
|------|------|
| `theme` | 주제(테마): health, manga, culture_travel, affiliate_general, affiliate_es, lifestyle, tech, other |
| `primaryLanguage` | 주 사용 언어: es-DO, es-MX, pt-BR, ko, en |
| `affiliateFocus` | 이 채널이 제휴 콘텐츠에 집중하는지 |
| `marketplaceAllowlist` | 허용 마켓 목록 (비어 있으면 전부 허용): amazon, aliexpress, temu, shein 등 |
| `label` | 표시용 라벨 (선택) |

### 웹에서 설정하는 방법

1. **설정 > 연동** 페이지에서 **YouTube (Shorts)** 섹션으로 이동합니다.
2. 연동된 각 계정 옆 **「채널 프로필」** 을 펼칩니다.
3. **주제(테마)**, **주 사용 언어**, **제휴 콘텐츠 집중**, **허용 마켓**을 설정한 뒤 **「프로필 저장」** 을 누릅니다.

설정은 즉시 `data/channel-profiles.json`에 반영되며, 재배포가 필요 없습니다.

### API (백엔드)

- `GET /api/shorts/channel-profiles?platform=youtube` → `{ profiles: { "default": {...}, "yt_2": {...} } }`
- `GET /api/shorts/channel-profiles/:key?platform=youtube` → 단일 프로필
- `PUT /api/shorts/channel-profiles/:key?platform=youtube` → 프로필 저장 (body: `theme`, `primaryLanguage`, `affiliateFocus`, `marketplaceAllowlist`, `label`)

### Shorts 화면에서의 활용

- **Shorts** 페이지에서 업로드할 **YouTube 계정**을 선택할 때, 드롭다운에 **프로필 요약**(테마 / 언어)이 함께 표시됩니다.
- 추후 Shorts 제작·배포 시 "올릴 계정" 제안을 프로필(주제·언어)에 맞게 필터링하는 확장이 가능합니다.

---

## 3. 콘텐츠 자동화 설정 영속화

- **이전**: 콘텐츠 자동화 설정(언어, 마켓, Threads 계정, 제휴 파라미터 등)이 메모리에만 있어 재시작 시 초기화되었습니다.
- **현재**: `data/content-automation-settings.json`에 저장됩니다.
- **웹**에서 **콘텐츠 자동화** 관련 설정을 변경하면 파일에 저장되며, 재배포·재시작 후에도 유지됩니다.

### API

- `GET /api/content-automation/settings` → 현재 설정 (파일에서 로드)
- `PUT /api/content-automation/settings` → 설정 저장 (파일에 기록)

---

## 4. YouTube 연동 버그 수정

- `exchangeCodeAndStore(code, key)` 내부에서 `k`가 정의되지 않은 채 사용되던 부분을 수정했습니다. 이제 `key`로 저장됩니다.

---

## 5. 제약 사항

- **코드 수정 없이** 가능한 것:
  - 채널 프로필(테마, 언어, 제휴 집중, 마켓 허용 목록) 추가·수정
  - 콘텐츠 자동화 설정 변경
  - 연동된 계정 중 "어떤 계정을 사용할지" 선택
- **한 번은 코드에 반영이 필요한 것**:
  - 새 **플랫폼**(TikTok, Instagram API 등) 연동
  - 새 **MarketplaceId** 타입 추가
  - 새 **테마(theme)** 옵션 추가 (드롭다운에 새 값을 넣으려면 프론트/백엔드 옵션 추가 필요)

이후에는 "어떤 계정/어떤 마켓/어떤 테마를 쓸지"는 전부 웹앱에서만 설정·운영하면 됩니다.
