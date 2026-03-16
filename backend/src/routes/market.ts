import type { FastifyInstance } from "fastify";
import {
  getCountries,
  getCountryByCode,
  getMarketProfile,
  registerOrganization,
} from "../services/marketContextService.js";
import type { RegisterOrganizationBody } from "../types/market.js";

export async function marketRoutes(app: FastifyInstance) {
  app.get("/countries", async () => {
    return { countries: getCountries() };
  });

  app.get<{ Querystring: { country?: string; organization_id?: string } }>(
    "/market-profile",
    async (req) => {
      const country = (req.query?.country ?? "").trim().toUpperCase().slice(0, 2);
      const orgId = (req.query?.organization_id ?? "").trim() || "default";
      if (!country) return { profile: null, country: null };
      const countryInfo = getCountryByCode(country);
      const profile = getMarketProfile(orgId, country);
      return { profile, country: countryInfo };
    }
  );

  app.post<{ Body: RegisterOrganizationBody }>("/register", async (req, reply) => {
    const body = req.body as RegisterOrganizationBody;
    if (!body?.organization_name || !Array.isArray(body.target_countries)) {
      return reply.code(400).send({
        error: "organization_name and target_countries required",
      });
    }
    const result = registerOrganization({
      organization_name: body.organization_name,
      target_countries: body.target_countries,
      product_categories: body.product_categories ?? [],
      industry: body.industry ?? "",
      company_type: body.company_type ?? "manufacturer",
      b2b_enabled: body.b2b_enabled ?? true,
      b2c_enabled: body.b2c_enabled ?? true,
      user_email: body.user_email,
    });
    return result;
  });
}
