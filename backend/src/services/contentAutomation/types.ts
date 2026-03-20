/**
 * 콘텐츠 자동화 파이프라인 공통 타입.
 * Trigger(RSS/API) → Brain(Gemini) → Router(Blog/SNS) → Action(이미지·게시)
 */

import type { CommerceProduct } from "../threadsCommerce/types.js";

export type ContentLanguageCode = "es-DO" | "es-MX" | "pt-BR" | "ko" | "en";
export type TargetCountryCode = "DO" | "MX" | "BR" | "KR" | "US" | "PA";

/** RSS/API에서 수집한 상품 아이템 (CommerceProduct와 호환) */
export interface ProductRssItem {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
  category: string;
  price?: number;
  priceDropPercent?: number;
  marketplace: string;
  collectedAt: string;
  source?: string;
}

/** Gemini 이중 출력: SNS 문구 + 블로그 리뷰 */
export interface DualContentResult {
  snsCopy: string;
  blogReview: string;
  blogTitle?: string;
  model?: string;
}

export interface DualContentOptions {
  contentLanguage?: ContentLanguageCode;
  targetCountry?: TargetCountryCode;
  marketplace?: string;
  blogUrlPlaceholder?: string; // SNS에 넣을 블로그 링크 자리
}

/** 파이프라인 설정 */
export interface ContentAutomationSettings {
  enableBlog?: boolean;
  enableSns?: boolean;
  blogUrlPlaceholder?: string;
  contentLanguage?: ContentLanguageCode;
  targetCountry?: TargetCountryCode;
  marketplace?: string;
  threadAccountId?: string;
  /** true 시 단일 감독관 대신 AI 감독 위원회(3인) 사용 */
  useOversightBoard?: boolean;
  /** 제휴(Tracking ID) — 상품별 링크에 자동 부착 (Threads Commerce와 동일) */
  amazonAssociateTag?: string;
  aliexpressAffiliateParams?: string;
  temuAffiliateParams?: string;
  /** true 시 파이프라인 선정 상품을 랜딩 Tienda(dr-products)에 자동 추가 */
  syncToDrProducts?: boolean;
}

/** 파이프라인 1회 실행 결과 */
export interface ContentAutomationResult {
  jobId: string;
  status: "sourcing" | "copy" | "blog" | "sns" | "done" | "failed";
  product?: { title: string; id: string; marketplace?: string };
  /** 제휴 상품 단위 연동용 — Threads·Shorts job과 연결 시 공통 키 */
  product_id?: string;
  snsCopy?: string;
  blogReview?: string;
  blogPostUrl?: string;
  snsPostUrl?: string;
  error?: string;
  /** ISO 42001 감독관 검수 결과 (단일 감독관 사용 시) */
  compliance?: ComplianceCheckResult;
  /** AI 감독 위원회 결과 (3인 체제 사용 시) */
  oversightBoard?: OversightBoardResult;
}

/** 감독관 검수 입력 (콘텐츠 발행 직전 본문) */
export interface ContentComplianceInput {
  /** 발행될 블로그 본문 전체 (disclaimer 포함) */
  blogBodyForPublish?: string;
  /** SNS 발행 문구 */
  snsCopy: string;
  targetCountry: TargetCountryCode;
  /** b2c_affiliate | b2b_message */
  contentType: "b2c_affiliate" | "b2b_message";
  /** B2C 시 가격 정확성 검사용 — 있으면 본문 가격과 비교 */
  productPrice?: number;
}

/** 9대 체크리스트 항목 ID (ISO 42001 기반 + 전문성 + 허위긴급성) */
export type ComplianceCheckItemId =
  | "transparency"
  | "customs_regulations"
  | "language_guardrail"
  | "privacy_optout"
  | "accuracy"
  | "copyright"
  | "ethics"
  | "expertise"
  | "false_urgency";

/** 감독관 검수 결과 */
export interface ComplianceCheckResult {
  approved: boolean;
  /** Make.com Router 등에서 사용: "APPROVE" | "REJECT" */
  compliance_status: "APPROVE" | "REJECT";
  rejectReasons: string[];
  /** 스페인어 반려 사유 (Content Agent 재생성 피드백·현지 팀용) */
  rejectReasonsEs?: string[];
  checklistResults: Record<ComplianceCheckItemId, boolean>;
  checkedAt: string; // ISO 8601
}

/** AI 감독 위원회 위원 역할 (3인 체제) */
export type CommitteeRole = "legal" | "ethics" | "business";

/** 위원회 위원 1명의 투표 결과 */
export interface CommitteeMemberVote {
  role: CommitteeRole;
  vote: "APPROVE" | "REJECT";
  /** 0~100 (선택) */
  score?: number;
  rejectReasons: string[];
  rejectReasonsEs?: string[];
  /** 법적 치명적 결함 시 true — 1명이라도 true면 DISCARD */
  fatal?: boolean;
  checklistResults: Partial<Record<ComplianceCheckItemId, boolean>>;
}

/** 위원회 최종 결정 */
export type OversightDecision = "APPROVE" | "REVISE" | "DISCARD";

/** AI 감독 위원회 집계 결과 */
export interface OversightBoardResult {
  decision: OversightDecision;
  /** Make.com 등 연동용: APPROVE만 발행 허용 */
  compliance_status: "APPROVE" | "REJECT";
  votes: {
    legal: CommitteeMemberVote;
    ethics: CommitteeMemberVote;
    business: CommitteeMemberVote;
  };
  /** 역할별 반려 사유 (REVISE 시 Lumi가 Content Agent에 전달) */
  rejectReasonsByRole: Record<CommitteeRole, string[]>;
  rejectReasonsEsByRole: Record<CommitteeRole, string[]>;
  /** 법적 치명적 결함을 표시한 위원 (있으면 DISCARD) */
  fatalBy?: CommitteeRole;
  checkedAt: string; // ISO 8601
}
