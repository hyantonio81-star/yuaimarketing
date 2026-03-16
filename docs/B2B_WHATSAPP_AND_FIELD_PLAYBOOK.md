# yuaimarketing B2B 실전 발송·미팅·운영 플레이북

도미니카 공화국 현지 비즈니스 문화(**정중함·신뢰**)를 반영한 WhatsApp 메시지 템플릿, 발송 전 체크리스트, PDF 제안서 구성, 미팅 스크립트, yuaimarketing API 연동 및 운영자 가이드를 정리합니다.

**관련 문서**: [B2B_AGENTIC_PLAN.md](./B2B_AGENTIC_PLAN.md) (에이전틱 플로우), [B2B_LEADS_AND_MESSAGING.md](./B2B_LEADS_AND_MESSAGING.md) (API 스펙), [B2B_PAYMENT_AND_COMPLIANCE_GUIDE.md](./B2B_PAYMENT_AND_COMPLIANCE_GUIDE.md) (결제·Payoneer·Escrow·서류 검수).

---

## 1. 원칙: 도미니카 비즈니스 문화 반영

| 원칙 | 설명 |
|------|------|
| **정중함 (Cortesía)** | 첫 인사·문구는 공격적 영업보다 정중한 톤 우선. |
| **신뢰 (Confianza)** | AI·ISO 42001·현지 이점($200 면세)을 결합해 전문성과 실리를 제시. |
| **호기심 유발** | 과한 판매보다 "어떻게 도울 수 있는가"로 호기심을 자극. |

**발송 조건**: 3인 AI 감독 위원회 승인 후에만 발송.

---

## 2. 실전 WhatsApp 템플릿 2종

### 2.1 [B2B 전용] 대형 유통/도매 (태양광·전자·가전)

**Asunto**: Propuesta de Alianza de Suministro Inteligente

**변수**: `[품목명]` (예: Energía Solar), `[업체명]`

**본문**:

```
¡Hola! Un gusto saludarle. Le escribo de parte de yuaimarketing, somos una plataforma de gestión de suministros con certificación ISO 42001 (IA Responsable).

Hemos analizado el sector de [품목명: Ej. Energía Solar] en RD y vemos que su empresa, [업체명], tiene un gran potencial para optimizar sus costos de importación.

¿Cómo podemos ayudarle?
✅ Conexión directa con proveedores verificados por nuestra IA.
✅ Reducción de costos operativos en un 15-20%.
✅ Asesoría en exención de impuestos para partidas específicas.

¿Le gustaría recibir nuestro catálogo de soluciones en PDF o coordinar una breve llamada de 5 minutos?

Quedo a su disposición.
Lumi AI - Director de Operaciones
```

- **톤**: Usted(당신) 존칭, 전문·정중.
- **API 연동**: `POST /b2b/proposal` — `product_name`, `country_name`, `sector_name`, `partner_name` 매핑 후 `body_prepared` 사용. 발송 전 `POST /b2b/validate-message`로 검수.

---

### 2.2 [소규모] 소상공인/리테일/공동구매

**Asunto**: Oportunidad de Inventario con Exención de Impuestos

**변수**: `[업체명]`, `[품목명]` (예: Accesorios Tech)

**본문**:

```
¡Qué lo qué! Saludos de yuaimarketing. 👋

Sabemos que para [업체명] es vital mantener buenos precios. Nuestro sistema de IA ha detectado ofertas exclusivas en [품목명: Ej. Accesorios Tech] que llegan directo a su courier en Miami.

Lo mejor para su negocio:
📦 Compras menores a US$200 libres de impuestos de aduana.
🤖 Productos curados y verificados por nuestro equipo de IA.
🚀 Maximice su margen de beneficio este mes.

¿Le interesa ver la lista de productos recomendados para su tienda hoy?

Lumi AI - Su Socio Estratégico
```

- **톤**: "¡Qué lo qué!" 등 친근한 표현, $200 면세 명시.
- **수신 거부**: 메시지 하단 또는 자동 응답에 "No deseo recibir más info" / BAJA 푸터(`POST /b2b/prepare-message`) 준비.

---

