import { useEffect, useState } from "react";
import SectionCard from "../../components/SectionCard";
import { api, getApiErrorMessage } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function LeadsSection() {
  const { t } = useLanguage();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [leadsError, setLeadsError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setLeadsError(null);
    const params = {};
    if (filterCountry) params.country = filterCountry;
    if (filterStatus) params.status = filterStatus;
    api
      .get("/b2b/leads", { params })
      .then((r) => setLeads(r.data?.leads ?? r.data ?? []))
      .catch((e) => {
        setLeads([]);
        setLeadsError(getApiErrorMessage(e, t("b2bTrade.leadsLoadError")));
      })
      .finally(() => setLoading(false));
  }, [filterCountry, filterStatus, t]);

  return (
    <SectionCard title={t("b2bTrade.leadsTitle")} className="mb-6">
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder={t("b2bTrade.leadFilterCountry")}
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm w-24"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
        >
          <option value="">{t("b2bTrade.leadFilterStatus")}</option>
          <option value="new">new</option>
          <option value="contacted">contacted</option>
          <option value="qualified">qualified</option>
          <option value="transferred">transferred</option>
          <option value="closed">closed</option>
        </select>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : Array.isArray(leads) && leads.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 font-medium text-muted-foreground">{t("b2bTrade.leadId")}</th>
                <th className="py-2 pr-4 font-medium text-muted-foreground">{t("b2bTrade.leadProduct")}</th>
                <th className="py-2 pr-4 font-medium text-muted-foreground">{t("b2bTrade.leadCountry")}</th>
                <th className="py-2 pr-4 font-medium text-muted-foreground">{t("b2bTrade.leadStatus")}</th>
                <th className="py-2 pr-4 font-medium text-muted-foreground">{t("b2bTrade.leadSource")}</th>
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, 20).map((lead) => (
                <tr key={lead.id} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs">{lead.id}</td>
                  <td className="py-2 pr-4">{lead.product_or_hs ?? "—"}</td>
                  <td className="py-2 pr-4">{lead.country ?? "—"}</td>
                  <td className="py-2 pr-4">{lead.status ?? "—"}</td>
                  <td className="py-2 pr-4">{lead.source ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("b2bTrade.noLeads")}</p>
      )}
      {leadsError && <p className="text-sm text-destructive mt-2">{leadsError}</p>}
    </SectionCard>
  );
}

export function HotLeadSection() {
  const { t } = useLanguage();
  const [origin, setOrigin] = useState("KR");
  const [destination, setDestination] = useState("US");
  const [productOrHs, setProductOrHs] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [created, setCreated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchCandidates = () => {
    setLoading(true);
    setActionError(null);
    const params = { origin, destination };
    if (productOrHs.trim()) params.product_or_hs = productOrHs.trim();
    api
      .get("/b2b/hot-leads/candidates", { params })
      .then((r) => setCandidates(r.data?.candidates ?? []))
      .catch((e) => {
        setCandidates([]);
        setActionError(getApiErrorMessage(e, t("b2bTrade.hotLeadError")));
      })
      .finally(() => setLoading(false));
  };

  const createHotLeads = () => {
    setCreating(true);
    setActionError(null);
    api
      .post("/b2b/hot-leads", { origin, destination, product_or_hs: productOrHs.trim() || undefined, count: 5 })
      .then((r) => setCreated(r.data))
      .catch((e) => {
        setCreated(null);
        setActionError(getApiErrorMessage(e, t("b2bTrade.hotLeadError")));
      })
      .finally(() => setCreating(false));
  };

  return (
    <SectionCard title={t("b2bTrade.hotLeadTitle")} className="mb-6">
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.hotLeadOrigin")}</label>
          <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm w-20" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.hotLeadDestination")}</label>
          <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm w-20" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.hotLeadProduct")}</label>
          <input type="text" value={productOrHs} onChange={(e) => setProductOrHs(e.target.value)} placeholder="8504" className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm w-28" />
        </div>
        <button type="button" onClick={fetchCandidates} disabled={loading} className="rounded-md bg-pillar2/20 text-pillar2 px-4 py-2 text-sm font-medium hover:bg-pillar2/30 disabled:opacity-50">
          {loading ? t("common.loading") : t("b2bTrade.hotLeadCandidates")}
        </button>
        <button type="button" onClick={createHotLeads} disabled={creating} className="rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
          {creating ? t("common.loading") : t("b2bTrade.hotLeadCreate")}
        </button>
      </div>
      {candidates.length > 0 && (
        <p className="text-sm text-muted-foreground mb-2">{candidates.length} candidates. Click &quot;Save as leads&quot; to create leads.</p>
      )}
      {created?.leads?.length > 0 && <p className="text-sm text-primary font-medium">{created.leads.length} leads created.</p>}
      {actionError && <p className="text-sm text-destructive mt-2">{actionError}</p>}
    </SectionCard>
  );
}

