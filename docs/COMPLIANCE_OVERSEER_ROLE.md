# 감독관 롤 기반 (Compliance Overseer Role Foundation)

yuaimarketing 자율 에이전트 팀에서 **AI 감독관**이 담당하는 역할, 입·출력 규격, 외부 연동(예: Make.com) 시 JSON 규격, SOP를 정의합니다. ISO/IEC 42001 및 중남미 시장 요구를 반영합니다. **베이스 시스템은 yuaimarketing(nexus-ai)**입니다.

---

## 1. 감독관 롤 정의

| 항목 | 내용 |
|------|------|
| **역할** | 콘텐츠/메시지가 **발행·발송되기 직전**에만 실행되는 게이트키퍼. Lumi(리더)의 전략은 따르지 않고, **법·윤리·정책**만 검사. |
| **입력** | 발행될 본문 전체(블로그 HTML + 이미지 포함 문구, SNS 복사, B2B 메시지), `targetCountry`, `contentType`. |
| **출력** | `[APPROVE]` 또는 `[REJECT]` + 반려 시 **항목별 사유**(한글·스페인어). |
| **책임** | 9대 체크리스트 적용, 결과 로그 보관, REJECT 시 Content Agent 재생성용 피드백(`rejectReasonsEs`) 제공. |

감독관은 **stateless**: 한 번 호출 시 “현재 본문에 대한 승인/반려”만 반환. 재생성·재검수 반복은 **yuaimarketing 파이프라인** 또는 외부 자동화(예: Make.com)가 담당.

---

## 2. 9대 체크리스트

| ID | 항목 | 기준 | 스페인어 반려 메시지 |
|----|------|------|----------------------|
| transparency | 투명성(광고/제휴 표기) | afiliado/publicidad 등 표기 포함 | Nota de afiliado/enlaces de afiliados faltante. |
| customs_regulations | 무역 규정(DO $200 면세) | DO 타겟 시 $200·면세 안내 포함 | Información aduanera (ej. US$200 libre de impuestos en RD) no mencionada. |
| language_guardrail | 언어 가드레일 | 비속어·혐오 표현 없음 | Expresiones prohibidas o discriminatorias detectadas. |
| privacy_optout | 개인정보(수신 거부) | B2B 메시지 시 BAJA 등 포함 | Falta opción de baja (BAJA) en el mensaje. |
| accuracy | 가격·정보 정확성 | productPrice 제공 시 본문 가격이 원본과 15% 이내 | Precisión de precios o datos insuficiente. |
| copyright | 저작권 | (확장 시) 이미지·상표 적절성 | Posible violación de derechos de autor o marca. |
| ethics | 윤리적 영향 | (확장 시) 사용자 오해·손실 소지 | Riesgo ético o de malentendido para el usuario. |
| expertise | 전문성 | 소재·배송·팁 등 정보성 콘텐츠 + DO/MX 시 현지 맥락 | Falta contenido informativo (material, envío, tips, especificaciones). |
| false_urgency | 허위 긴급성·과장 금지 | "solo quedan X", "últimas unidades", "100% descuento" 등 미사용 | Uso de urgencia falsa o mensajes exagerados no permitido. |

---

## 3. 입·출력 및 외부 연동용 JSON 규격

### 3.1 감독관 입력 (Content Agent → Compliance Overseer)

```json
{
  "jobId": "ca_1739...",
  "contentType": "b2c_affiliate",
  "targetCountry": "DO",
  "blogBodyForPublish": "<html>...</html>",
  "snsCopy": "¡Qué lo qué! ...",
  "productPrice": 18.99
}
```

### 3.2 감독관 출력 (Compliance Overseer → Router)

**APPROVE 예시**

```json
{
  "compliance_status": "APPROVE",
  "approved": true,
  "rejectReasons": [],
  "rejectReasonsEs": [],
  "checklistResults": {
    "transparency": true,
    "customs_regulations": true,
    "language_guardrail": true,
    "privacy_optout": true,
    "accuracy": true,
    "copyright": true,
    "ethics": true,
    "expertise": true,
    "false_urgency": true
  },
  "checkedAt": "2025-02-26T12:00:00.000Z"
}
```

