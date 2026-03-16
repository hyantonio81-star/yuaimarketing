# B2B 메시지·리드 API

B2B 발송 메시지 준비/검수(LGPD·옵트아웃)와 리드 생성·조회·이전, Hot Lead 생성 API를 정리합니다.

---

## 1. B2B 메시지 (준비·검수)

### 1.1 준비: 푸터 부착

발송 전 본문에 **수신 거부(BAJA)** 문구를 붙입니다. LGPD·옵트아웃 준수용.

- **Endpoint**: `POST /b2b/prepare-message`
- **Body**:
  - `body` (string, optional): 발송할 본문. 비어 있으면 푸터만 반환.
  - `locale` (optional): `"es"` | `"pt"`. 기본 `"es"`.
- **Response**: `{ prepared: string }` — 본문 + 푸터가 붙은 최종 텍스트.

**예시**

```json
POST /b2b/prepare-message
{ "body": "Estimado cliente, le ofrecemos...", "locale": "es" }

→ { "prepared": "Estimado cliente, le ofrecemos...\n\n[푸터: 수신 거부 안내]" }
```

### 1.2 검수: 감독관 검수

B2B 메시지 본문에 대해 **콘텐츠 감독관** 검수를 실행합니다. `contentType: b2b_message` 기준(privacy_optout 등) 검사.

- **Endpoint**: `POST /b2b/validate-message`
- **Body**:
  - `body` (string, optional): 검수할 본문.
  - `target_country` (string, optional): 대상 국가(DO, MX, BR, US, **PA**). 미지정 시 DO.
- **Response**: `ComplianceCheckResult` — `approved`, `compliance_status`, `rejectReasons` 등.

**예시**

```json
POST /b2b/validate-message
{ "body": "Oferta B2B...", "target_country": "BR" }

→ { "approved": true, "compliance_status": "APPROVE", "rejectReasons": [], ... }
```

### 1.3 제안서 템플릿 (스페인어·플레이스홀더 치환)

AI 감독 위원회 검수 구조의 B2B 파트너 제안서 본문을 변수로 채우고, 푸터까지 부착한 발송용 텍스트를 반환합니다. yuaimarketing API 응답을 WhatsApp/이메일 등 발송 채널에 그대로 사용 가능.

- **Endpoint**: `POST /b2b/proposal`
- **Body**:
  - `product_name` (optional): 품목명 (예: inversores solares).
  - `country_name` (optional): 국가명 표기 (예: República Dominicana, Panamá).
  - `sector_name` (optional): 업종명 (예: equipos eléctricos).
  - `partner_name` (optional): 파트너 성함 또는 Empresa.
  - `locale` (optional): `"es"` | `"pt"`. 기본 `"es"`.
- **Response**: `{ subject: string, body_prepared: string }` — 제목 + 본문(푸터 포함).

### 1.4 발송 로그 (감사)

실제 발송 시 `b2bMessageService.createB2bSendLogEntry({ body, channel, compliance_passed, ... })`로 로그 엔트리를 만들 수 있습니다. ISO 42001·감사용. API로는 직접 노출하지 않으며, 연동 측에서 저장·조회를 구현할 수 있습니다.

---

## 2. 리드 API

### 2.1 타입

- **Lead**: `id`, `product_or_hs`, `country`, `source`, `score`, `status`, `buyer_id`, `buyer_name`, `buyer_contact`, `created_at`, `updated_at`, `metadata`
- **LeadStatus**: `new` | `contacted` | `qualified` | `transferred` | `closed`
- **Source**: `manual` | `hot_lead` | `match_buyers` | `api`

리드는 **인메모리** 저장이며, 서버 재시작 시 초기화됩니다. 영구 저장이 필요하면 DB 연동으로 확장하면 됩니다.

### 2.2 리드 생성

- **Endpoint**: `POST /b2b/leads`
- **Body** (CreateLeadInput):
  - `product_or_hs` (string, required): 제품명 또는 HS 코드.
  - `country` (string, required): 국가 코드.
  - `source` (optional): `manual` | `hot_lead` | `match_buyers` | `api`. 기본 `manual`.
  - `score` (optional): 0..100. 기본 50.
  - `buyer_id`, `buyer_name`, `buyer_contact` (optional).
  - `metadata` (optional): 객체.
