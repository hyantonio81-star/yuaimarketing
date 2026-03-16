# yuaimarketing B2B 수익 자동화 기획서 (에이전틱 플로우)

중남미(도미니카·파나마) B2B 리드 생성 → 파트너 검증 → 제안서 발송 → 커미션/구독 수익까지 **에이전틱 플로우**로 자동화하기 위한 단계별 기획.  
**원칙**: 「AI 감독 위원회 다수결 승인 없이는 발송하지 않는다.」

---

## 1. 개요

| 항목 | 내용 |
|------|------|
| **목표** | DO·PA 중심 B2B 리드 매칭 수수료 → 거래 커미션 → 구독 수익 단계적 수익화 |
| **베이스 시스템** | **yuaimarketing(nexus-ai)** — 검증·메시지·리드·파트너 검수·LATAM 품목 등 핵심 API 제공. |
| **선택적 연동** | 외부 자동화(예: Make.com, Zapier, n8n)가 시트 감지·WhatsApp 발송·알림 등을 할 때 yuaimarketing API를 호출. |
| **참고 문서** | [B2B_LEADS_AND_MESSAGING.md](./B2B_LEADS_AND_MESSAGING.md) — API 스펙 전체. [B2B_WHATSAPP_AND_FIELD_PLAYBOOK.md](./B2B_WHATSAPP_AND_FIELD_PLAYBOOK.md) — 실전 발송·미팅·PDF·운영 가이드. [B2B_PAYMENT_AND_COMPLIANCE_GUIDE.md](./B2B_PAYMENT_AND_COMPLIANCE_GUIDE.md) — Payoneer·Escrow·결제 정산·서류 검수. [B2B_GLOBAL_SOURCING_GUIDE.md](./B2B_GLOBAL_SOURCING_GUIDE.md) — 글로벌 소싱·China Plus One 소스·연동. [NEXUS_HUB_AGENT.md](./NEXUS_HUB_AGENT.md) — Nexus AI 허브 에이전트(우선순위·스케줄·오케스트레이션). |

---

## 2. 시스템 구성도 (3레이어)

| 레이어 | 담당 | 산출물 |
|--------|------|--------|
| **데이터 수집** | 데이터 에이전트 | Google 시트 행(업체명, RNC, 연락처, 품목 등) |
| **검증** | AI 감독 위원회(3인) | 점수, APPROVED/REJECTED, 반려 사유 |
| **실행** | Lumi AI 리더 | 제안서 발송 지시, 리마케팅/블랙리스트 분류, 알림 |

nexus-ai(yuaimarketing 백엔드)가 **검증·메시지 생성/검수·리드·파트너 검증** 레이어를 담당한다. 시트 감지·WhatsApp 발송·시트 갱신이 필요할 때는 **외부 자동화**(예: Make.com, Zapier, n8n)가 yuaimarketing API를 호출하는 구조로 연동한다.

---

## 3. 단계별 기획

### Phase 1: 도미니카 태양광/에너지 B2B 리드 (현재)

**목표**  
- DO 내 태양광·에너지 업체 타겟, 리드당 수수료 $50~$200 또는 연결 건당 $100+.

**데이터**  
- 잠재 파트너 샘플: 도미니카 현지 태양광/에너지 수입·유통 업체(업체명, RNC, 담당자, 연락처, 품목).  
- 저장: Google 시트(컬럼: 업체명, 담당자, 연락처, 품목, RNC 등).

