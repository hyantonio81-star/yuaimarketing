/**
 * 도미니카 공화국 직접 구매·판매 제품 API.
 * - GET /api/landing/dr-products: 랜딩용 목록 (is_visible === true만)
 * - GET /api/landing/dr-products/:slug: 랜딩용 상세
 * - POST /api/landing/admin/login: 운영자 로그인 (비밀번호 → 토큰)
 * - GET/POST/PUT/DELETE .../admin/...: 관리용 (Bearer 토큰 필요)
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  type DrProduct,
  loadProducts,
  saveProducts,
  sanitizeSlug,
} from "../lib/drProductsStore.js";
import { landingAdminLogin, getLandingAdminToken, validateLandingAdminToken } from "../lib/landingAdminAuth.js";
import { checkRateLimitLogin } from "../lib/rateLimit.js";

export type { DrProduct };

export async function drProductsRoutes(app: FastifyInstance) {
  /** 랜딩용: 노출 ON 제품 목록. 쿼리 ?partner= 값이 있으면 해당 협력사만 반환 */
  app.get<{ Querystring: { partner?: string } }>(
    "/dr-products",
    async (request: FastifyRequest<{ Querystring: { partner?: string } }>, reply: FastifyReply) => {
      const products = await loadProducts();
      let visible = products.filter((p) => p.is_visible !== false);
      const partner = (request.query?.partner ?? "").trim();
      if (partner) {
        visible = visible.filter((p) => (p.partner ?? "").toLowerCase() === partner.toLowerCase());
      }
      return reply.send({ products: visible });
    }
  );

  /** 랜딩용: slug로 상세 (노출 ON만) */
  app.get<{ Params: { slug: string } }>(
    "/dr-products/:slug",
    async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
      const slug = (request.params?.slug ?? "").trim();
      if (!slug) return reply.code(404).send({ error: "Not found" });
      const products = await loadProducts();
      const product = products.find((p) => p.slug === slug && p.is_visible !== false);
      if (!product) return reply.code(404).send({ error: "Product not found" });
      return reply.send(product);
    }
  );

  /** 운영자 로그인: 비밀번호 확인 후 토큰 발급. IP당 1분 5회 제한 */
  app.post<{ Body: { password?: string } }>(
    "/admin/login",
    async (request: FastifyRequest<{ Body: { password?: string } }>, reply: FastifyReply) => {
      if (!checkRateLimitLogin(request)) {
        return reply.code(429).send({ error: "Too many login attempts. Try again later." });
      }
      const password = (request.body?.password ?? "").trim();
      const result = await landingAdminLogin(password);
      if (!result) return reply.code(401).send({ error: "Invalid password" });
      return reply.send({ token: result.token });
    }
  );

  function requireAdminAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const token = getLandingAdminToken(req);
    if (!validateLandingAdminToken(token)) {
      reply.code(401).send({ error: "Unauthorized", message: "Login required." });
      throw new Error("Unauthorized");
    }
    return Promise.resolve();
  }

  /** 관리용: 전체 목록 (노출 OFF 포함) — 인증 필요 */
  app.get(
    "/dr-products/admin/list",
    { preHandler: requireAdminAuth },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const products = await loadProducts();
      return reply.send({ products });
    }
  );

  /** 관리용: 제품 생성 — 인증 필요 */
  app.post<{ Body: Partial<DrProduct> }>(
    "/dr-products/admin",
    { preHandler: requireAdminAuth },
    async (request: FastifyRequest<{ Body: Partial<DrProduct> }>, reply: FastifyReply) => {
      const body = request.body ?? {};
      const slug = sanitizeSlug(body.slug ?? body.title ?? "");
      if (!slug) return reply.code(400).send({ error: "slug or title required" });
      const products = await loadProducts();
      if (products.some((p) => p.slug === slug)) return reply.code(409).send({ error: "slug already exists" });
      const id = `dr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      const product: DrProduct = {
        id,
        slug,
        title: String(body.title ?? "").trim() || "Untitled",
        description: String(body.description ?? "").trim(),
        price: Number(body.price) || 0,
        currency: String(body.currency ?? "USD").trim() || "USD",
        image: String(body.image ?? "").trim(),
        images: Array.isArray(body.images) ? body.images.map(String) : undefined,
        category: String(body.category ?? "").trim(),
        origin: String(body.origin ?? "Dominican Republic").trim(),
        stock_quantity: Math.max(0, Number(body.stock_quantity) ?? 0),
        is_visible: body.is_visible !== false,
        partner: body.partner ? String(body.partner).trim() : undefined,
        contact_whatsapp: body.contact_whatsapp ? String(body.contact_whatsapp).trim() : undefined,
        contact_email: body.contact_email ? String(body.contact_email).trim() : undefined,
        created_at: now,
        updated_at: now,
      };
      products.push(product);
      await saveProducts(products);
      return reply.code(201).send(product);
    }
  );

  /** 관리용: 배치 업로드 — 인증 필요. slug 기준으로 기존이면 수정, 없으면 생성. AI/affiliate 파이프라인 연동용 */
  app.post<{ Body: { products?: Partial<DrProduct>[] } }>(
    "/dr-products/admin/batch",
    { preHandler: requireAdminAuth },
    async (request: FastifyRequest<{ Body: { products?: Partial<DrProduct>[] } }>, reply: FastifyReply) => {
      const list = Array.isArray(request.body?.products) ? request.body.products : [];
      if (list.length === 0) return reply.code(400).send({ error: "products array required and must not be empty" });
      const products = await loadProducts();
      let created = 0;
      let updated = 0;
      const now = new Date().toISOString();
      for (const body of list) {
        const slug = sanitizeSlug(body.slug ?? body.title ?? "");
        if (!slug) continue;
        const existingIndex = products.findIndex((p) => p.slug === slug);
        const base = {
          title: String(body.title ?? "").trim() || "Untitled",
          description: String(body.description ?? "").trim(),
          price: Number(body.price) || 0,
          currency: String(body.currency ?? "USD").trim() || "USD",
          image: String(body.image ?? "").trim(),
          images: Array.isArray(body.images) ? body.images.map(String) : undefined,
          category: String(body.category ?? "").trim(),
          origin: String(body.origin ?? "Dominican Republic").trim(),
          stock_quantity: Math.max(0, Number(body.stock_quantity) ?? 0),
          is_visible: body.is_visible !== false,
          partner: body.partner ? String(body.partner).trim() : undefined,
          contact_whatsapp: body.contact_whatsapp ? String(body.contact_whatsapp).trim() : undefined,
          contact_email: body.contact_email ? String(body.contact_email).trim() : undefined,
        };
        if (existingIndex >= 0) {
          const prev = products[existingIndex];
          products[existingIndex] = {
            ...prev,
            ...base,
            id: prev.id,
            slug,
            created_at: prev.created_at,
            updated_at: now,
          };
          updated++;
        } else {
          const id = `dr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          products.push({
            id,
            slug,
            ...base,
            created_at: now,
            updated_at: now,
          } as DrProduct);
          created++;
        }
      }
      await saveProducts(products);
      return reply.send({ created, updated, total: products.length });
    }
  );

  /** 관리용: 제품 수정 — 인증 필요 */
  app.put<{ Params: { id: string }; Body: Partial<DrProduct> }>(
    "/dr-products/admin/:id",
    { preHandler: requireAdminAuth },
    async (request: FastifyRequest<{ Params: { id: string }; Body: Partial<DrProduct> }>, reply: FastifyReply) => {
      const id = (request.params?.id ?? "").trim();
      if (!id) return reply.code(404).send({ error: "Not found" });
      const body = request.body ?? {};
      const products = await loadProducts();
      const index = products.findIndex((p) => p.id === id);
      if (index === -1) return reply.code(404).send({ error: "Product not found" });
      const prev = products[index];
      const slug = body.slug !== undefined ? sanitizeSlug(body.slug) : prev.slug;
      if (slug && slug !== prev.slug && products.some((p) => p.slug === slug)) return reply.code(409).send({ error: "slug already exists" });
      const updated: DrProduct = {
        ...prev,
        ...(body.title !== undefined && { title: String(body.title).trim() || prev.title }),
        ...(body.description !== undefined && { description: String(body.description).trim() }),
        ...(body.price !== undefined && { price: Number(body.price) ?? prev.price }),
        ...(body.currency !== undefined && { currency: String(body.currency).trim() || prev.currency }),
        ...(body.image !== undefined && { image: String(body.image).trim() }),
        ...(body.images !== undefined && { images: Array.isArray(body.images) ? body.images.map(String) : prev.images }),
        ...(body.category !== undefined && { category: String(body.category).trim() }),
        ...(body.origin !== undefined && { origin: String(body.origin).trim() }),
        ...(body.stock_quantity !== undefined && { stock_quantity: Math.max(0, Number(body.stock_quantity) ?? 0) }),
        ...(body.is_visible !== undefined && { is_visible: Boolean(body.is_visible) }),
        ...(body.partner !== undefined && { partner: body.partner ? String(body.partner).trim() : undefined }),
        ...(body.contact_whatsapp !== undefined && { contact_whatsapp: body.contact_whatsapp ? String(body.contact_whatsapp).trim() : undefined }),
        ...(body.contact_email !== undefined && { contact_email: body.contact_email ? String(body.contact_email).trim() : undefined }),
        slug: slug || prev.slug,
        updated_at: new Date().toISOString(),
      };
      products[index] = updated;
      await saveProducts(products);
      return reply.send(updated);
    }
  );

  /** 관리용: 제품 삭제 — 인증 필요 */
  app.delete<{ Params: { id: string } }>(
    "/dr-products/admin/:id",
    { preHandler: requireAdminAuth },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const id = (request.params?.id ?? "").trim();
      if (!id) return reply.code(404).send({ error: "Not found" });
      const products = await loadProducts();
      const filtered = products.filter((p) => p.id !== id);
      if (filtered.length === products.length) return reply.code(404).send({ error: "Product not found" });
      await saveProducts(filtered);
      return reply.code(204).send();
    }
  );
}