- **Response**: 생성된 `Lead` 객체.

### 2.3 리드 목록

- **Endpoint**: `GET /b2b/leads`
- **Query**:
  - `country`, `status`, `source`, `min_score`: 필터.
  - `limit` (default 50, max 100), `offset` (default 0): 페이지네이션.
- **Response**: `{ leads: Lead[], total: number }`

### 2.4 리드 이전

- **Endpoint**: `POST /b2b/leads/:id/transfer`
- **Body**: `{ supplier_id?: string, fee?: number }`
- **Response**: `LeadTransferResult` — `lead_id`, `supplier_id`, `fee`, `transferred_at`, `success`

리드 상태가 `transferred`로 바뀌고, `metadata`에 `transfer_supplier_id`, `transfer_fee`가 기록됩니다.

---

## 3. Hot Lead

**trade-market-score**와 **match-buyers**를 조합해 품질 점수(quality_score)를 낸 후보를 생성·리드로 저장할 수 있습니다.

### 3.1 후보 조회 (리드 미생성)

- **Endpoint**: `GET /b2b/hot-leads/candidates`
- **Query**:
  - `origin` (default KR): 수출국.
  - `destination` (default US): 수입국.
  - `product_or_hs`: 제품명 또는 HS 코드. 기본 `8504`.
  - `limit` (default 20, max 50): 후보 개수.
- **Response**: `{ candidates: HotLeadCandidate[] }`

각 후보: `buyer` (MatchedBuyer), `trade_score_result` (TradeMarketScoreResult), `quality_score` (0..100, trade 40% + match 60% 가중 평균).

- **destination**이 **DO** 또는 **PA**일 때 **product_or_hs**를 생략하면, 중남미 타겟 품목 리스트의 기본 HS(예: 8504)가 사용됩니다.

### 3.2 Hot Lead 생성 (리드 저장)

- **Endpoint**: `POST /b2b/hot-leads`
- **Body**:
  - `origin` (default KR), `destination` (default US), `product_or_hs` (default 8504).
  - `count` (default 5, max 20): 생성할 리드 개수.
- **Response**: `{ leads: Lead[] }` — `source: "hot_lead"`, `buyer_id`/`buyer_name` 및 `metadata`(origin, trade_total_score, match_score) 포함.

- **Response**: `{ leads: Lead[] }` — `source: "hot_lead"`, `buyer_id`/`buyer_name` 및 `metadata`(origin, trade_total_score, match_score) 포함.
- **destination**이 DO/PA일 때 **product_or_hs** 미지정 시 중남미 기본 품목(8504 등) 적용.

---

## 4. 파트너 검증 (B2B 신용 검수)

콘텐츠 감독과 분리된 **파트너(업체) 사전 검증**입니다. 법률/비즈니스/윤리 역할별 점수·소스(ONAPI, 노란페이지, 뉴스 감성 등)를 반영하며, 현재는 목(mock) 구현입니다. 실제 ONAPI/블랙리스트 연동 시 교체 가능.

### 4.1 검증 실행

- **Endpoint**: `POST /b2b/partners/verify`
- **Body** (PartnerVerificationInput):
  - `partner_id` (string, required): 업체/파트너 식별자.
  - `organization_name` (optional), `country_code` (optional, default DO), `registration_id` (optional, RNC/RUC 등), `lead_id` (optional).
- **Response**: `PartnerVerificationResult` — `decision` (APPROVED | REJECTED | PENDING), `overall_score` (0..100), `by_role: { legal, business, ethics }`, `verified_at`.

### 4.2 검증 상태 조회 (발송 게이트)

- **Endpoint**: `GET /b2b/partners/:id/verification-status`
- **Response**: `PartnerVerificationResult` 또는 404.

**발송 게이트**: `overall_score >= 80` 이고 `decision === "APPROVED"` 인 경우에만 WhatsApp/이메일 발송을 허용하는 것을 권장합니다. (호출 주체: yuaimarketing 연동 클라이언트 또는 외부 자동화.)

### 4.3 리드별 검증 상태

리드의 `buyer_id`를 `partner_id`로 사용해 검증 결과를 조회합니다.

