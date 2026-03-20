import type { FastifyRequest } from "fastify";
import { sanitizeCountryCode, sanitizeOrgId } from "./apiSecurity.js";

interface ScopeOptions {
  orgQueryKey?: string;
  countryQueryKey?: string;
  includeDefaultOrg?: boolean;
}

function readHeader(req: FastifyRequest, key: string): string | undefined {
  const v = req.headers[key];
  return typeof v === "string" ? v.trim() : undefined;
}

function readQuery(req: FastifyRequest, key: string): string | undefined {
  const q = req.query as Record<string, unknown> | undefined;
  const v = q?.[key];
  return typeof v === "string" ? v.trim() : undefined;
}

export function getRequestOrgId(req: FastifyRequest, orgQueryKey = "orgId"): string {
  const raw = readHeader(req, "x-organization-id") || readQuery(req, orgQueryKey) || "default";
  return sanitizeOrgId(raw);
}

export function getRequestCountryCode(req: FastifyRequest, countryQueryKey = "country"): string | undefined {
  const raw = readHeader(req, "x-country") || readQuery(req, countryQueryKey);
  if (!raw) return undefined;
  return sanitizeCountryCode(raw) ?? undefined;
}

export function getRequestScope(req: FastifyRequest, options: ScopeOptions = {}): { organization_id?: string; country_code?: string } {
  const orgQueryKey = options.orgQueryKey ?? "orgId";
  const countryQueryKey = options.countryQueryKey ?? "country";
  const includeDefaultOrg = options.includeDefaultOrg ?? false;
  const orgId = getRequestOrgId(req, orgQueryKey);
  const country = getRequestCountryCode(req, countryQueryKey);
  return {
    ...(orgId && (includeDefaultOrg || orgId !== "default") ? { organization_id: orgId } : {}),
    ...(country ? { country_code: country } : {}),
  };
}