**REJECT 예시**

```json
{
  "compliance_status": "REJECT",
  "approved": false,
  "rejectReasons": ["투명성(광고/제휴 표기)", "무역 규정(DO $200 면세 안내)"],
  "rejectReasonsEs": [
    "Nota de afiliado/enlaces de afiliados faltante.",
    "Información aduanera (ej. US$200 libre de impuestos en RD) no mencionada."
  ],
  "checklistResults": { "transparency": false, "customs_regulations": false, ... },
  "checkedAt": "2025-02-26T12:00:00.000Z"
}
```

- **Router**: `compliance_status === "APPROVE"` 일 때만 Blogger/Threads 실행.
- **REJECT 시**: `rejectReasonsEs`를 Content Agent로 전달해 수정 지시 후 재검수(최대 N회 권장).

---

## 4. 반복 루프 (REJECT → Content Agent)

- 감독관은 **1회 검수만** 수행. 재생성·재검수는 **yuaimarketing 오케스트레이션** 또는 외부 자동화 책임.
- 외부 자동화(예: Make.com) 권장 플로우:
  1. Content Agent → 초안 생성.
  2. yuaimarketing Compliance Overseer API → 검수.
  3. Router: APPROVE → Blogger/Threads; REJECT → `rejectReasonsEs`를 Content Agent로 전달 → 1로 돌아가기(최대 2회 등 상한 설정).

---

## 5. 서비스별 SOP (감독관 관점)

| 서비스 | 감독관이 검사하는 것 | 준수 기준 |
|--------|----------------------|-----------|
| **B2C** | 블로그/SNS 초안 | 광고 표기, DO $200 관세 안내, 언어 가드레일, 전문성(소재·배송·팁). 가격 USD·현지통화 병기·배송 “마이애미 창고 기준” 등은 Content Agent 지침에 반영. |
| **B2B** | 메시지 초안 | 첫 메시지에 수신 거부(BAJA) 안내 포함(privacy_optout). 출처(Source) 기록은 수집·발송 파이프라인에서 메타데이터로 유지. |
| **ISO 42001** | — | 매주 감독관 검수 로그를 분석해 반려 비율·항목별 실패 빈도를 Lumi가 보고. |

---

## 6. 주간 로그 분석용 포맷

검수 결과를 저장할 때 아래 필드를 남기면 주간 분석에 활용할 수 있습니다.

| 필드 | 설명 |
|------|------|
| jobId | 파이프라인 작업 ID |
| checkedAt | 검수 시각 (ISO 8601) |
| approved | true / false |
| compliance_status | APPROVE / REJECT |
| rejectReasons | 한글 사유 배열 |
| rejectReasonsEs | 스페인어 사유 배열 |
| checklistResults | 항목별 pass/fail |
| contentType | b2c_affiliate / b2b_message |
| targetCountry | DO, MX, BR 등 |

- yuaimarketing 백엔드: 현재는 API 응답에만 포함. 영구 저장이 필요하면 DB/시트/파일 로그 레이어 추가.
- 외부 자동화(예: Make.com): "Compliance Overseer" 출력 → Google Sheet/Data Store 등에 기록 후 주간 집계. “Compliance Overseer” 출력 → Google Sheet/Data Store 등에 기록 후 주간 집계.

---

## 7. 관련 코드

- `backend/src/services/contentAutomation/complianceOverseerService.ts` — 9대 체크·rejectReasonsEs·compliance_status·false_urgency·accuracy(가격 비교)
- `backend/src/services/contentAutomation/types.ts` — `ContentComplianceInput`, `ComplianceCheckResult`, `ComplianceCheckItemId`
- `backend/src/services/contentAutomation/contentAutomationService.ts` — 파이프라인 내 검수 호출
- `docs/AI_GOVERNANCE_POLICY.md` — 4대 거버넌스 룰·서비스별 준수 사항

---

문서 버전: 2025. 정책·체크리스트 변경 시 본 문서와 `AI_GOVERNANCE_POLICY.md`를 함께 갱신하세요.
