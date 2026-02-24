# AI 백신·대응 (AI 보안)

AI 기능(사용자 요청 처리, 리포트 생성 등)에 대한 입력 검증·남용 방지·프롬프트 인젝션 대응 가이드입니다.

---

## 1. 적용된 조치

### 1.1 입력 정규화 및 길이 제한

- **파일**: `backend/src/lib/aiSecurity.ts`
- **내용**:
  - `normalizeAiInput()`: null 바이트 제거, 앞뒤 공백, **최대 8KB** 제한.
  - 모든 AI 호출 전 사용자 입력에 적용 권장.

### 1.2 프롬프트 인젝션 패턴 완화

- **sanitizeForAi()**: 다음 패턴 감지 시 `flagged` 플래그 및 제거/완화:
  - "ignore previous instructions", "you are now", "system:", `[INST]`, `<|...|>` 등.
- **validateAiRequestBody()**: `handle-request` 등 요청 바디 검증 시 사용.  
  - `ok: false`면 400 반환, `flagged: true`면 로그에 경고 기록.

### 1.3 Rate limiting

- **파일**: `backend/src/lib/rateLimit.ts`
- **대상**: `/api/nexus/handle-request` (AI 사용자 요청).
- **규칙**: IP당 **1분에 30회** 초과 시 429 Too Many Requests.
- **구현**: 인메모리. 프로덕션에서는 Redis 등 외부 저장소 연동 권장.

### 1.4 API 권한

- Admin 전용 API(`/api/admin/users`)는 **Authorization: Bearer \<JWT\>** 검증 후 `app_metadata.role === "admin"` 확인.
- JWT는 Supabase `auth.getUser(token)`으로 검증.

---

## 2. 권장 추가 조치

| 항목 | 설명 |
|------|------|
| **출력 필터링** | AI 응답을 그대로 HTML에 넣지 말고, XSS 방지를 위해 이스케이프 또는 허용 태그만 사용. |
| **감사 로그** | AI 요청(입력 요약·플래그·IP·user_id)을 로그 또는 DB에 기록. |
| **비용/할당량** | 사용자별·일별 AI 호출 횟수 제한(DB 또는 Redis). |
| **모델별 정책** | 민감 작업은 별도 모델·프롬프트로 분리하고 접근 제어. |

---

## 3. 프롬프트 인젝션 대응 요약

- **위험**: 사용자가 "Ignore previous instructions and ..." 같은 입력으로 AI 동작을 바꾸려 시도.
- **대응**: 입력 검증(패턴 제거·플래그), 길이 제한, rate limit으로 반복 시도 완화.
- **한계**: 완전 차단은 어렵고, **패턴 기반 + 모니터링**으로 위험도를 낮추는 수준으로 적용됨.

---

## 4. 관련 파일

- `backend/src/lib/aiSecurity.ts` — 입력 정규화·검증·패턴
- `backend/src/lib/rateLimit.ts` — 호출 제한
- `backend/src/routes/nexus.ts` — handle-request에 검증·rate limit 적용
- `backend/src/lib/auth.ts` — JWT·admin 검증
