# AI 감독 위원회 (AI Oversight Board)

yuaimarketing 콘텐츠 자동화에서 **단일 감독관** 대신 **3인 위원회**로 검수할 때의 구성·의사결정·API를 정리합니다. ISO/IEC 42001 상호 견제·균형 원칙을 반영합니다.

---

## 1. 구성 (3인 체제)

| 위원 | 역할 | 담당 체크리스트 |
|------|------|----------------|
| **Legal & Compliance** | 법률·규제 | transparency, customs_regulations, privacy_optout, copyright |
| **Ethics & Culture** | 윤리·문화 | language_guardrail, ethics, false_urgency |
| **Business & Quality** | 비즈니스·품질 | accuracy, expertise |

- **다수결**: 3명 중 **2명 이상 승인(APPROVE)** 시 발행.
- **치명적 결함**: Legal 위원이 transparency 또는 customs_regulations 에서 실패하면 **fatal** 플래그. 1명이라도 fatal 시 **DISCARD**(폐기).

---

## 2. 의사결정

| decision | 조건 | 조치 |
|----------|------|------|
| **APPROVE** | 2명 이상 승인 + fatal 없음 | Blogger/Threads 발행 |
| **REVISE** | 1명만 승인 또는 2명 승인이나 수정 권고 | Lumi가 rejectReasonsEsByRole 로 Content Agent에 수정 지시 후 재검수 |
| **DISCARD** | 1명이라도 fatal | 발행 안 함, 로그에 폐기 사유 기록 |

---

## 3. 사용 방법

### 3.1 설정으로 활성화

- **GET /api/content-automation/settings** 응답에 `useOversightBoard: true` 가 있으면 위원회 사용.
- **PUT /api/content-automation/settings** Body에 `"useOversightBoard": true` 를 넣어 저장.

```json
PUT /api/content-automation/settings
{ "useOversightBoard": true }
```

- 기본값은 `false`(단일 감독관).

### 3.2 파이프라인 실행

- **POST /api/content-automation/run** 은 설정에 따라 단일 감독관 또는 위원회를 사용합니다.
- 위원회 사용 시 응답에 **oversightBoard** 필드가 포함됩니다.

---

## 4. 응답 형식 (oversightBoard)

```json
{
  "jobId": "ca_...",
  "status": "done",
  "oversightBoard": {
    "decision": "APPROVE",
    "compliance_status": "APPROVE",
    "votes": {
      "legal": { "role": "legal", "vote": "APPROVE", "score": 100, "rejectReasons": [], "checklistResults": { ... } },
      "ethics": { "role": "ethics", "vote": "APPROVE", "score": 100, "rejectReasons": [], "checklistResults": { ... } },
      "business": { "role": "business", "vote": "REJECT", "score": 75, "rejectReasons": ["전문성(소재·배송·팁 등 정보성 콘텐츠)"], "checklistResults": { ... } }
    },
    "rejectReasonsByRole": { "legal": [], "ethics": [], "business": ["..."] },
    "rejectReasonsEsByRole": { "legal": [], "ethics": [], "business": ["..."] },
    "fatalBy": null,
    "checkedAt": "2025-02-26T12:00:00.000Z"
  }
}
```

- **decision**: "APPROVE" | "REVISE" | "DISCARD"
- **fatalBy**: "legal" | "ethics" | "business" | null — 치명적 결함을 표시한 위원.
- **REVISE/DISCARD** 시 발행은 하지 않고, `error` 에 "compliance_revised" 또는 "compliance_discarded" 가 들어갑니다.

---

## 5. 관련 코드

- `backend/src/services/contentAutomation/complianceOverseerService.ts`  
  - `CHECK_IDS_BY_ROLE`, `runComplianceCheckForRole()`, `runOversightBoard()`
- `backend/src/services/contentAutomation/types.ts`  
  - `CommitteeRole`, `CommitteeMemberVote`, `OversightBoardResult`, `OversightDecision`
- `backend/src/services/contentAutomation/contentAutomationService.ts`  
  - `useOversightBoard` 설정 분기, 발행 직전 위원회 호출
- `docs/AI_GOVERNANCE_POLICY.md` — 4대 거버넌스 룰

---

문서 버전: 2025.
