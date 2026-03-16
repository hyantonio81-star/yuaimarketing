/**
 * B2B 메시지 준비·검수 (LGPD/opt-out 준수).
 * 발송 전 본문에 수신 거부 문구 부착 및 감독관 검수.
 * 제안서 템플릿(스페인어) 상수 및 플레이스홀더 치환.
 */

import { B2B_OPT_OUT_FOOTER_ES, B2B_OPT_OUT_FOOTER_PT, runComplianceCheck } from "./contentAutomation/complianceOverseerService.js";
import type { ComplianceCheckResult } from "./contentAutomation/types.js";

export type B2bMessageLocale = "es" | "pt";

/** B2B 파트너 제안서 템플릿 플레이스홀더 치환용 변수 */
export interface B2bProposalVars {
  /** 품목명 (예: inversores solares, paneles fotovoltaicos) */
  product_name: string;
  /** 국가명 표기 (예: República Dominicana, Panamá) */
  country_name: string;
  /** 업종명 (예: equipos eléctricos, suministros industriales) */
  sector_name: string;
  /** 파트너 성함 또는 Empresa */
  partner_name: string;
}

/** 스페인어 B2B 제안서 본문 (AI 감독 위원회 검수 구조·신뢰성 중심). 플레이스홀더: [품목명], [국가명], [업종명], [파트너 성함/Empresa] */
export const B2B_PROPOSAL_TEMPLATE_ES =
  `Estimado [파트너 성함/Empresa],

Le saludamos desde yuaimarketing, su socio estratégico en la cadena de suministro inteligente para América Latina.

Hemos identificado que su empresa lidera el sector de [업종명] y nos gustaría proponerle una alianza para optimizar sus costos de importación y asegurar la calidad de sus productos mediante nuestro sistema de monitoreo basado en IA (ISO 42001).

¿Por qué trabajar con nosotros?

• Validación con IA: Cada lote de productos es verificado por nuestra auditoría inteligente para garantizar estándares internacionales.

• Eficiencia en Aduanas: Conocemos a fondo las regulaciones de [국가명] (como el beneficio de exención de impuestos en RD), reduciendo tiempos de espera.

• Escalabilidad: Conexión directa con proveedores certificados en Asia y EE.UU.

Adjunto encontrará el catálogo de ofertas exclusivas para este trimestre. Estamos listos para coordinar una llamada de 10 minutos para discutir cómo podemos reducir sus costos operativos en un 15-20%.

Atentamente,
Lumi AI - Director de Operaciones
yuaimarketing`;

/** 제안서 이메일/발송용 제목 라인 템플릿 */
export const B2B_PROPOSAL_SUBJECT_ES =
  "Oportunidad de Suministro: [품목명] con Optimización Logística para [국가명]";

/**
 * 제안서 템플릿에 변수를 넣어 본문을 생성한다. 푸터는 붙이지 않음 (prepareB2bMessage로 별도 부착).
 */
export function fillProposalTemplate(
  vars: B2bProposalVars,
  template: string = B2B_PROPOSAL_TEMPLATE_ES
): string {
  return template
    .replace(/\[품목명\]/g, vars.product_name || "[품목명]")
    .replace(/\[국가명\]/g, vars.country_name || "[국가명]")
    .replace(/\[업종명\]/g, vars.sector_name || "[업종명]")
    .replace(/\[파트너 성함\/Empresa\]/g, vars.partner_name || "[파트너 성함/Empresa]");
}

/** 제목 라인 치환 (동일 플레이스홀더) */
export function fillProposalSubject(vars: B2bProposalVars): string {
  return B2B_PROPOSAL_SUBJECT_ES.replace(/\[품목명\]/g, vars.product_name || "[품목명]")
    .replace(/\[국가명\]/g, vars.country_name || "[국가명]");
}

/**
 * B2B 발송용 본문에 수신 거부(BAJA) 푸터를 붙인다.
 * LGPD·옵트아웃 준수용.
 */
export function prepareB2bMessage(body: string, locale: B2bMessageLocale = "es"): string {
  const trimmed = (body ?? "").trim();
  const footer = locale === "pt" ? B2B_OPT_OUT_FOOTER_PT : B2B_OPT_OUT_FOOTER_ES;
  return trimmed ? trimmed + footer : footer.trim();
}

/** B2B 메시지 감독관 검수 시 사용할 국가 코드 (contentCompliance 타입 호환) */
const COMPLIANCE_COUNTRY_MAP: Record<string, "DO" | "MX" | "BR" | "US" | "PA"> = {
  DO: "DO",
  MX: "MX",
  BR: "BR",
  US: "US",
  PA: "PA",
};

/**
 * B2B 메시지 본문에 대해 감독관 검수 실행.
 * contentType: b2b_message → privacy_optout(BAJA 문구) 등 검사.
 */
export function runB2bMessageCompliance(
  body: string,
  targetCountry: string
): ComplianceCheckResult {
  const country = COMPLIANCE_COUNTRY_MAP[targetCountry?.toUpperCase() ?? ""] ?? "DO";
  return runComplianceCheck({
    blogBodyForPublish: undefined,
    snsCopy: body,
    targetCountry: country,
    contentType: "b2b_message",
  });
}

/**
 * B2B 발송 로그 엔트리 (감사·ISO 42001).
 * 실제 발송 시 호출 측에서 기록용으로 사용.
 */
export interface B2bSendLogEntry {
  id: string;
  recipient_id?: string;
  recipient_contact?: string;
  channel: "whatsapp" | "email" | "other";
  body_preview: string;
  body_length: number;
  locale: B2bMessageLocale;
  compliance_passed: boolean;
  sent_at: string; // ISO 8601
  organization_id?: string;
}

export function createB2bSendLogEntry(
  params: Omit<B2bSendLogEntry, "id" | "body_preview" | "body_length" | "sent_at"> & { body: string }
): B2bSendLogEntry {
  const body = params.body;
  return {
    ...params,
    id: `b2b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    body_preview: body.slice(0, 200),
    body_length: body.length,
    sent_at: new Date().toISOString(),
  };
}