## 3. 발송 전 AI 감독 위원회 체크리스트 (Internal)

메시지 발송 버튼이 눌리기 전, 시스템에서 자동 검수할 항목입니다.

| 항목 | 내용 |
|------|------|
| **언어 필터** | Usted(정중) vs Qué lo qué(친근)가 **업종·타겟**에 맞게 사용되었는지. |
| **데이터 검증** | 업체명·품목명이 구글 시트 데이터와 **100% 일치** (오타 방지). |
| **수신 거부** | 하단 또는 자동 응답에 "No deseo recibir más info" / BAJA 안내 존재. |

- yuaimarketing: `POST /b2b/validate-message`(privacy_optout, false_urgency 등) + 외부 자동화 또는 내부 룰로 위 3항 결합.

---

## 4. 답장 후 수익화 시나리오

| 단계 | 내용 |
|------|------|
| **1차** | 미리 정의한 FAQ(배송비·커미션·결제 방법)로 실시간 상담. |
| **수익 확정** | 상담이 깊어지면 Escrow.com 결제 링크 발행 또는 유료 리포트 제안으로 첫 매출. |
| **측정** | PDF 클릭 수·상담 요청 건수를 비즈니스 감독관이 집계·리포트. |

---

## 5. 도미니카 B2B 타겟 업체 리스트 (샘플 10선)

- 에너지·IT·유통, 규모·수입 의존도 높은 현지 기업 **10곳**을 샘플 리스트로 확보.
- **시트 컬럼 예시**: 업체명, 담당자, 연락처, 품목, RNC, 소스(에너지/IT/유통).
- 이 리스트를 **구글 시트 1행 = 1업체**로 넣고, AI 감독 위원회 1차 필터(`POST /b2b/partners/verify`) 후 APPROVED만 발송 대상으로 사용.

---

## 6. B2B PDF 제안서 구성안 (목차)

**Título**: Soluciones de Suministro Inteligente para [업체명]

| 페이지 | 섹션 | 내용 |
|--------|------|------|
| 1 | **Introducción** | yuaimarketing 비전, "AI를 통한 글로벌 공급망 민주화", ISO 42001 강조. |
| 2 | **El Problema** | 불투명한 공급망, 통관 비용, 품질 검증 어려움. |
| 3 | **Nuestra Solución** | AI Oversight Board 3인 검증, 마이애미–DO 직배·$200 면세 전략. |
| 4 | **Categorías de Productos** | 태양광·IT·산업재 등 시세·공급 가능 수량. |
| 5 | **Modelos de Negocio** | Dropshipping B2B, 대량 구매 시 최대 20% 할인. |
| 6 | **Próximos Pasos** | 무료 컨설팅 신청 QR, WhatsApp 바로 연결 버튼. |

- "Sí, enviar PDF" 답장 시 Lumi AI가 **구글 드라이브 PDF 링크** 자동 전송하도록, yuaimarketing 연동 클라이언트 또는 외부 자동화(예: Make.com) 시나리오에 연결.

---

## 7. 구글 시트·외부 자동화 연동 가이드

| 단계 | 내용 |
|------|------|
| **시트** | 샘플 10선 + 추가 업체를 시트에 입력(업체명, 담당자, 연락처, 품목, RNC, 상태 등). |
| **PDF** | 위 목차로 Canva 등에서 스페인어 PDF 제작 → 구글 드라이브 업로드 → 링크 확보. |
| **외부 자동화**(예: Make.com) | ① 시트에서 상태가 **APPROVED**로 바뀌면 yuaimarketing API로 검증 확인 후 WhatsApp 발송. ② "PDF 보내줘" 등 키워드 답장 시 PDF 링크 자동 전송. ③ PDF 클릭·상담 요청 수 집계(시트 또는 별도 툴). |

---

## 8. yuaimarketing API ↔ 감독 위원회 데이터 (Blueprint 기초)

Lumi AI(리더)와 AI 감독 위원회가 주고받는 **공통 스키마** 예시.

**요청(검증)**  
- `partner_id`, `organization_name`, `country_code`, `registration_id`(RNC), `lead_id`.