**기술**  
- **데이터 수집**: Python 스크립트로 업종별 업체·RNC·평판 데이터 수집 후 시트 입력. 또는 수동/반자동 입력 후, 외부 자동화(예: 시트 Watch)로 yuaimarketing 호출 시작.
- **검증**: yuaimarketing `POST /b2b/partners/verify` 호출(partner_id, country_code, registration_id(RNC), lead_id 등). 응답: decision, overall_score, by_role(legal/business/ethics). **80점 이상·APPROVED일 때만 발송 허용.**
- **발송 게이트**: `GET /b2b/leads/:id/verification-status` 또는 `GET /b2b/partners/:id/verification-status`로 `approved === true` 확인 후에만 WhatsApp 등 발송. (호출 주체: yuaimarketing 연동 클라이언트 또는 외부 자동화.)
- **메시지 생성**: yuaimarketing `POST /b2b/proposal`로 제목·본문(푸터 포함) 생성. `POST /b2b/validate-message`로 콘텐츠 감독(BAJA 등) 검수.

**외부 자동화 연동 예시(선택)**  
시트·WhatsApp을 쓰는 경우, 예를 들어 Make.com/Zapier/n8n에서:  
1. Trigger: Google Sheets 「Watch Rows」 — 신규 행 추가 감지.  
2. HTTP: yuaimarketing `POST /b2b/partners/verify` — RNC·업체 정보 전달.  
3. Router: overall_score ≥ 80 && decision === "APPROVED" → Path A, 아니면 Path B.  
4. Path A: WhatsApp Business Cloud API — 템플릿 발송, 변수는 yuaimarketing `POST /b2b/proposal` 응답 활용.  
5. Path B: Google Sheets Update — Status = REMARKETING 또는 BLACKLIST, Reason = 반려 사유.  
6. (선택) Telegram/Email: 「오늘 N건 발송, M건 반려」 요약.

**산출물**  
- yuaimarketing API를 호출하는 외부 자동화 시나리오 1개(Trigger → 검증 API → Router → WhatsApp / 시트 업데이트). (도구는 Make.com, Zapier, n8n 등 자유 선택.)
- Google 시트 「AI 감독 위원회 검토 양식」(A~G열: 업체 정보, Legal/Business/Ethics 점수, 총점, APPROVED/REJECTED).

---

### Phase 2: WhatsApp 템플릿 및 발송 플로우

**목표**  
- Meta 승인 가능한 스페인어 템플릿 확정.  
- yuaimarketing 검증·제안서 API를 기준으로, 필요 시 외부 자동화에서 검증 → 발송 플로우 구현.

**WhatsApp 템플릿 (승인용)**  
- **이름**: `b2b_partnership_proposal_v1`  
- **카테고리**: Marketing  
- **언어**: Spanish  
- **Body**:  
  `Hola, {{1}}. Le saludamos de yuaimarketing. Hemos analizado el mercado de {{2}} en República Dominicana y vemos una gran oportunidad para su empresa, {{3}}. Nuestro sistema de IA ha seleccionado a su empresa como socio estratégico para una alianza de suministro directo con certificación ISO 42001. Podemos ayudarle a optimizar sus costos de importación en un 15-20%. ¿Le gustaría recibir nuestra propuesta detallada en PDF? Saludos, Lumi AI - Director de Operaciones`  
  (BAJA 푸터는 API `POST /b2b/prepare-message`로 붙인 본문과 일치시키기.)  
- **버튼**: Quick Reply 「Sí, enviar PDF」, 「Más información」.

**외부 자동화 모듈 예시(선택)**  
yuaimarketing API를 호출하는 쪽(예: Make.com, Zapier, n8n)에서: Google Sheets Watch → HTTP(yuaimarketing `POST /b2b/partners/verify`, `GET /b2b/partners/:id/verification-status`) → Router → Path A: WhatsApp 발송(템플릿 변수는 `POST /b2b/proposal` 응답 활용), Path B: 시트 Update. (선택) Telegram/Email 알림.

**산출물**  
- Meta에 제출할 템플릿 문구 최종본(문서 1페이지).  
- yuaimarketing API + 외부 자동화(선택) 시나리오 정리 문서.

---

### Phase 3: REJECTED 리마케팅 및 블랙리스트

**목표**  
- 반려된 업체를 자산으로 활용: 육성·모니터링·재검토.

