# 법적 고지·필수 문구 (Legal Disclosures)

yuaimarketing 서비스에 포함해야 할 법적 문구 초안입니다. 블로그 하단·서비스 안내·B2B 메시지 템플릿에 반영하세요.

---

## 1. B2C 제휴 마케팅 (애드센스/쇼핑)

**제목**: Descargo de Responsabilidad de Afiliados

**본문 (스페인어)**:
> Este sitio contiene enlaces de afiliados. Si realizas una compra, podríamos recibir una pequeña comisión sin costo adicional para ti. Solo recomendamos productos que consideramos de valor.

**본문 (영문)**:
> This site contains affiliate links. If you make a purchase, we may receive a small commission at no extra cost to you. We only recommend products we consider valuable.

**적용 위치**: 블로그 푸터, 개별 포스트 하단(또는 현재 사용 중인 affiliate disclaimer와 동일 목적).

---

## 2. B2B 무역·리드 수집 (LGPD/GDPR 준수)

**제목**: Política de Protección de Datos B2B (Cumplimiento LGPD/GDPR)

**본문 (스페인어)**:
> Tus datos son procesados exclusivamente para fines comerciales legítimos. Tienes derecho a solicitar la eliminación de tu información en cualquier momento respondiendo 'BAJA' a nuestros mensajes.

**본문 (영문)**:
> Your data is processed solely for legitimate business purposes. You have the right to request deletion of your information at any time by replying 'UNSUBSCRIBE' to our messages.

**적용 위치**: B2B 영업 메시지(WhatsApp, 이메일 등) 말미에 필수 포함. 삭제 요청(BAJA) 수신 시 24시간 내 처리 정책 적용.

---

## 3. B2B 메시지 수신 거부 문구 (Opt-out)

**스페인어 (메시지 끝에 추가)**:
> Para dejar de recibir estas ofertas, responde con la palabra 'BAJA'.

**포르투갈어 (브라질)**:
> Para deixar de receber estas ofertas, responda com a palavra 'BAIXA' ou 'BAJA'.

**코드 상수**: B2B 발송 시 아래 상수를 import 해 메시지 끝에 append.

- `B2B_OPT_OUT_FOOTER_ES` (스페인어): `backend/src/services/contentAutomation/complianceOverseerService.ts` export
- `B2B_OPT_OUT_FOOTER_PT` (포르투갈어): 동일

예: `const message = body + B2B_OPT_OUT_FOOTER_ES;`

감독관 검수 시 B2B 메시지는 `OPT_OUT_MARKERS`(baja, dejar de recibir 등) 포함 여부로 privacy_optout 항목을 검사합니다. 정책: `docs/AI_GOVERNANCE_POLICY.md`.

---

## 4. AI 생성 콘텐츠 고지 (선택)

**스페인어**:
> Nota: Este contenido incluye enlaces de afiliados. Podríamos recibir una comisión por compras realizadas. Parte del contenido puede haber sido generado con asistencia de IA.

**적용**: 서비스 약관 또는 푸터에 통합 가능.

---

문구 수정이 필요하면 법률 자문을 거친 뒤 본 문서를 갱신하세요.
