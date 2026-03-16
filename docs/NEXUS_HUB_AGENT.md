# Nexus AI 허브 에이전트 기획

Nexus는 **Lumi AI(리더)**와 감독 위원회·데이터 에이전트·실행(WhatsApp 등) 사이에서 **업무 우선순위·경로·스케줄**을 결정하는 중앙 오케스트레이터입니다. yuaimarketing(nexus-ai)을 베이스로 하며, 자체 워크플로우 엔진으로 외부 툴 의존도를 낮추고 AI가 비즈니스를 최적화하는 구조를 목표로 합니다.

**관련 문서**: [B2B_AGENTIC_PLAN.md](./B2B_AGENTIC_PLAN.md), [B2B_LEADS_AND_MESSAGING.md](./B2B_LEADS_AND_MESSAGING.md), [B2B_GLOBAL_SOURCING_GUIDE.md](./B2B_GLOBAL_SOURCING_GUIDE.md).

---

## 1. 역할·위치

| 항목 | 내용 |
|------|------|
| **명칭** | Nexus (The Nexus) |
| **역할** | 데이터를 단순 전달하는 통로가 아니라, **우선순위 결정·최적 경로 선택**을 하는 "중앙 신경계". |
| **베이스** | yuaimarketing(nexus-ai). Nexus는 그 위에 올라가는 **허브 레이어**. |

**핵심 기능**

- **에이전트 오케스트레이션**: 한국/일본/인도 소싱 데이터를 **어떤 감독관에게 먼저 보낼지** 결정.
- **동적 리소스 할당**: API 비용·시간 효율을 고려해 **즉시 처리** vs **예약 처리** 분류.
- **데이터 표준화**: 국가별 통화·규격·언어를 yuaimarketing 표준(USD, 표준 필드, locale)으로 정규화 후 저장.
- **자가 복구**: WhatsApp 등 연동 오류 시 **재시도·대체 경로** 또는 큐 보존 후 다음 발송 구간에 재시도.

---

## 2. 아키텍처 (3레이어)

| 레이어 | 역할 | nexus-ai와의 관계 |
|--------|------|-------------------|
| **Layer 1: Input Gateway** | BuyKorea, J-GoodTech, IndiaMART 등 원시 데이터 수신, **신선도·유효성** 1차 검증. | Nexus가 구독하는 소싱 어댑터 또는 데이터 에이전트 출력. |
| **Layer 2: Logic Hub** | Lumi 전략 반영(예: "DO 에너지 주간 → 태양광 우선"). **우선순위 P** 계산, Emergency/Daily/Nurturing 분류. 어느 감독관·어떤 순서로 보낼지 결정. | `POST /b2b/partners/verify` 등 **기존 API를 Nexus가 조율**해 호출. 필요 시 `POST /nexus/priority` 등 라우팅 전용 API. |
| **Layer 3: Execution Engine** | 감독 승인 후 WhatsApp/이메일 발송. **Golden Window 스케줄링**. 실패 시 재시도·대체 경로. | nexus-ai는 메시지 생성·검수. **발송 시점·대상 목록**은 Nexus가 결정. Nexus가 WhatsApp Cloud API 또는 발송 서비스 연동. |

---

## 3. 우선순위 알고리즘 (P 점수)

Nexus는 모든 소싱·바이어 리드를 분석해 **"지금 어떤 에이전트를 가동할지"** 결정합니다.

**우선순위 점수 P**

$$P = (M \times 0.4) + (S \times 0.3) + (R \times 0.2) + (T \times 0.1)$$

| 변수 | 의미 |
|------|------|
| **M** (Margin) | 수익성. 마진율이 높을수록 가산. |
| **S** (Strategic Value) | 전략적 가치. 태양광 패널, 일본 정밀 부품 등 타겟 품목 가산. |
| **R** (Response Rate) | 과거 바이어 반응률. 관심도 높았던 업체 관련 데이터 우선. |
| **T** (Timeliness) | 시급성. 한정 수량 오퍼·견적 유효기간 임박 시 가산. |

**구간별 행동 지침**

| P 구간 | 분류 | Nexus 행동 |
|--------|------|------------|
| **P ≥ 85** | Emergency | 즉시 감독 위원회 소집, 통과 시 5분 내 WhatsApp 발송. |
| **70 ≤ P < 85** | Daily Batch | 당일 업무 시간(AST 09:00 등)에 맞춰 통합 보고·발송. |
| **P < 70** | Nurturing | DB에만 저장, 주간 트렌드 리포트 생성용으로 분류. |

가중치(0.4, 0.3, 0.2, 0.1)는 **설정/DB**로 두어 전략에 따라 조정 가능하게 하는 것을 권장합니다.

---

## 4. 지능형 발송 스케줄링

도미니카 바이어의 **답장률이 높은 시간대**에 맞춰 메시지를 예약 발송합니다.

