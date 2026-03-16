# AI 거버넌스 정책 (ISO/IEC 42001 기반)

yuaimarketing 시스템의 AI 자율 활동에 적용하는 베이스 룰러와 질서 정의입니다.

## 1. 적용 표준 및 원칙

- **ISO/IEC 42001**: AI 경영시스템 — 책임 있는 개발·운영
- **적용 범위**: 콘텐츠 자동화(B2C 제휴), B2B 무역·매칭·메시징, 시장 인텔

## 2. 4대 거버넌스 룰

### 2.1 위험 관리 (Risk Management)

- AI 생성물(스페인어 문구, 무역 정보, 추천)이 현지 정서·규제·사실과 충돌할 가능성을 **사전 평가·기록**한다.
- 구현: 콘텐츠/메시지 **발행 직전** 감독관 검수(`complianceOverseerService`) 실행, 결과를 구조화 로그(`ComplianceCheckResult`)로 보관.

### 2.2 투명성·설명 가능성 (Transparency)

- 상품 추천·업체 매칭·메시지 발송 **대상 선택 이유**를 로그로 남긴다.
- 구현: 파이프라인 결과에 `compliance.checklistResults`, `product` 등 근거 필드 포함; B2B 매칭 시 소스·기준 로그.

### 2.3 데이터 거버넌스 (Data Governance)

- 무역·B2B 연락처 수집 시 **출처 합법성** 확인; **편향성**(특정 국가·채널만 우대) 주기 점검.
- 구현: `marketIntelService` SOURCES 메타·수집 정책 문서 유지; 편향 점검은 별도 리포트/배치.

### 2.4 인적 개입 (Human-in-the-Loop)

- B2B 계약·대량 메시지 발송·고위험 콘텐츠는 **최종 승인**을 사람이 하도록 한다.
- 구현: 콘텐츠는 감독관 통과 후 자동 발행 가능; 대량 B2B 발송 시 `pending_approval` 및 승인 게이트 확장 예정.

## 3. 서비스별 준수 사항

### 3.1 B2C 제휴 마케팅

- **광고 표기**: 모든 포스팅 하단에 제휴/광고 포함 사실 명시.  
  문구: *"Este post contiene enlaces de afiliados. Si compras a través de estos enlaces podemos recibir una pequeña comisión sin costo adicional para ti."*
- **가격·긴급성**: 원본 상품 데이터만 사용, 허위 긴급성 문구 금지.
- **플랫폼 정책**: 각 쇼핑몰 API TOS 준수, 과도한 스크래핑 금지.

### 3.2 B2B 무역·공급망 매칭

- **기업 정보 보호**: 수집 연락처는 영업·매칭 목적만 사용, 제3자 판매·공유 금지.
- **국가별 개인정보**:  
  - 브라질 LGPD: 삭제 요청 시 24시간 내 처리.  
  - MX/CO: 수신 거부(Opt-out) 문구 필수 — 메시지 말미에 BAJA 안내.
- **무역 규정**: 도미니카 $200 미만 무관세 등 국가별 규정을 안내 문구에 반영.

### 3.3 소셜·메시징 (Threads, WhatsApp)

- **스팸 방지**: 발송 빈도·일일 상한 설정, 플랫폼 정책 준수.
- **언어 가드레일**: 현지 슬랭 허용, 비속어·혐오 표현 금지.

## 4. AI 감독관 9대 체크리스트

발행 직전 `complianceOverseerService.runComplianceCheck()` 가 검사하는 항목:

| ID | 항목 | 기준 |
|----|------|------|
| transparency | 투명성(광고/제휴 표기) | afiliado/publicidad 등 표기 포함 |
| customs_regulations | 무역 규정(DO $200 면세) | DO 타겟 시 $200·면세 관련 안내 포함 |
| language_guardrail | 언어 가드레일 | 비속어·혐오 표현 없음 |
| privacy_optout | 개인정보(수신 거부) | B2B 메시지 시 BAJA 등 탈퇴 문구 포함 |
| accuracy | 가격·정보 정확성 | productPrice 제공 시 본문 가격이 원본과 15% 이내 |
| copyright | 저작권 | (수동/별도 모듈 확장 시 사용) |
| ethics | 윤리적 영향 | (정성 평가 확장 시 사용) |
| expertise | 전문성 | 소재·배송·팁 등 정보성 콘텐츠 + DO/MX 현지 맥락 |
| false_urgency | 허위 긴급성·과장 금지 | "solo quedan X", "últimas unidades", "100% descuento" 등 패턴 없음 |

- **결과**: `approved: true` 일 때만 발행; `false` 시 `rejectReasons`/`rejectReasonsEs` 반환, 파이프라인은 발행 생략.
- **감독관 롤 상세**: `docs/COMPLIANCE_OVERSEER_ROLE.md` 참고.
- **AI 감독 위원회(3인)**: `docs/AI_OVERSIGHT_BOARD.md` 참고. 설정 `useOversightBoard: true` 시 위원회 사용.

## 5. 관련 코드

- `backend/src/services/contentAutomation/complianceOverseerService.ts` — 감독관 검수 로직
- `backend/src/services/contentAutomation/contentAutomationService.ts` — 파이프라인 내 검수 호출
- `backend/src/services/contentAutomation/types.ts` — `ContentComplianceInput`, `ComplianceCheckResult`

## 6. 문서 버전

- 최초 작성: 2025
- 정책 변경 시 본 문서와 체크리스트 버전을 함께 갱신합니다.
- **법적 문구**: `docs/LEGAL_DISCLOSURES.md` 참고.