**전략 A — 육성(Nurturing)**  
- **대상**: 법적 문제 없음, 점수 낮음(규모/온라인 활동 부족).  
- **조치**: B2B 제안 대신 「중남미 무역 트렌드 리포트」 등 유익 콘텐츠를 2주 간격 이메일/WhatsApp.  
- **기술**: 외부 자동화(예: Make.com) Path B에서 Status=REMARKETING 인 행만 필터링한 별도 시나리오 또는 메일칩 연동. 또는 yuaimarketing API만으로 리스트 조회 후 별도 발송.

**전략 B — 리스크 모니터링(블랙리스트)**  
- **대상**: 서류 불일치·사기 의심.  
- **조치**: RNC·도메인 블랙리스트 등록, 다른 에이전트가 재접근하지 않도록 차단.  
- **기술**: yuaimarketing 백엔드에 블랙리스트 API(등록/조회) 추가하거나, Google 시트 「Blacklist」 시트에 기록 후 외부 자동화/API에서 조회.

**전략 C — 조건부 재검토**  
- **대상**: 일시적 세금 미납·평판 저하.  
- **조치**: 3개월 후 재검토, 개선 시 APPROVED로 전환.  
- **기술**: 외부 자동화 Schedule + 「재검토 대상」 시트 또는 yuaimarketing 백엔드 `POST /b2b/partners/verify` 재호출.

**산출물**  
- 리마케팅용 콘텐츠 1종(트렌드 리포트 또는 팁).  
- 블랙리스트 저장소(시트 또는 yuaimarketing API) 정의 및 연동 방법 1페이지.

---

### Phase 4: 에스크로·결제·커미션 (성장 단계)

**목표**  
- 거래 성사 시 커미션(예: 5~8%) 안전 정산.

**안전 정산 전략**  
- **해외 대규모**: Escrow.com / Payoneer — 바이어 입금 → 에스크로 보류 → 배송 확인 → 공급자+커미션 분리 입금.  
- **현지 소규모**: Azul / PlacetoPay — DOP 결제, 세금 계산서 대응.  
- **커미션 계약**: 성사 전 「거래액의 X% 마케팅 수수료」 디지털 계약(DocuSign 등) 자동화.

**기술**  
- nexus-ai는 리드 이전(`POST /b2b/leads/:id/transfer`에 supplier_id, fee 기록)까지 담당.  
- 실제 결제·에스크로는 외부 서비스 연동 기획으로만 정의(API 연동은 별도 단계).

**산출물**  
- 에스크로/결제 서비스 선정 및 「언제 어떤 서비스를 쓸지」 1페이지.  
- 커미션율·계약 프로세스 정리(문서).

---

### Phase 5: 파나마·확장 및 구독 (성숙 단계)

**목표**  
- 파나마 ZLC 도매상 연계, 중남미 타국 재수출 중개(거래액 5% 등).  
- 「중남미 무역 보증 서비스」 브랜드로 월 구독료 수익.

**기술**  
- 동일 검증·발송 플로우를 PA(및 다른 국가)에 복제.  
- `GET /b2b/latam-products?country=PA`, `POST /b2b/hot-leads`(destination=PA) 등 기존 API 활용.  
- 구독 플랜·결제는 별도 제품 기획.

**산출물**  
- 국가별 복제 체크리스트(DO → PA → CO 등).  
- 구독 상품 초안(가격·포함 내용).

---

## 4. AI 감독 위원회 역할 정리

| 감독관 | 소스(목표) | 체크 항목 |
|--------|------------|-----------|
| **Legal** | ONAPI, DGII, 블랙리스트 DB | RNC 유효성, Active 상태, 법적 분쟁 여부 |
| **Business** | LinkedIn, 구글 리뷰, Paginas Amarillas | 운영 기간, 직원 규모, 웹사이트 활성 |
| **Ethics** | 현지 뉴스, Foros RD, 소셜 감성 | 노동법·환경 이슈, 평판 리스크 |