| 항목 | 내용 |
|------|------|
| **현지 시간** | AST(도미니카) 기준. |
| **Golden Window 1** | 09:30–11:00 — 신규 오퍼 확인 시간. |
| **Golden Window 2** | 14:30–16:00 — 오전 업무 정리 후 검토 시간. |
| **지연 발송(Queuing)** | 새벽 2시에 승인이 나도 즉시 보내지 않고, **가장 가까운 Golden Window**까지 대기 후 발송. |

Nexus는 **발송 지연 사유**를 로그에 남겨 ISO 42001 "AI 의사결정 투명성"을 충족합니다.  
예: *"바이어의 업무 흐름을 방해하지 않기 위해 새벽 시간대 제안을 지연시키고 09:30 AM에 발송을 예약함. (Reason: User Experience & Professionalism)"*

---

## 5. Nexus–Airtable 직접 연동 (No-Make.com 전략)

Make.com을 거치지 않고 **Nexus(Python/Node)에서 Airtable API**를 직접 호출합니다.

**기대 효과**

- **데이터 주권**: 외부 자동화 플랫폼 서버를 거치지 않아 비즈니스 보안 강화.
- **비용**: Make.com Operations 비용 최소화. AI API 사용료만 발생.
- **유연성**: P 가중치·Golden Window 등 **알고리즘만 조절**하면 영업 전략이 즉시 반영.

**연동 흐름**

1. 데이터 입수: 한국/일본/인도 에이전트가 데이터 수집 → Nexus가 P 계산.
2. 위원회 소집: P가 높은 건에 대해 yuaimarketing `POST /b2b/partners/verify` 등 감독 API 호출.
3. DB 업데이트: 검수 결과(점수, 반려 사유)를 Airtable API로 실시간 기록.
4. 실행 지시: 승인된 건만 Nexus가 Golden Window에 맞춰 WhatsApp Cloud API 등으로 발송.

---

## 6. Nexus 로그·ISO 42001

Nexus는 다음을 **중앙 집중 로그**로 남깁니다.

| 항목 | 내용 |
|------|------|
| **우선순위** | 각 건의 P, M/S/R/T, 구간(Emergency/Daily/Nurturing). |
| **스케줄링** | 발송 예약 시각, Golden Window 선택 근거, 지연 사유. |
| **실행** | 발송 시도·성공/실패·재시도·대체 경로. |

모든 에이전트 활동이 Nexus를 거치므로 **ISO 42001 감사 로그** 생성이 용이합니다.

---

## 7. 구현 단계 제안

| Phase | 내용 |
|-------|------|
| **1** | P 공식·구간 정의. Nexus(또는 nexus-ai 모듈)에서 **우선순위 점수만** 계산하는 API/함수. 입력: 마진, 품목/국가(S), 반응 이력(R), 시급성(T). 출력: P, 구간, 권고(즉시/배치/육성). |
| **2** | Nexus–Airtable 직접 연동. 소싱 테이블·바이어 테이블·감독 결과 쓰기. "새 행 → P 계산 → 구간 분류 → 감독 API 호출" 파이프라인. |
| **3** | AST Golden Window + 큐. 승인 건을 즉시가 아니면 다음 Golden Window까지 대기 후 발송하는 스케줄러. |
| **4** | 발송 실패 시 재시도·대체 경로(자가 복구). Nexus 로그 스키마 고정 및 ISO 42001 대응 출력. |
| **5** | B2B 매칭 리포트 자동 생성(상위 N건, 권고, 타임스탬프). 텔레그램/대시보드 전달. Airtable Interface(heatmap, funnel, margin bubble) 연동. |

---

## 8. 개선 아이디어

- **P 가중치 설정화**: M, S, R, T 가중치를 DB/설정으로 두고, "태양광 집중 주간" 등에 S 상향.
- **전략 규칙 엔진**: "도미니카 에너지 주간" 같은 이벤트를 설정으로 넣어, 해당 기간 특정 품목·국가 가산.
- **R 데이터 축적**: 바이어별 열람·답장·성사 이벤트를 nexus-ai 또는 Airtable에 쌓아 Response Rate 학습.
- **저장소 이원화**: Nexus 상태/큐/로그를 선택적으로 nexus-ai 백엔드(DB)에도 저장해 API로 우선순위·스케줄·리포트 조회.

---

## 9. 문서 참고

| 문서 | 용도 |
|------|------|
| [B2B_AGENTIC_PLAN.md](./B2B_AGENTIC_PLAN.md) | 에이전틱 플로우·Phase별 기획. |
| [B2B_LEADS_AND_MESSAGING.md](./B2B_LEADS_AND_MESSAGING.md) | 메시지·리드·파트너 검증 API. |
| [B2B_GLOBAL_SOURCING_GUIDE.md](./B2B_GLOBAL_SOURCING_GUIDE.md) | 한국/일본/인도 소스·China Plus One. |

Nexus는 yuaimarketing의 **자체 워크플로우 제어 허브**로, 위 문서들과 함께 단계적으로 구축하면 됩니다.
