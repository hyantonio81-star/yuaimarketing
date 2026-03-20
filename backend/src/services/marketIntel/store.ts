import type { GranularAnalysisRequest, MarketReportOutputOptions } from "./types.js";

const reportOptionsStore = new Map<string, MarketReportOutputOptions>();
const granularRequestStore = new Map<string, GranularAnalysisRequest>();
const enabledPaidSourceStore = new Map<string, string[]>();

function scopedKey(orgId: string, countryCode: string): string {
  return `${orgId}:${countryCode}`;
}

export function getGranularRequest(orgId: string, countryCode: string): GranularAnalysisRequest | null {
  const key = scopedKey(orgId, countryCode);
  const value = granularRequestStore.get(key);
  return value ? { ...value, research_types: [...value.research_types] } : null;
}

export function setGranularRequest(orgId: string, countryCode: string, request: GranularAnalysisRequest): GranularAnalysisRequest {
  const key = scopedKey(orgId, countryCode);
  const normalized: GranularAnalysisRequest = {
    ...request,
    research_types: [...request.research_types],
  };
  granularRequestStore.set(key, normalized);
  return { ...normalized, research_types: [...normalized.research_types] };
}

export function clearGranularRequest(orgId: string, countryCode: string): void {
  const key = scopedKey(orgId, countryCode);
  granularRequestStore.delete(key);
}

export function getReportOptions(orgId: string, countryCode: string): MarketReportOutputOptions | null {
  const key = scopedKey(orgId, countryCode);
  const value = reportOptionsStore.get(key);
  return value ? { ...value, sections: [...value.sections] } : null;
}

export function setReportOptions(orgId: string, countryCode: string, options: MarketReportOutputOptions): MarketReportOutputOptions {
  const key = scopedKey(orgId, countryCode);
  const normalized: MarketReportOutputOptions = {
    ...options,
    sections: [...options.sections],
  };
  reportOptionsStore.set(key, normalized);
  return { ...normalized, sections: [...normalized.sections] };
}

export function getEnabledPaidSourcesForOrg(orgId: string): string[] {
  const ids = enabledPaidSourceStore.get(orgId) ?? [];
  return [...ids];
}

export function setEnabledPaidSourcesForOrg(orgId: string, sourceIds: string[]): string[] {
  const normalized = Array.isArray(sourceIds) ? sourceIds.filter((id) => typeof id === "string") : [];
  enabledPaidSourceStore.set(orgId, normalized);
  return [...normalized];
}