현재 구현: `b2bPartnerVerificationService`가 3역할·점수·decision(APPROVED/REJECTED/PENDING)을 반환(목 구현). ONAPI/DGII/블랙리스트/스크래핑 등은 외부 API·스크립트 연동으로 단계적 도입.

---

## 5. Google 시트 「AI 감독 위원회 검토 양식」 (권장 컬럼)

| 열 | 용도 |
|----|------|
| A | 업체명 |
| B | RNC / 담당자 / 연락처 / 품목 |
| C | Legal 점수(또는 Legal 결과 요약) |
| D | Business 점수(또는 결과 요약) |
| E | Ethics 점수(또는 결과 요약) |
| F | 총점 (또는 백엔드 overall_score) |
| G | 최종 판정: APPROVED / REMARKETING / BLACKLIST |
| H | 반려/분류 사유 (선택) |

yuaimarketing이 제공하는 API를 호출하는 쪽에서: 시트 「Watch Rows」로 신규 행 감지 → HTTP로 `POST /b2b/partners/verify` 호출 → 응답으로 C,D,E,F 채우고, F≥80이면 G=APPROVED.  
G열 Watch: G=APPROVED일 때만 WhatsApp 발송. (호출 주체: yuaimarketing 연동 클라이언트 또는 외부 자동화.)

---

## 6. nexus-ai 백엔드 API 매핑 (실무 연결)

| 용도 | 메서드 | 경로 |
|------|--------|------|
| 파트너 검증 실행 | POST | `/b2b/partners/verify` |
| 파트너 검증 상태 | GET | `/b2b/partners/:id/verification-status` |
| 리드별 검증 상태 | GET | `/b2b/leads/:id/verification-status` |
| 제안서 본문·제목 생성 | POST | `/b2b/proposal` |
| 메시지 푸터 부착 | POST | `/b2b/prepare-message` |
| 메시지 감독관 검수 | POST | `/b2b/validate-message` |
| 중남미 타겟 품목 | GET | `/b2b/latam-products` |
| Hot Lead 후보/생성 | GET/POST | `/b2b/hot-leads/candidates`, `/b2b/hot-leads` |
| 리드 CRUD·이전 | GET/POST | `/b2b/leads`, `/b2b/leads/:id/transfer` |

상세 스펙은 [B2B_LEADS_AND_MESSAGING.md](./B2B_LEADS_AND_MESSAGING.md) 참고.

---

## 7. 기대 수익·KPI (요약)

| 단계 | 수익 형태 | KPI 예시 |
|------|------------|-----------|
| Phase 1 | 리드/연결 수수료 $50~200 | 발송 건수, 응답률 |
| Phase 2 | 거래 커미션 5~8% | 성사 건수, 거래액 |
| Phase 3 | 리마케팅 전환 | REMARKETING → APPROVED 전환율 |
| Phase 5 | 구독료 | 유료 구독자 수, LTV |

---

## 8. 에이전틱 팀 워크플로우 (최종)

1. **데이터 에이전트**: Python/수동으로 신규 B2B 리드 수집 → Google 시트 행 추가.  
2. **AI 감독 위원회**: `POST /b2b/partners/verify`로 3관점(법률·비즈니스·윤리) 채점.  
3. **Lumi AI 리더**:  
   - High Score(≥80, APPROVED) → WhatsApp 제안서 발송 지시.  
   - Low Score → 리마케팅 리스트(전략 A)로 분류.  
   - Critical Fail → 블랙리스트(전략 B) 등록.  
4. **피드백 루프**: 답변율·성사율 분석 후 데이터 에이전트에 「다음에는 이런 특징 업체를 더 찾아와」 피드백.

이 기획서를 Phase별로 실행하면 Gemini가 제안한 플로우와 현재 nexus-ai 코드베이스가 연결된 상태로 가동할 수 있다.