export function ProposalSection() {
  const { t } = useLanguage();
  const [productName, setProductName] = useState("");
  const [countryName, setCountryName] = useState("");
  const [sectorName, setSectorName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const generate = () => {
    setLoading(true);
    setResult(null);
    setActionError(null);
    api
      .post("/b2b/proposal", {
        product_name: productName || t("b2bTrade.placeholderItem"),
        country_name: countryName || t("b2bTrade.placeholderCountry"),
        sector_name: sectorName || t("b2bTrade.placeholderSector"),
        partner_name: partnerName || t("b2bTrade.placeholderPartner"),
        locale: "es",
      })
      .then((r) => setResult(r.data))
      .catch((e) => {
        setResult(null);
        setActionError(getApiErrorMessage(e, t("b2bTrade.proposalError")));
      })
      .finally(() => setLoading(false));
  };

  return (
    <SectionCard title={t("b2bTrade.proposalTitle")} className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.proposalProduct")}</label>
          <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.proposalCountry")}</label>
          <input type="text" value={countryName} onChange={(e) => setCountryName(e.target.value)} className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.proposalSector")}</label>
          <input type="text" value={sectorName} onChange={(e) => setSectorName(e.target.value)} className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.proposalPartner")}</label>
          <input type="text" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm" />
        </div>
      </div>
      <button type="button" onClick={generate} disabled={loading} className="rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
        {loading ? t("common.loading") : t("b2bTrade.proposalGenerate")}
      </button>
      {result && (
        <div className="mt-4 p-4 rounded-lg border border-border bg-muted/20 text-sm space-y-2">
          <p>
            <strong>Subject:</strong> {result.subject}
          </p>
          <pre className="whitespace-pre-wrap text-muted-foreground">{result.body_prepared}</pre>
        </div>
      )}
      {actionError && <p className="text-sm text-destructive mt-2">{actionError}</p>}
    </SectionCard>
  );
}

export function MessageSection() {
  const { t } = useLanguage();
  const [body, setBody] = useState("");
  const [targetCountry, setTargetCountry] = useState("DO");
  const [mode, setMode] = useState("prepare");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const run = () => {
    setLoading(true);
    setResult(null);
    setActionError(null);
    const req = mode === "prepare"
      ? api.post("/b2b/prepare-message", { body, locale: "es" })
      : api.post("/b2b/validate-message", { body, target_country: targetCountry });
    req
      .then((r) => setResult(r.data))
      .catch((e) => {
        setResult(null);
        setActionError(getApiErrorMessage(e, t("b2bTrade.messageError")));
      })
      .finally(() => setLoading(false));
  };

  return (
    <SectionCard title={t("b2bTrade.messageTitle")} className="mb-6">
      <div className="mb-4">
        <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.messageBody")}</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="inline-flex items-center gap-2">
          <input type="radio" checked={mode === "prepare"} onChange={() => setMode("prepare")} />
          {t("b2bTrade.messagePrepare")}
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="radio" checked={mode === "validate"} onChange={() => setMode("validate")} />
          {t("b2bTrade.messageValidate")}
        </label>
        {mode === "validate" && (
          <input type="text" value={targetCountry} onChange={(e) => setTargetCountry(e.target.value)} placeholder="DO" className="w-16 rounded-md border border-border px-2 py-1 text-sm" />
        )}
        <button type="button" onClick={run} disabled={loading} className="rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
          {loading ? t("common.loading") : (mode === "prepare" ? t("b2bTrade.messagePrepare") : t("b2bTrade.messageValidate"))}
        </button>
      </div>
      {result && (
        <div className="mt-4 p-4 rounded-lg border border-border bg-muted/20 text-sm">
          {result.prepared != null && <pre className="whitespace-pre-wrap">{result.prepared}</pre>}
          {result.approved != null && (
            <p className="font-medium">
              {result.approved ? t("b2bTrade.approved") : t("b2bTrade.rejected")}
              {result.rejectReasons?.length > 0 && ` — ${result.rejectReasons.join(", ")}`}
            </p>
          )}
        </div>
      )}
      {actionError && <p className="text-sm text-destructive mt-2">{actionError}</p>}
    </SectionCard>
  );
}

export function PartnerVerificationSection() {
  const { t } = useLanguage();
  const [partnerId, setPartnerId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const checkByPartner = () => {
    if (!partnerId.trim()) return;
    setLoading(true);
    setResult(null);
    setActionError(null);
    api
      .get(`/b2b/partners/${encodeURIComponent(partnerId.trim())}/verification-status`)
      .then((r) => setResult({ type: "partner", data: r.data }))
      .catch((e) => {
        setResult(null);
        setActionError(getApiErrorMessage(e, t("b2bTrade.verificationError")));
      })
      .finally(() => setLoading(false));
  };

  const checkByLead = () => {
    if (!leadId.trim()) return;
    setLoading(true);
    setResult(null);
    setActionError(null);
    api
      .get(`/b2b/leads/${encodeURIComponent(leadId.trim())}/verification-status`)
      .then((r) => setResult({ type: "lead", data: r.data }))
      .catch((e) => {
        setResult(null);
        setActionError(getApiErrorMessage(e, t("b2bTrade.verificationError")));
      })
      .finally(() => setLoading(false));
  };

  return (
    <SectionCard title={t("b2bTrade.partnerVerificationTitle")} className="mb-6">
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-end gap-2">
          <input
            type="text"
            placeholder={t("b2bTrade.verificationPartnerId")}
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm w-40"
          />
          <button type="button" onClick={checkByPartner} disabled={loading} className="rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {t("b2bTrade.verificationCheck")}
          </button>
        </div>
        <div className="flex items-end gap-2">
          <input
            type="text"
            placeholder={t("b2bTrade.verificationLeadId")}
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm w-40"
          />
          <button type="button" onClick={checkByLead} disabled={loading} className="rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {t("b2bTrade.verificationCheck")}
          </button>
        </div>
      </div>
      {loading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
      {actionError && <p className="text-sm text-destructive">{actionError}</p>}
      {result?.data && (
        <div className="mt-4 p-4 rounded-lg border border-border bg-muted/20 text-sm">
          {result.type === "lead" && <p>Lead: {result.data.lead_id} — Approved: {String(result.data.approved)}</p>}
          {result.data.verification && (
            <p>Decision: {result.data.verification.decision} · Score: {result.data.verification.overall_score}</p>
          )}
          {result.type === "partner" && result.data && (
            <p>Decision: {result.data.decision} · Score: {result.data.overall_score}</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}