- **Endpoint**: `GET /b2b/leads/:id/verification-status`
- **Response**: `{ lead_id, approved: boolean, verification: PartnerVerificationResult | null }`.  
  `approved === true` 이면 발송 허용.

### 4.4 파트너 검수 결과 스키마 (JSON 예시)

```json
{
  "partner_id": "buyer-1",
  "organization_name": "Ejemplo S.R.L.",
  "country_code": "DO",
  "registration_id": "12345678",
  "decision": "APPROVED",
  "overall_score": 82,
  "by_role": {
    "legal": { "role": "legal", "score": 85, "passed": true, "checks": ["registration_valid", "blacklist_check"], "sources_used": ["ONAPI", "internal_blacklist"] },
    "business": { "role": "business", "score": 80, "passed": true, "checks": ["operating_duration", "web_active"], "sources_used": ["LinkedIn", "Paginas Amarillas"] },
    "ethics": { "role": "ethics", "score": 81, "passed": true, "checks": ["sentiment_news", "reputation_risk"], "sources_used": ["news_sentiment"] }
  },
  "verified_at": "2026-02-25T12:00:00.000Z",
  "lead_id": "lead_xxx"
}
```

---

## 5. 중남미 타겟 품목 리스트 (2026)

DO·PA 거점 기준 유망 품목. Hot Lead/매칭 기본값으로 사용됩니다.

- **Endpoint**: `GET /b2b/latam-products`
- **Query**: `country` (optional). 지정 시 해당국 우선 품목만 반환.
- **Response**: `{ products: LatamTargetProduct[], default_hs?: string }`.  
  각 품목: `hs_code`, `label_es`, `label_en`, `category`, `priority_countries`.

---

## 6. 외부 자동화 연동 (REST API 계약)

베이스 시스템은 **yuaimarketing(nexus-ai)**입니다. 시트 감지·WhatsApp 발송 등을 위해 외부 자동화(예: Make.com, Zapier, n8n)를 쓸 때 아래 순서로 yuaimarketing API를 호출하면 됩니다.

| 단계 | API | 용도 |
|------|-----|------|
| 1 | `GET /b2b/latam-products?country=DO` | 타겟 품목·기본 HS 확인 |
| 2 | `GET /b2b/hot-leads/candidates?destination=DO` 또는 `POST /b2b/hot-leads` | 리드 후보/생성 |
| 3 | `POST /b2b/partners/verify` | 파트너 검증 실행 (리스트 입력 후) |
| 4 | `GET /b2b/leads/:id/verification-status` 또는 `GET /b2b/partners/:id/verification-status` | **approved === true** 일 때만 다음 단계로 |
| 5 | `POST /b2b/proposal` | 제안서 본문·제목 생성 (맞춤 변수) |
| 6 | `POST /b2b/validate-message` | 발송 전 콘텐츠 감독관 검수 |
| 7 | (외부 자동화에서 WhatsApp/이메일 발송) | `body_prepared` 사용 |

---

## 7. 정리

| 기능 | 메서드 | 경로 |
|------|--------|------|
| 메시지 푸터 부착 | POST | `/b2b/prepare-message` |
| 메시지 감독관 검수 | POST | `/b2b/validate-message` |
| 제안서 템플릿 치환+푸터 | POST | `/b2b/proposal` |
| 파트너 검증 실행 | POST | `/b2b/partners/verify` |
| 파트너 검증 상태 | GET | `/b2b/partners/:id/verification-status` |
| 리드별 검증 상태 | GET | `/b2b/leads/:id/verification-status` |
| 중남미 타겟 품목 | GET | `/b2b/latam-products` |
| 리드 생성 | POST | `/b2b/leads` |
| 리드 목록 | GET | `/b2b/leads` |
| 리드 이전 | POST | `/b2b/leads/:id/transfer` |
| Hot Lead 후보 | GET | `/b2b/hot-leads/candidates` |
| Hot Lead 생성 | POST | `/b2b/hot-leads` |

B2B 글로벌 매칭·옵션은 [B2B_GLOBAL_MATCHING.md](./B2B_GLOBAL_MATCHING.md)를 참고하세요.  
에이전틱 플로우·단계별 기획은 [B2B_AGENTIC_PLAN.md](./B2B_AGENTIC_PLAN.md)를 참고하세요.