**응답(검증 결과)**  
- `decision`, `overall_score`, `by_role`(legal/business/ethics), `verified_at`.

**메시지 생성**  
- `product_name`, `sector_name`, `partner_name`, `country_name` → `POST /b2b/proposal` → `subject`, `body_prepared`.

외부 자동화(예: Make.com)의 HTTP Request·JSON Parser는 위 필드로 yuaimarketing(nexus-ai) API와 매핑. 상세 스펙은 [B2B_LEADS_AND_MESSAGING.md](./B2B_LEADS_AND_MESSAGING.md) 참고.

---

## 9. 도미니카 현지 미팅용 스페인어 스크립트

WhatsApp 제안 후 실제 미팅(Zoom 또는 현지 방문) 시 사용할 가이드라인입니다.

| 단계 | 스페인어 | 한글 |
|------|----------|------|
| **인사 (Saludos)** | Mucho gusto, es un placer saludarle personalmente. Soy [성함] de yuaimarketing. | 만나서 반갑습니다. 유아이마케팅의 [성함]입니다. |
| **가치 제안** | Nuestro objetivo es optimizar su cadena de suministro utilizando Inteligencia Artificial con estándares ISO 42001. | 저희 목표는 ISO 42001 표준의 AI를 활용해 귀사의 공급망을 최적화하는 것입니다. |
| **이점** | Podemos facilitar importaciones directas desde Miami, aprovechando la exención de impuestos para pedidos menores de US$200, maximizando su margen de beneficio. | 마이애미 직수입을 지원하며, 200달러 미만 면세 혜택을 활용해 귀사의 마진을 극대화할 수 있습니다. |
| **마무리** | ¿Le gustaría que hiciéramos una prueba piloto con un pedido pequeño para que vea nuestra eficiencia? | 저희의 효율성을 확인하실 수 있도록 소량 주문으로 시범 운영을 해보시는 건 어떨까요? |

---

## 10. AI 감독 위원회 실시간 미팅 지원

미팅 중 상대방 질문에 대비해 대시보드에 띄울 수 있는 데이터 예시입니다.

| 유형 | 예시 |
|------|------|
| **상대 업체** | "이 업체는 지난달 태양광 인버터를 20% 더 많이 수입했습니다. 재고 부족을 공략하세요." |
| **경쟁** | "경쟁사 A는 현재 배송 지연 문제가 있습니다. 우리의 '빠른 물류'를 강조하세요." |
| **법적** | "관세 관련 질문이 나오면 도미니카 세관(DGA)의 특정 조항을 인용하도록 준비했습니다." |

→ 데이터 소스(UN Comtrade, 현지 뉴스 등)와 nexus-ai/외부 API 연동은 별도 단계로 설계.

---

## 11. 운영자 최종 가이드

| 항목 | 권장 |
|------|------|
| **확장** | DO 검증 후 외부 자동화(예: Make.com) 시나리오에서 **국가 코드만 변경**해 PA·MX 등으로 복제. |
| **수익** | B2C 제휴 = 생활비, B2B 커미션 = 사업 확장 자금으로 포트폴리오 구성. |
| **관리** | AI 위원회 결정을 신뢰하되, **매주 1회** 운영자가 전략 방향만 점검. |
| **일일** | "AI 감독 위원회" 검증 결과를 **매일 아침 보고서**로 받는 것부터 시작. |

---

## 12. 문서·API 참고

| 문서 | 용도 |
|------|------|
| [B2B_AGENTIC_PLAN.md](./B2B_AGENTIC_PLAN.md) | 에이전틱 플로우·Phase별 기획. |
| [B2B_LEADS_AND_MESSAGING.md](./B2B_LEADS_AND_MESSAGING.md) | 메시지·리드·파트너 검증·LATAM 품목 API 스펙. |
| [B2B_PAYMENT_AND_COMPLIANCE_GUIDE.md](./B2B_PAYMENT_AND_COMPLIANCE_GUIDE.md) | Payoneer·Escrow·결제 정산·서류 검수. |

이 플레이북을 기준으로 실전 발송·미팅·PDF 연동을 구성하면 됩니다.
