/**
 * B2B 리드 관리: 생성·조회·이전, Hot Lead 생성 (trade-market-score + match-buyers 기반).
 */

import { matchBuyers, type MatchedBuyer } from "./buyerMatchingService.js";
import { tradeMarketScore, type TradeMarketScoreResult } from "./tradeMarketScoreService.js";

export type LeadStatus = "new" | "contacted" | "qualified" | "transferred" | "closed";

export interface Lead {
  id: string;
  product_or_hs: string;
  country: string;
  source: "manual" | "hot_lead" | "match_buyers" | "api";
  score: number;
  status: LeadStatus;
  buyer_id?: string;
  buyer_name?: string;
  buyer_contact?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface CreateLeadInput {
  product_or_hs: string;
  country: string;
  source?: Lead["source"];
  score?: number;
  buyer_id?: string;
  buyer_name?: string;
  buyer_contact?: string;
  metadata?: Record<string, unknown>;
}

export interface LeadFilter {
  country?: string;
  status?: LeadStatus;
  source?: Lead["source"];
  min_score?: number;
}

export interface LeadTransferResult {
  lead_id: string;
  supplier_id?: string;
  fee?: number;
  transferred_at: string;
  success: boolean;
}

const store = new Map<string, Lead>();

function nextId(): string {
  return `lead_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createLead(input: CreateLeadInput): Lead {
  const now = new Date().toISOString();
  const lead: Lead = {
    id: nextId(),
    product_or_hs: input.product_or_hs,
    country: input.country,
    source: input.source ?? "manual",
    score: typeof input.score === "number" ? Math.max(0, Math.min(100, input.score)) : 50,
    status: "new",
    buyer_id: input.buyer_id,
    buyer_name: input.buyer_name,
    buyer_contact: input.buyer_contact,
    created_at: now,
    updated_at: now,
    metadata: input.metadata,
  };
  store.set(lead.id, lead);
  return lead;
}

export function getLead(id: string): Lead | undefined {
  return store.get(id);
}

export function getLeads(filter: LeadFilter = {}, limit = 50, offset = 0): { leads: Lead[]; total: number } {
  let list = Array.from(store.values());
  if (filter.country) list = list.filter((l) => l.country === filter.country);
  if (filter.status) list = list.filter((l) => l.status === filter.status);
  if (filter.source) list = list.filter((l) => l.source === filter.source);
  if (typeof filter.min_score === "number") list = list.filter((l) => l.score >= filter.min_score!);
  const total = list.length;
  list = list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  list = list.slice(offset, offset + limit);
  return { leads: list, total };
}

export function transferLead(
  id: string,
  supplier_id?: string,
  fee?: number
): LeadTransferResult {
  const lead = store.get(id);
  const transferred_at = new Date().toISOString();
  if (!lead) {
    return { lead_id: id, supplier_id, fee, transferred_at, success: false };
  }
  lead.status = "transferred";
  lead.updated_at = transferred_at;
  if (lead.metadata) lead.metadata = { ...lead.metadata, transfer_supplier_id: supplier_id, transfer_fee: fee };
  else lead.metadata = { transfer_supplier_id: supplier_id, transfer_fee: fee };
  return { lead_id: id, supplier_id, fee, transferred_at, success: true };
}

export interface HotLeadCandidate {
  buyer: MatchedBuyer;
  trade_score_result: TradeMarketScoreResult;
  quality_score: number;
}

export function generateHotLeadCandidates(
  origin: string,
  destination: string,
  productOrHs: string,
  limit = 20
): HotLeadCandidate[] {
  const tradeResult = tradeMarketScore(origin, destination, productOrHs);
  const buyers = matchBuyers(
    /^\d{2,10}$/.test(String(productOrHs).trim()) ? productOrHs : { hs_code: productOrHs },
    [destination],
    60
  );
  const candidates: HotLeadCandidate[] = buyers.map((buyer) => {
    const quality_score = Math.round(
      (tradeResult.total_score * 0.4 + buyer.match_score * 0.6) * 10
    ) / 10;
    return {
      buyer,
      trade_score_result: tradeResult,
      quality_score: Math.min(100, quality_score),
    };
  });
  return candidates
    .sort((a, b) => b.quality_score - a.quality_score)
    .slice(0, limit);
}

export function createHotLeads(
  origin: string,
  destination: string,
  productOrHs: string,
  count = 5
): Lead[] {
  const candidates = generateHotLeadCandidates(origin, destination, productOrHs, count);
  const tradeResult = candidates[0]?.trade_score_result;
  const created: Lead[] = [];
  for (const c of candidates) {
    const lead = createLead({
      product_or_hs: productOrHs,
      country: destination,
      source: "hot_lead",
      score: c.quality_score,
      buyer_id: c.buyer.id,
      buyer_name: c.buyer.name,
      metadata: {
        origin,
        trade_total_score: tradeResult?.total_score,
        match_score: c.buyer.match_score,
      },
    });
    created.push(lead);
  }
  return created;
}
