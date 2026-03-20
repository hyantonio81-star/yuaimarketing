import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  BarChart3,
  Rocket,
  Handshake,
  Globe,
  Landmark,
  Clock,
  Database,
  Calculator,
  Target,
  FileText,
  CheckCircle,
  AlertTriangle,
  Megaphone,
  DollarSign,
  Calendar,
  Users,
  LayoutList,
  CheckCircle2,
  Brain,
  MessageSquare,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import SectionCard from "../components/SectionCard";
import { api, getApiErrorMessage } from "../lib/api";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  HotLeadSection,
  LeadsSection,
  MessageSection,
  PartnerVerificationSection,
  ProposalSection,
} from "./B2BTrade/LeadsSections.jsx";

const SOURCES = [
  { name: "Google Trends API", descKey: "sourceDescTrends", icon: TrendingUp },
  { name: "Statista API", descKey: "sourceDescStats", icon: BarChart3 },
  { name: "CB Insights", descKey: "sourceDescStartup", icon: Rocket },
  { name: "PitchBook", descKey: "sourceDescMa", icon: Handshake },
  { name: "UN Comtrade", descKey: "sourceDescTrade", icon: Globe },
  { name: "World Bank Open Data", descKey: "sourceDescEconomic", icon: Landmark },
];

const TABS = [
  { id: "market", key: "tabMarketIndices" },
  { id: "marketing", key: "tabMarketingInsight" },
  { id: "buyer", key: "tabBuyerMatching" },
  { id: "tender", key: "tabTenderRfq" },
  { id: "docs", key: "tabTradeDocs" },
  { id: "leads", key: "tabLeadsMessage" },
];

export default function B2BTrade() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("market");
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    setAuthError(false);
    api.get("/b2b/options").catch((e) => {
      if (e?.response?.status === 401) setAuthError(true);
    });
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t("b2bTrade.pillarTitle")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("b2bTrade.pillarSubtitle")}
        </p>
      </header>

      {authError && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{t("b2bTrade.authExpired")}</span>
          <Link to="/login" className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-300 hover:underline">
            <ExternalLink className="w-4 h-4" />
            {t("b2bTrade.reLogin")}
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-b border-border mb-6">
        {TABS.map(({ id, key }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {t(`b2bTrade.${key}`)}
          </button>
        ))}
      </div>

      {activeTab === "market" && (
        <>
          <SectionCard title={t("b2bTrade.sourcesTitle")} className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SOURCES.map(({ name, descKey, icon: Icon }) => (
                <div
                  key={name}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <Icon className="w-5 h-5 text-pillar2 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">{name}</div>
                    <div className="text-sm text-muted-foreground">{t(`b2bTrade.${descKey}`)}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <SectionCard title={t("b2bTrade.collectionSchedule")}>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-pillar2/10 border border-pillar2/30">
                <div className="p-2 rounded-md bg-pillar2/20 text-pillar2">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{t("b2bTrade.dailyOnce")}</div>
                  <div className="text-muted-foreground">{t("b2bTrade.scheduleTime")}</div>
                </div>
              </div>
            </SectionCard>
            <SectionCard title={t("b2bTrade.storage")}>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
                <div className="p-2 rounded-md bg-primary/20 text-primary">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    PostgreSQL + TimescaleDB
                  </div>
                  <div className="text-sm text-muted-foreground">{t("b2bTrade.timeSeries")}</div>
                </div>
              </div>
            </SectionCard>
          </div>
          <IndexViewerSection />
          <MarketScoreSection />
          <TradeMarketScoreSection />
          <MarketReportSection />
        </>
      )}

      {activeTab === "marketing" && (
        <>
          <MarketingStrategySection />
          <IntegratedMarketingSection />
          <CustomerInsightEngineSection />
          <CustomerInsightReportSection />
          <BrandMonitoringSection />
        </>
      )}

      {activeTab === "buyer" && (
        <>
          <BuyerHunterSection />
          <BuyerMatchingSection />
          <BuyerProfileSection />
        </>
      )}

      {activeTab === "tender" && (
        <>
          <TenderRfqSection />
          <TenderEvaluationSection />
          <TenderChecklistSection />
        </>
      )}

      {activeTab === "docs" && (
        <>
          <TradeDocumentSection />
          <CommercialInvoiceSection />
          <HsCodeClassifySection />
          <ShippingQuotesSection />
          <LandedCostSection />
        </>
      )}

      {activeTab === "leads" && (
        <>
          <LeadsSection />
          <HotLeadSection />
          <ProposalSection />
          <MessageSection />
          <PartnerVerificationSection />
        </>
      )}
    </div>
  );
}

function LandedCostSection() {
  const { t } = useLanguage();
  const [fobValue, setFobValue] = useState("10000");
  const [freight, setFreight] = useState("850");
  const [hsCode, setHsCode] = useState("8541");
  const [originCountry, setOriginCountry] = useState("KR");
  const [destCountry, setDestCountry] = useState("US");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCalculate = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.post("/b2b/landed-cost", {
        shipment: {
          fob_value: Number(fobValue) || 0,
          freight: Number(freight) || undefined,
          hs_code: hsCode || "8541",
          origin_country: originCountry || "KR",
        },
        destination_country: destCountry || "US",
      });
      setResult(data);
    } catch (e) {
      setError(e.message || t("b2bTrade.landedCostError"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title={t("b2bTrade.landedCostTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("b2bTrade.landedCostFormula")}
      </p>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="min-w-[100px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">FOB (USD)</label>
          <input type="number" value={fobValue} onChange={(e) => setFobValue(e.target.value)} min={0} className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm" />
        </div>
        <div className="min-w-[90px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Freight</label>
          <input type="number" value={freight} onChange={(e) => setFreight(e.target.value)} min={0} className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm" />
        </div>
        <div className="min-w-[80px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">HS Code</label>
          <input type="text" value={hsCode} onChange={(e) => setHsCode(e.target.value)} placeholder="8541" className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm" />
        </div>
        <div className="min-w-[70px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Origin</label>
          <input type="text" value={originCountry} onChange={(e) => setOriginCountry(e.target.value)} placeholder="KR" className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm" />
        </div>
        <div className="min-w-[70px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Dest.</label>
          <input type="text" value={destCountry} onChange={(e) => setDestCountry(e.target.value)} placeholder="US" className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm" />
        </div>
        <button type="button" onClick={handleCalculate} disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
          {loading ? t("b2bTrade.calculating") : t("b2bTrade.landedCostCalculate")}
        </button>
      </div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {result && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4 text-sm">
          <div className="flex flex-wrap items-baseline gap-4">
            <span className="text-xl font-bold text-primary">Total Landed Cost: ${result.total_landed_cost?.toLocaleString()}</span>
            <span className="text-muted-foreground">Duty {result.duty_rate}% · VAT {result.vat_rate}% · Markup +{result.effective_markup}%</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-muted-foreground">
            <span>Product: ${result.breakdown?.product_cost?.toLocaleString()}</span>
            <span>Freight: ${result.breakdown?.freight}</span>
            <span>Insurance: ${result.breakdown?.insurance}</span>
            <span>Customs: ${result.breakdown?.customs_duty}</span>
            <span>VAT: ${result.breakdown?.vat}</span>
            <span>Other: ${result.breakdown?.other_fees}</span>
          </div>
          {result.region_hint && (
            <p className="text-xs text-muted-foreground border-t border-border pt-2 mt-2">{result.region_hint}</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function ShippingQuotesSection() {
  const { t } = useLanguage();
  const [origin, setOrigin] = useState("KRICN");
  const [dest, setDest] = useState("USLAX");
  const [weight, setWeight] = useState("100");
  const [cbm, setCbm] = useState("1");
  const [incoterm, setIncoterm] = useState("CIF");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGetQuotes = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.post("/b2b/shipping-quotes", {
        origin_port: origin || "KRICN",
        dest_port: dest || "USLAX",
        weight: Number(weight) || 100,
        cbm: Number(cbm) || 1,
        incoterm: incoterm || "CIF",
      });
      setResult(data);
    } catch (e) {
      setError(e.message || t("b2bTrade.quotesError"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title={t("b2bTrade.shippingQuotesTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        DHL, FedEx, UPS, Maersk, COSCO, Local Forwarders · cheapest / fastest / best_value
      </p>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="min-w-[90px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Origin</label>
          <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="KRICN" className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm" />
        </div>
        <div className="min-w-[90px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Destination</label>
          <input type="text" value={dest} onChange={(e) => setDest(e.target.value)} placeholder="USLAX" className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm" />
        </div>
        <div className="min-w-[70px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Weight (kg)</label>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} min={1} className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm" />
        </div>
        <div className="min-w-[70px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">CBM</label>
          <input type="number" value={cbm} onChange={(e) => setCbm(e.target.value)} min={0.1} step={0.1} className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm" />
        </div>
        <div className="min-w-[80px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Incoterm</label>
          <input type="text" value={incoterm} onChange={(e) => setIncoterm(e.target.value)} placeholder="CIF" className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm" />
        </div>
        <button type="button" onClick={handleGetQuotes} disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
          {loading ? t("b2bTrade.querying") : t("b2bTrade.getQuotes")}
        </button>
      </div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <p className="text-xs text-muted-foreground">Cheapest</p>
              <p className="font-semibold text-foreground">{result.cheapest?.forwarder}</p>
              <p className="text-primary">${result.cheapest?.cost} · {result.cheapest?.transit_time} days</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <p className="text-xs text-muted-foreground">Fastest</p>
              <p className="font-semibold text-foreground">{result.fastest?.forwarder}</p>
              <p className="text-primary">{result.fastest?.transit_time} days · ${result.fastest?.cost}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <p className="text-xs text-muted-foreground">Best value (cost/day)</p>
              <p className="font-semibold text-foreground">{result.best_value?.forwarder}</p>
              <p className="text-primary">${result.best_value?.cost_per_day}/day · ${result.best_value?.cost}</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-2 font-medium text-muted-foreground">Forwarder</th>
                  <th className="p-2 font-medium text-muted-foreground">Cost</th>
                  <th className="p-2 font-medium text-muted-foreground">Transit (days)</th>
                  <th className="p-2 font-medium text-muted-foreground">Reliability</th>
                  <th className="p-2 font-medium text-muted-foreground">Cost/day</th>
                </tr>
              </thead>
              <tbody>
                {result.all_quotes?.map((q, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-2 font-medium">{q.forwarder}</td>
                    <td className="p-2">${q.cost}</td>
                    <td className="p-2">{q.transit_time}</td>
                    <td className="p-2">{q.reliability}%</td>
                    <td className="p-2">${q.cost_per_day}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function HsCodeClassifySection() {
  const { t } = useLanguage();
  const [productDesc, setProductDesc] = useState("Solar panel 300W photovoltaic module");
  const [country, setCountry] = useState("US");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClassify = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.get("/b2b/classify-hs-code", {
        params: { product: productDesc || "", country: country || "" },
      });
      setResult(data);
    } catch (e) {
      setError(e.message || t("b2bTrade.hsCodeError"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title={t("b2bTrade.hsCodeTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("b2bTrade.hsCodeDesc")}
      </p>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="min-w-[280px] flex-1">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.productDesc")}</label>
          <input
            type="text"
            value={productDesc}
            onChange={(e) => setProductDesc(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleClassify()}
            placeholder="e.g. Solar panel 300W photovoltaic module"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[80px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.destCountry")}</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="US"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleClassify}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? t("b2bTrade.classifying") : t("b2bTrade.hsRecommend")}
        </button>
      </div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {result && (
        <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm space-y-3">
          <div className="flex flex-wrap items-baseline gap-4">
            <span className="font-mono text-lg font-bold text-primary">{result.hs_code}</span>
            <span className="text-muted-foreground">Confidence: {result.confidence}%</span>
          </div>
          <p className="text-foreground">{result.description}</p>
          {result.alternatives?.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">Alternative codes</p>
              <ul className="space-y-1">
                {result.alternatives.map((alt, i) => (
                  <li key={i} className="font-mono text-muted-foreground">{alt.code} — {alt.description}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-muted-foreground">
            Tariff (KR → {country}): <strong>{result.tariff_rate?.rate}%</strong>
            {result.tariff_rate?.note && <span className="block text-xs mt-1">{result.tariff_rate.note}</span>}
          </p>
        </div>
      )}
    </SectionCard>
  );
}

function CommercialInvoiceSection() {
  const { t } = useLanguage();
  const [buyerName, setBuyerName] = useState("ABC Trading Co.");
  const [buyerAddress, setBuyerAddress] = useState("Berlin, Germany");
  const [buyerContact, setBuyerContact] = useState("procurement@abc-trading.de");
  const [items, setItems] = useState([{ name: "Solar Panel 300W", hs_code: "8541", qty: 500, price: 120 }]);
  const [paymentTerms, setPaymentTerms] = useState("T/T 30 days");
  const [incoterms, setIncoterms] = useState("CIF");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const payload = {
        id: "001",
        buyer: { company_name: buyerName, full_address: buyerAddress, contact_person: buyerContact },
        items: items.map((i) => ({ name: i.name || "Item", hs_code: i.hs_code || "", qty: Number(i.qty) || 0, price: Number(i.price) || 0 })),
        payment_terms: paymentTerms,
        incoterms: incoterms,
      };
      const { data } = await api.post("/b2b/generate-commercial-invoice", payload);
      if (data.error) {
        setError(data.error);
        setResult(null);
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(e.message || t("b2bTrade.invoiceError"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => setItems((prev) => [...prev, { name: "", hs_code: "", qty: 0, price: 0 }]);
  const updateItem = (i, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  return (
    <SectionCard title={t("b2bTrade.invoiceTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("b2bTrade.invoiceDesc")}
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">Buyer</label>
          <input
            type="text"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            placeholder="Company name"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm"
          />
          <input
            type="text"
            value={buyerAddress}
            onChange={(e) => setBuyerAddress(e.target.value)}
            placeholder="Address"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm"
          />
          <input
            type="text"
            value={buyerContact}
            onChange={(e) => setBuyerContact(e.target.value)}
            placeholder="Contact"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">Terms</label>
          <input
            type="text"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            placeholder="Payment terms"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm"
          />
          <input
            type="text"
            value={incoterms}
            onChange={(e) => setIncoterms(e.target.value)}
            placeholder="Incoterms"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm"
          />
        </div>
      </div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-muted-foreground">Items</label>
          <button type="button" onClick={addItem} className="text-xs text-primary hover:underline">+ Add row</button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-2 text-left font-medium text-muted-foreground">Description</th>
                <th className="p-2 text-left font-medium text-muted-foreground">HS</th>
                <th className="p-2 text-left font-medium text-muted-foreground">Qty</th>
                <th className="p-2 text-left font-medium text-muted-foreground">Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="p-2"><input type="text" value={row.name} onChange={(e) => updateItem(i, "name", e.target.value)} className="w-full bg-transparent border-0 rounded px-1 py-0.5" placeholder="Item name" /></td>
                  <td className="p-2"><input type="text" value={row.hs_code} onChange={(e) => updateItem(i, "hs_code", e.target.value)} className="w-20 bg-transparent border-0 rounded px-1 py-0.5" placeholder="8541" /></td>
                  <td className="p-2"><input type="number" value={row.qty || ""} onChange={(e) => updateItem(i, "qty", Number(e.target.value) || 0)} className="w-16 bg-transparent border-0 rounded px-1 py-0.5" /></td>
                  <td className="p-2"><input type="number" value={row.price || ""} onChange={(e) => updateItem(i, "price", Number(e.target.value) || 0)} className="w-20 bg-transparent border-0 rounded px-1 py-0.5" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? t("b2bTrade.generating") : t("b2bTrade.generateInvoice")}
      </button>
      {error && <p className="text-sm text-destructive mt-3">{error}</p>}
      {result && (
        <div className="mt-4 space-y-4 rounded-lg border border-border bg-muted/20 p-4 text-sm">
          <div>
            <p className="font-mono text-primary">{result.data?.invoice_no}</p>
            <p className="text-muted-foreground">{result.data?.date} · {result.data?.payment_terms} · {result.data?.incoterms}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-muted-foreground">Buyer</p><p className="font-medium">{result.data?.buyer?.name}</p><p className="text-muted-foreground text-xs">{result.data?.buyer?.address}</p></div>
            <div><p className="text-muted-foreground">Seller</p><p className="font-medium">{result.data?.seller?.name}</p><p className="text-muted-foreground text-xs">{result.data?.seller?.address}</p></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border"><th className="p-2 text-left">Description</th><th className="p-2 text-left">HS</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Price</th><th className="p-2 text-right">Total</th></tr></thead>
              <tbody>
                {result.data?.items?.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-2">{row.description}</td>
                    <td className="p-2">{row.hs_code}</td>
                    <td className="p-2 text-right">{row.quantity}</td>
                    <td className="p-2 text-right">${row.unit_price}</td>
                    <td className="p-2 text-right">${row.total?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted-foreground">Subtotal: ${result.data?.subtotal?.toLocaleString()} · Shipping: ${result.data?.shipping} · Insurance: ${result.data?.insurance} · <strong>Total: ${result.data?.total?.toLocaleString()}</strong></p>
          <div>
            <p className="text-muted-foreground mb-1">{t("b2bTrade.multilingualFile")}</p>
            <ul className="flex flex-wrap gap-2">
              {result.documents && Object.entries(result.documents).map(([lang, doc]) => (
                <li key={lang} className="px-2 py-1 rounded bg-muted text-muted-foreground font-mono text-xs">{doc.filename}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function TenderChecklistSection() {
  const { t } = useLanguage();
  const [tenderTitle, setTenderTitle] = useState("Solar Panel Procurement - Tanzania");
  const [deadline, setDeadline] = useState("2026-03-15");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setError(null);
    setData(null);
    setLoading(true);
    try {
      const { data: res } = await api.get("/b2b/tender-checklist", {
        params: { tender: tenderTitle || undefined, deadline: deadline || undefined },
      });
      setData(res);
    } catch (e) {
      setError(e.message || t("b2bTrade.checklistError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title={t("b2bTrade.checklistTitle")} className="mb-6">
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="min-w-[240px] flex-1">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.tenderTitle")}</label>
          <input
            type="text"
            value={tenderTitle}
            onChange={(e) => setTenderTitle(e.target.value)}
            placeholder="Solar Panel Procurement - Tanzania"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[120px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.deadline")}</label>
          <input
            type="text"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder="2026-03-15"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? t("b2bTrade.generating") : t("b2bTrade.generateChecklist")}
        </button>
      </div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {data && (
        <div className="space-y-5 rounded-lg border border-border bg-muted/20 p-5 text-sm">
          <div>
            <h3 className="text-lg font-bold text-foreground">Tender: {data.tenderTitle}</h3>
            <p className="text-muted-foreground">{t("b2bTrade.requiredDocs").replace("{deadline}", data.deadline || "")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <p className="font-medium text-primary mb-2">✅ {t("b2bTrade.autoReady")}</p>
              <ul className="space-y-1">
                {data.documents?.auto_ready?.map((d, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-primary">[x]</span> {d.label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
              <p className="font-medium text-accent mb-2">⚠️ {t("b2bTrade.userConfirm")}</p>
              <ul className="space-y-1">
                {data.documents?.user_confirm?.map((d, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span>[ ]</span> {d.label}{d.note ? ` (${d.note})` : ""}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-muted border border-border">
              <p className="font-medium text-destructive mb-2">❌ {t("b2bTrade.expertRequired")}</p>
              <ul className="space-y-1 text-muted-foreground">
                {data.documents?.expert_required?.map((d, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span>[ ]</span> {d.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <h4 className="font-semibold text-foreground mb-2">{t("b2bTrade.aiSummaryTitle")}</h4>
            <p className="text-muted-foreground">{t("b2bTrade.bidScore")}: {data.ai_summary?.score}/100 · {t("b2bTrade.expectedCompetitors")}: {data.ai_summary?.competitors_range} · {t("b2bTrade.winRatePredict")}: {data.ai_summary?.win_rate_percent}%</p>
            <p className="text-muted-foreground mt-2">{t("b2bTrade.evEv")}: {t("b2bTrade.contractAmount")} {data.ai_summary?.contract_amount} · {t("b2bTrade.prepCost")} {data.ai_summary?.prep_cost} · EV: {data.ai_summary?.ev_formula}</p>
            <p className="text-primary font-medium mt-2">{t("b2bTrade.aiRecommendation")}: ✅ {data.ai_summary?.recommendation}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("b2bTrade.riskFactorsTitle")}</h4>
            <ul className="text-muted-foreground space-y-1 mb-2">
              {data.risks?.map((r, i) => (
                <li key={i}>⚠️ {r.text}</li>
              ))}
            </ul>
            <p className="text-foreground text-xs mb-1">{t("b2bTrade.mitigationStrategy")}:</p>
            <ul className="text-muted-foreground text-xs">
              {data.mitigation?.map((m, i) => (
                <li key={i}>- {m}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function TradeDocumentSection() {
  const { t } = useLanguage();
  const categories = [
    {
      title: t("b2bTrade.exportDocs"),
      items: [
        "Commercial Invoice",
        "Packing List",
        "Bill of Lading (B/L)",
        t("b2bTrade.certificateOrigin"),
        "Insurance Certificate",
      ],
    },
    {
      title: t("b2bTrade.certificates"),
      items: [
        t("b2bTrade.isoSummary"),
        t("b2bTrade.ceDeclaration"),
        t("b2bTrade.testReport"),
      ],
    },
    {
      title: t("b2bTrade.financialDocs"),
      items: [
        "Proforma Invoice",
        t("b2bTrade.lcDraft"),
        "Payment Receipt",
      ],
    },
  ];
  return (
    <SectionCard title={t("b2bTrade.tradeDocTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("b2bTrade.tradeDocDesc")}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map(({ title, items }) => (
          <div key={title} className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="font-medium text-foreground mb-2">{title}</div>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function TenderEvaluationSection() {
  const { t } = useLanguage();
  const [budget, setBudget] = useState("100000");
  const [quantity, setQuantity] = useState("500");
  const [country, setCountry] = useState("US");
  const [delivery, setDelivery] = useState("CIF");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEvaluate = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.post("/b2b/evaluate-tender", {
        budget: Number(budget) || 100000,
        quantity: Number(quantity) || 500,
        country: country || "US",
        delivery_terms: delivery || "CIF",
      });
      setResult(data);
    } catch (e) {
      setError(e.message || t("b2bTrade.evaluateError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title={t("b2bTrade.evaluateTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("b2bTrade.evaluateDesc")}
      </p>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="min-w-[100px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.budgetUsd")}</label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            min={1000}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[80px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.quantity")}</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min={1}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[80px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.country")}</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="US"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[80px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.incoterm")}</label>
          <input
            type="text"
            value={delivery}
            onChange={(e) => setDelivery(e.target.value)}
            placeholder="CIF"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleEvaluate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? t("b2bTrade.evaluating") : t("b2bTrade.evaluateTender")}
        </button>
      </div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {result && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xl font-bold text-foreground">{t("b2bTrade.totalScore")}: {result.total_score}</span>
            <span className={`px-3 py-1 rounded font-medium ${result.recommendation === "BID" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>
              {result.recommendation}
            </span>
            <span className="text-muted-foreground">{t("b2bTrade.winProbability")}: {(result.estimated_win_probability * 100).toFixed(1)}%</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <span className="text-muted-foreground">{t("b2bTrade.feasibility")}: {result.breakdown?.feasibility}/40</span>
            <span className="text-muted-foreground">{t("b2bTrade.profitability")}: {result.breakdown?.profitability}/30</span>
            <span className="text-muted-foreground">{t("b2bTrade.competition")}: {result.breakdown?.competition}/15</span>
            <span className="text-muted-foreground">{t("b2bTrade.risk")}: {result.breakdown?.risk}/15</span>
          </div>
          {result.key_risks?.length > 0 && (
            <p className="text-muted-foreground">{t("b2bTrade.keyRisks")}: {result.key_risks.join(", ")}</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function BuyerProfileSection() {
  const { t } = useLanguage();
  const [buyerId, setBuyerId] = useState("");
  const [companyName, setCompanyName] = useState("ABC");
  const [country, setCountry] = useState("DE");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetch = async () => {
    setError(null);
    setProfile(null);
    setLoading(true);
    try {
      const { data } = await api.get("/b2b/buyer-profile", {
        params: {
          id: buyerId || undefined,
          name: companyName || undefined,
          country: country || undefined,
        },
      });
      setProfile(data);
    } catch (e) {
      setError(e.message || t("b2bTrade.profileError"));
    } finally {
      setLoading(false);
    }
  };

  const stars = (n) => (n >= 85 ? "⭐⭐⭐⭐⭐" : n >= 70 ? "⭐⭐⭐⭐" : n >= 55 ? "⭐⭐⭐" : "⭐⭐");

  return (
    <SectionCard title={t("b2bTrade.buyerProfileTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("b2bTrade.buyerProfileDesc")}
      </p>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="min-w-[120px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.buyerId")}</label>
          <input
            type="text"
            value={buyerId}
            onChange={(e) => setBuyerId(e.target.value)}
            placeholder={t("b2bTrade.buyerSelectPlaceholder")}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.companyName")}</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="ABC Trading"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[80px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.country")}</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="DE"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleFetch}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? t("b2bTrade.querying") : t("b2bTrade.queryProfile")}
        </button>
      </div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {profile && (
        <div className="space-y-6 text-sm rounded-lg border border-border bg-muted/20 p-5">
          <div>
            <h3 className="text-lg font-bold text-foreground"># Buyer Profile: {profile.companyName}</h3>
            <div className="mt-2 text-muted-foreground space-y-1">
            <p>{t("b2bTrade.companyNameLabel")}: {profile.companyName} · {t("b2bTrade.countryLabel")}: {profile.country} {profile.countryEmoji}</p>
            <p>{t("b2bTrade.foundedLabel")}: {profile.founded} ({t("b2bTrade.yearsActiveLabel")} {profile.yearsActive}{t("common.years")}) · {t("b2bTrade.employeesLabel")}: {profile.employees} · {t("b2bTrade.websiteLabel")}: {profile.website}</p>
              {profile.paymentSuggestion && (
                <p className="text-primary text-xs mt-1">💳 {profile.paymentSuggestion}</p>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("b2bTrade.purchasePatternTitle")}</h4>
            <p className="text-muted-foreground">{t("b2bTrade.mainImportsLabel")}:</p>
            <ul className="list-decimal list-inside text-muted-foreground">
              {profile.purchasePattern?.mainImports?.map((m, i) => (
                <li key={i}>{m.name} (HS: {m.hs}) - {m.percent}%</li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-2">{t("b2bTrade.annualImportUsd")}: {profile.purchasePattern?.annualImportUsd} · {t("b2bTrade.avgOrderSize")}: {profile.purchasePattern?.avgOrderSize} · {t("b2bTrade.orderFrequency")}: {profile.purchasePattern?.orderFrequency}</p>
            <p className="text-muted-foreground">{t("b2bTrade.mainSupplyCountries")}: {profile.purchasePattern?.mainSupplyCountries?.map((s) => `${s.country} ${s.emoji} ${s.percent}%`).join(", ")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 p-3 rounded-lg bg-pillar2/10 border border-pillar2/30">
            <span className="font-bold text-foreground">{t("b2bTrade.matchScoreLabel")}: {profile.matchScore}/100 {stars(profile.matchScore)}</span>
            <span className="text-muted-foreground">{t("b2bTrade.scoreProductFit")} {profile.scoreBreakdown?.productFit}/35 · {t("b2bTrade.scoreVolume")} {profile.scoreBreakdown?.volume}/25 · {t("b2bTrade.scoreReputation")} {profile.scoreBreakdown?.reputation}/20 · {t("b2bTrade.scoreLogistics")} {profile.scoreBreakdown?.logistics}/10 · {t("b2bTrade.scoreResponseRate")} {profile.scoreBreakdown?.responseRate}/10</span>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("b2bTrade.aiStrategyTitle")}</h4>
            <p className="text-muted-foreground mb-1">{t("b2bTrade.strategyApproach")}: {profile.strategy?.approach?.join(" · ")}</p>
            <p className="text-muted-foreground mb-1">{t("b2bTrade.proposalPoints")}: {profile.strategy?.proposalPoints?.map((p) => (p.type === "do" ? "✅ " : "⚠️ ") + p.text).join(" · ")}</p>
            <p className="text-muted-foreground">{t("b2bTrade.expectedSuccessRate")}: {profile.strategy?.expectedSuccessRate} — {profile.strategy?.rationale?.join("; ")}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("b2bTrade.autoEmailTitle")}</h4>
            <p className="text-muted-foreground font-medium">Subject: {profile.emailDraft?.subject}</p>
            <pre className="mt-2 p-3 rounded-lg bg-muted/50 border border-border whitespace-pre-wrap text-muted-foreground text-xs">{profile.emailDraft?.body}</pre>
            <p className="text-xs text-primary mt-1">{profile.emailDraft?.trackingNote}</p>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function TenderRfqSection() {
  const { t } = useLanguage();
  const global = [
    "UNGM (UN Global Marketplace)",
    "World Bank Procurement",
    "ADB (Asian Development Bank)",
    "AfDB (African Development Bank)",
  ];
  const regional = [
    { region: t("common.europe"), items: ["TED (Tenders Electronic Daily)"] },
    { region: t("common.usa"), items: ["SAM.gov", "FedBizOpps"] },
    { region: t("common.middleEast"), items: ["GCC Procurement Portal"] },
    { region: t("common.asia"), items: [t("b2bTrade.kotraTender"), "JETRO"] },
  ];
  return (
    <SectionCard title={t("b2bTrade.tenderRfqTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("b2bTrade.tenderRfqIntro")}
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-foreground mb-2">{t("common.global")}</h4>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            {global.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-2">{t("b2bTrade.byRegion")}</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            {regional.map(({ region, items }) => (
              <li key={region}>
                <span className="text-foreground">{region}:</span> {items.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 p-3 rounded-lg border border-border bg-muted/20 text-sm text-muted-foreground">
        {t("b2bTrade.tenderRfqIntro")}
      </div>
    </SectionCard>
  );
}

function BuyerMatchingSection() {
  const { t } = useLanguage();
  const [product, setProduct] = useState("8504");
  const [countries, setCountries] = useState("US,DE,JP,VN");
  const [regions, setRegions] = useState("");
  const [sector, setSector] = useState("");
  const [minScore, setMinScore] = useState("70");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({ sectors: [], regions: [] });

  useEffect(() => {
    api
      .get("/b2b/options")
      .then((r) => setOptions({ sectors: r.data?.sectors ?? [], regions: r.data?.regions ?? [] }))
      .catch((e) => setError(getApiErrorMessage(e, t("b2bTrade.matchError"))));
  }, []);

  const handleMatch = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const params = {
        product: product || "8504",
        countries: countries.trim() || undefined,
        regions: regions.trim() || undefined,
        sector: sector || undefined,
        min_score: minScore || "70",
      };
      const { data } = await api.get("/b2b/match-buyers", { params });
      setResult(data);
    } catch (e) {
      setError(e.message || t("b2bTrade.matchBuyersFail"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title={t("b2bTrade.buyerMatchingTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("b2bTrade.matchingFormulaDesc")}
      </p>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="min-w-[100px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.hsCodeTitle")}</label>
          <input
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder={t("b2bTrade.hsCodeTitle")}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[120px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.proposalSector")}</label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t("common.all")}</option>
            {(options.sectors || []).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.targetCountriesComma")}</label>
          <input
            type="text"
            value={countries}
            onChange={(e) => setCountries(e.target.value)}
            placeholder="US,DE,JP"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.regionFallback")}</label>
          <input
            type="text"
            value={regions}
            onChange={(e) => setRegions(e.target.value)}
            placeholder="Middle East,Europe"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[80px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.totalScore")}</label>
          <input
            type="number"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            min={0}
            max={100}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleMatch}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? t("common.loading") : t("b2bTrade.matchBuyers")}
        </button>
      </div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {result && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("b2bTrade.leadProduct")}: {result.product} · min_score: {result.min_score}{result.sector ? ` · ${t("b2bTrade.proposalSector")}: ${result.sector}` : ""}
            {result.real_buyer_count > 0 ? (
              <> · <span className="text-primary">{t("b2bTrade.realData")} {result.real_buyer_count}{t("common.items")}</span> + {t("common.recommendation")} {Math.max(0, (result.buyers?.length ?? 0) - result.real_buyer_count)}{t("common.items")}</>
            ) : (
              <> · {t("b2bTrade.buyerMatchingTitle")} {result.buyers?.length ?? 0}{t("common.people")}</>
            )}
          </p>
          {result.real_buyer_count > 0 && (
            <Link to="/market-intel" className="inline-flex items-center gap-2 text-xs text-primary hover:underline">
              <ExternalLink className="w-3.5 h-3.5" />
              {t("b2bTrade.viewMoreInMarketIntel")}
            </Link>
          )}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-2 font-medium text-muted-foreground">#</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("b2bTrade.buyerProfileTitle")}</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("b2bTrade.country")}</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("b2bTrade.region")}</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("b2bTrade.budgetUsd")}</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("b2bTrade.totalScore")}</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("common.detail")}</th>
                </tr>
              </thead>
              <tbody>
                {result.buyers?.map((b, i) => (
                  <tr key={b.id} className="border-b border-border/50">
                    <td className="p-2 font-mono">{i + 1}</td>
                    <td className="p-2">{b.name}</td>
                    <td className="p-2">{b.country}</td>
                    <td className="p-2 text-muted-foreground">{b.region ?? "—"}</td>
                    <td className="p-2 font-mono">${b.annual_imports?.toLocaleString()}</td>
                    <td className="p-2 font-mono text-primary">{b.match_score}</td>
                    <td className="p-2 text-xs text-muted-foreground">
                      P{b.score_breakdown?.product_match} V{b.score_breakdown?.volume} R{b.score_breakdown?.reputation} G{b.score_breakdown?.geo} Resp{b.score_breakdown?.response_prob} S{b.score_breakdown?.sector_fit ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function CustomerInsightReportSection() {
  const { language, t } = useLanguage();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setError(null);
    setReport(null);
    setLoading(true);
    try {
      const { data } = await api.get("/b2b/customer-insight-report", {
        params: { lang: language || "ko" },
      });
      setReport(data);
    } catch (e) {
      setError(e.message || t("common.reportError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title={t("b2bTrade.customerInsightReportTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("b2bTrade.insightReportIntro")}
      </p>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 mb-4"
      >
        {loading ? t("common.generating") : t("b2bTrade.generateMonthlyReport")}
      </button>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {report && (
        <div className="space-y-6 text-sm">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="text-muted-foreground">{t("b2bTrade.asOf")}: {report.generatedAt}</span>
            <span className="font-mono text-primary">{report.period}</span>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">1. {t("b2bTrade.autoTrackingTitle")}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.segments?.map((seg) => (
                <div key={seg.id} className="p-4 rounded-lg border border-border bg-muted/20">
                  <div className="font-medium text-foreground">
                    Segment {seg.id}: &quot;{seg.name}&quot; ({seg.percent}%)
                  </div>
                  <div className="mt-2 text-muted-foreground space-y-1">
                    {seg.characteristics?.map((c, i) => (
                      <div key={i}>· {c.label}: {c.value}</div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <span className="text-foreground">{t("b2bTrade.tradeScoreReviewLabel")}:</span>
                    {seg.actions?.map((a, i) => (
                      <div key={i} className={a.type === "do" ? "text-primary" : "text-accent"}>
                        {a.type === "do" ? "✅" : "⚠️"} {a.text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">2. {t("b2bTrade.buyingJourneyAnalysis")}</h4>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1 mb-3">
              {report.journey?.steps?.map((s) => (
                <li key={s.order}>{s.step} {s.detail ? `(${s.detail})` : ""}</li>
              ))}
            </ol>
            <div className="p-3 rounded-lg border border-border bg-muted/20">
              <div className="text-accent font-medium">{t("b2bTrade.bottleneck")}: {report.journey?.bottleneck?.description} ({report.journey?.bottleneck?.rate})</div>
              <div className="text-muted-foreground mt-1">{t("b2bTrade.causeLabel")}: {report.journey?.bottleneck?.causes?.join(", ")}</div>
              <div className="mt-2 text-primary">{t("b2bTrade.solutionLabel")}: {report.journey?.bottleneck?.solutions?.map((s) => `✅ ${s}`).join(" ")}</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">3. {t("b2bTrade.highRiskCustomersLabel")}</h4>
            <div className="p-4 rounded-lg border border-border bg-muted/20">
              <p className="text-foreground">
                {t("b2bTrade.highRiskCustomersLabel")}: <strong>{report.churn?.highRiskCount}</strong> · {t("b2bTrade.estimatedLoss")}: <strong>{report.churn?.estimatedLoss}</strong>
              </p>
              <p className="text-muted-foreground mt-2">{t("b2bTrade.churnSignals")}:</p>
              <ul className="list-disc list-inside text-muted-foreground">
                {report.churn?.signals?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
              <p className="text-foreground mt-2">{t("b2bTrade.autoIntervention")}:</p>
              <ul className="list-inside text-primary">
                {report.churn?.interventions?.map((s, i) => (
                  <li key={i}>✅ {s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function BrandMonitoringSection() {
  const { t } = useLanguage();
  return (
    <SectionCard title={t("b2bTrade.brandMonitoringTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("b2bTrade.brandMonitoringDesc")}
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground">{t("b2bTrade.trackingObjects")}</h4>
          <ul className="text-sm text-muted-foreground list-disc list-inside">
            <li>{t("b2bTrade.trackingBrandMentions")}</li>
            <li>{t("b2bTrade.trackingExecutiveNames")}</li>
            <li>{t("b2bTrade.trackingKeyProducts")}</li>
            <li>{t("b2bTrade.trackingCompetitorComparison")}</li>
          </ul>
          <h4 className="font-semibold text-foreground mt-4">{t("b2bTrade.sentimentAnalysis")}</h4>
          <p className="text-sm text-muted-foreground">{t("b2bTrade.positive")} 68% · {t("b2bTrade.neutral")} 22% · {t("b2bTrade.negative")} 10%</p>
          <div className="p-3 rounded-lg border border-accent/30 bg-accent/10 text-sm">
            <p className="text-foreground font-medium">{t("b2bTrade.negativeMentionAlert")}</p>
            <p className="text-muted-foreground mt-1">&quot;Your customer service is terrible&quot;</p>
            <p className="text-muted-foreground">{t("b2bTrade.platform")}: Twitter · {t("b2bTrade.influence")}: 4,500 {t("common.followers")}</p>
            <p className="text-primary mt-1">{t("b2bTrade.aiRecommendation")}: {t("b2bTrade.respondIn1Hour")} · {t("b2bTrade.draft")}: [{t("b2bTrade.autoApologyDraft")}]</p>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground">{t("b2bTrade.pressTracking")}</h4>
          <ul className="text-sm text-muted-foreground list-disc list-inside">
            <li>{t("b2bTrade.trackingPressSources")}</li>
          </ul>
          <p className="text-sm text-foreground mt-2">{t("b2bTrade.alertLabel")}: ✅ {t("b2bTrade.positive")} → {t("b2bTrade.socialSharing")} · ⚠️ {t("b2bTrade.negative")} → {t("b2bTrade.prTeamImmediate")} · 📊 {t("b2bTrade.neutral")} → {t("b2bTrade.weeklyReport")}</p>
          <p className="text-sm text-muted-foreground">{t("b2bTrade.mediaValue")}: {t("b2bTrade.mediaValueDescription")}</p>
        </div>
      </div>
    </SectionCard>
  );
}

function BuyerHunterSection() {
  const { t } = useLanguage();
  const sources = [
    { title: `1. ${t("b2bTrade.tabBuyerMatching")}`, items: ["Alibaba (API)", "Global Sources", "Made-in-China", "TradeKey", "EC21"] },
    { title: `2. ${t("b2bTrade.indexTradeBalance")}`, items: ["UN Comtrade", "Panjiva", "ImportGenius"] },
    { title: `3. ${t("b2bTrade.buyerProfileTitle")}`, items: ["Kompass", "Europages", "ThomasNet"] },
    { title: `4. ${t("b2bTrade.tabTenderRfq")}`, items: [t("b2bTrade.participantScraping"), t("common.kotraInfo")] },
  ];
  return (
    <SectionCard title={t("b2bTrade.buyerHunterTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("b2bTrade.buyerHunterIntro")}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sources.map(({ title, items }) => (
          <div key={title} className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="font-medium text-foreground mb-2">{title}</div>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function IndexViewerSection() {
  const { t } = useLanguage();
  const [country, setCountry] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthError, setIsAuthError] = useState(false);

  const loadIndices = (countryParam) => {
    setError(null);
    setIsAuthError(false);
    setLoading(true);
    api
      .get("/b2b/indices", { params: countryParam ? { country: countryParam } : {} })
      .then((r) => setData(r.data))
      .catch((e) => {
        const is401 = e?.response?.status === 401;
        setIsAuthError(is401);
        setError(is401 ? t("b2bTrade.authExpired") : (e?.response?.data?.message || e?.message || t("b2bTrade.indexError")));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadIndices("");
  }, []);

  const handleRefresh = () => loadIndices(country.trim() || undefined);
  const trendBadge = (trend) => {
    if (trend === "expansion") return <span className="text-primary font-medium">↑ {t("b2bTrade.expansion")}</span>;
    if (trend === "contraction") return <span className="text-destructive font-medium">↓ {t("b2bTrade.contraction")}</span>;
    return <span className="text-muted-foreground">→ {t("b2bTrade.steady")}</span>;
  };
  const changeBadge = (pct) => {
    const n = Number(pct);
    if (n > 0) return <span className="text-primary text-sm">+{n}%</span>;
    if (n < 0) return <span className="text-destructive text-sm">{n}%</span>;
    return <span className="text-muted-foreground text-sm">0%</span>;
  };

  return (
    <SectionCard title={t("b2bTrade.indexViewerTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("b2bTrade.indexViewerDesc")}
      </p>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="min-w-[120px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.indexCountryFilter")}</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder={t("b2bTrade.indexCountryFilterPlaceholder")}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 mt-6"
        >
          <TrendingUp className="w-4 h-4" />
          {loading ? t("b2bTrade.loading") : t("b2bTrade.indexRefresh")}
        </button>
      </div>
      {error && (
        <p className="text-sm text-destructive mb-4">
          {error}
          {isAuthError && (
            <Link to="/login" className="ml-2 inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400 hover:underline">
              <ExternalLink className="w-3.5 h-3.5" />
              {t("b2bTrade.reLogin")}
            </Link>
          )}
        </p>
      )}
      {data && (
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground">{t("b2bTrade.asOf")}: {data.as_of}</p>

          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-pillar2" />
              {t("b2bTrade.indexPmi")}
            </h4>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-2 font-medium text-muted-foreground">{t("b2bTrade.country")}</th>
                    <th className="p-2 font-medium text-muted-foreground">{t("b2bTrade.indexManufacturing")}</th>
                    <th className="p-2 font-medium text-muted-foreground">{t("b2bTrade.indexServices")}</th>
                    <th className="p-2 font-medium text-muted-foreground">{t("b2bTrade.indexTrend")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.pmi || []).map((p) => (
                    <tr key={p.country_code} className="border-b border-border/50">
                      <td className="p-2">{p.country_name}</td>
                      <td className="p-2 font-mono">{p.manufacturing}</td>
                      <td className="p-2 font-mono">{p.services}</td>
                      <td className="p-2">{trendBadge(p.trend)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-pillar2" />
              {t("b2bTrade.indexFreight")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(data.freight || []).map((f) => (
                <div key={f.id} className="p-3 rounded-lg border border-border bg-muted/20">
                  <div className="font-medium text-foreground">{f.name}</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-mono text-primary">{f.value}</span>
                    <span className="text-muted-foreground text-xs">{f.unit}</span>
                    {changeBadge(f.change_pct)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-pillar2" />
              {t("b2bTrade.indexCommodity")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(data.commodity || []).map((c) => (
                <div key={c.id} className="p-3 rounded-lg border border-border bg-muted/20">
                  <div className="font-medium text-foreground">{c.name}</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-primary">{c.value}</span>
                    <span className="text-muted-foreground text-xs">{c.unit}</span>
                    {changeBadge(c.change_pct)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{c.sector_hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-pillar2" />
              {t("b2bTrade.indexEconomic")}
            </h4>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-2 font-medium text-muted-foreground">{t("b2bTrade.country")}</th>
                    <th className="p-2 font-medium text-muted-foreground">GDP YoY %</th>
                    <th className="p-2 font-medium text-muted-foreground">{t("b2bTrade.indexTradeBalance")}</th>
                    <th className="p-2 font-medium text-muted-foreground">{t("b2bTrade.note")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.economic_summary || []).map((e) => (
                    <tr key={e.country_code} className="border-b border-border/50">
                      <td className="p-2">{e.country_name}</td>
                      <td className="p-2 font-mono">{e.gdp_growth_yoy != null ? `${e.gdp_growth_yoy}%` : "—"}</td>
                      <td className="p-2 font-mono">{e.trade_balance_billion != null ? `$${e.trade_balance_billion}B` : "—"}</td>
                      <td className="p-2 text-muted-foreground text-xs">{e.note ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function MarketScoreSection() {
  const { t } = useLanguage();
  const [item, setItem] = useState("");
  const [country, setCountry] = useState("");
  const [hsCode, setHsCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCalculate = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const params = { item: item || "default" };
      if (country.trim()) params.country = country.trim();
      if (hsCode.trim()) params.hs_code = hsCode.trim();
      const { data } = await api.get("/b2b/market-score", { params });
      setResult(data);
    } catch (e) {
      setError(e.message || t("b2bTrade.tradeScoreError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title={t("b2bTrade.marketScoreTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("b2bTrade.marketScoreFormula")}
      </p>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.industryKeywordPlaceholder")}</label>
          <input
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
            placeholder={t("b2bTrade.industryKeywordPlaceholder")}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[100px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.leadCountry")}</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="US"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[80px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.hsCodeTitle")}</label>
          <input
            type="text"
            value={hsCode}
            onChange={(e) => setHsCode(e.target.value)}
            placeholder={t("b2bTrade.hsCodeTitle")}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleCalculate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          <Calculator className="w-4 h-4" />
          {loading ? t("common.calculating") : t("b2bTrade.tradeScoreCalculate")}
        </button>
      </div>
      {error && (
        <p className="text-sm text-destructive mb-4">{error}</p>
      )}
      {result && (
        <div className="space-y-4">
          {result.data_source_note && (
            <p className="text-xs text-primary flex items-center gap-1">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {result.data_source_note}
            </p>
          )}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-pillar2/10 border border-pillar2/30">
            <Target className="w-8 h-8 text-pillar2" />
            <div>
              <span className="text-muted-foreground">{t("b2bTrade.overallScore")} </span>
              <span className="text-3xl font-bold font-mono text-foreground">
                {result.total}
              </span>
              <span className="text-muted-foreground"> / 100</span>
              <span className="ml-2 text-sm text-muted-foreground">({result.item})</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {result.breakdown?.map((b) => (
              <div
                key={b.category}
                className="p-3 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-foreground">{b.category}</span>
                  <span className="text-sm font-mono text-pillar2 shrink-0">
                    {b.score} / {b.maxPoints}
                  </span>
                </div>
                {b.detail && (
                  <p className="text-xs text-muted-foreground mt-1">{b.detail}</p>
                )}
              </div>
            ))}
          </div>
          <Link
            to="/market-intel"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            {t("b2bTrade.viewMoreInMarketIntel")}
          </Link>
        </div>
      )}
    </SectionCard>
  );
}

function TradeMarketScoreSection() {
  const { t } = useLanguage();
  const [origin, setOrigin] = useState("KR");
  const [destination, setDestination] = useState("US");
  const [itemOrHs, setItemOrHs] = useState("8504");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    api
      .get("/markets/countries")
      .then((r) => setCountries(r.data?.countries ?? []))
      .catch((e) => {
        setCountries([]);
        setError(getApiErrorMessage(e, t("b2bTrade.tradeScoreError")));
      });
  }, []);

  const handleCalculate = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.get("/b2b/trade-market-score", {
        params: {
          origin: origin || "KR",
          destination: destination || "US",
          item: (itemOrHs || "").trim() || "8504",
        },
      });
      setResult(data);
    } catch (e) {
      setError(e.message || t("b2bTrade.tradeScoreError"));
    } finally {
      setLoading(false);
    }
  };

  const categoryLabel = (cat) => {
    const map = {
      fta_tariff: t("b2bTrade.tradeScoreFta"),
      demand_fit: t("b2bTrade.tradeScoreDemand"),
      logistics: t("b2bTrade.tradeScoreLogistics"),
      sector_fit: t("b2bTrade.tradeScoreSector"),
      regulation_entry: t("b2bTrade.tradeScoreRegulation"),
    };
    return map[cat] ?? cat;
  };

  return (
    <SectionCard title={t("b2bTrade.tradeMarketScoreTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("b2bTrade.tradeMarketScoreDesc")}
      </p>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.tradeScoreOrigin")}</label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm"
          >
            {(countries.length ? countries : [{ country_code: "KR", name: t("common.korea") }, { country_code: "US", name: t("common.usa") }, { country_code: "DE", name: t("common.germany") }, { country_code: "JP", name: t("common.japan") }, { country_code: "CN", name: t("common.china") }]).map((c) => (
              <option key={c.country_code} value={c.country_code}>{c.name ?? c.country_code}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.tradeScoreDestination")}</label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm"
          >
            {(countries.length ? countries : [{ country_code: "KR", name: t("common.korea") }, { country_code: "US", name: t("common.usa") }, { country_code: "DE", name: t("common.germany") }, { country_code: "JP", name: t("common.japan") }, { country_code: "CN", name: t("common.china") }]).map((c) => (
              <option key={c.country_code} value={c.country_code}>{c.name ?? c.country_code}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.tradeScoreItemHs")}</label>
          <input
            type="text"
            value={itemOrHs}
            onChange={(e) => setItemOrHs(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
            placeholder={t("b2bTrade.hsCodeOrItemPlaceholder")}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleCalculate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          <Calculator className="w-4 h-4" />
          {loading ? t("b2bTrade.loading") : t("b2bTrade.tradeScoreCalculate")}
        </button>
      </div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {result && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-2xl font-bold font-mono text-primary">{result.total_score}</span>
            <span className="text-muted-foreground">/ 100</span>
            <span className="text-sm text-muted-foreground">
              {result.origin_country} → {result.destination_country} · {result.item_or_hs}
              {result.sector ? ` (${result.sector})` : ""}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              result.recommendation === "recommended" ? "bg-primary/20 text-primary" :
              result.recommendation === "cautious" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
            }`}>
              {result.recommendation === "recommended" ? t("b2bTrade.tradeScoreRecYes") : result.recommendation === "cautious" ? t("b2bTrade.tradeScoreRecCautious") : t("b2bTrade.tradeScoreRecNeutral")}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(result.breakdown || []).map((b) => (
              <div key={b.category} className="p-3 rounded-lg border border-border bg-card">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-foreground">{categoryLabel(b.category)}</span>
                  <span className="text-sm font-mono text-pillar2">{b.score} / {b.max_points}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{b.detail}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
            <h4 className="text-sm font-semibold text-foreground mb-1">{t("b2bTrade.tradeScoreReview")}</h4>
            <p className="text-sm text-foreground leading-relaxed">{result.review}</p>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function MarketReportSection() {
  const { language, t } = useLanguage();
  const [productName, setProductName] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setError(null);
    setReport(null);
    setLoading(true);
    try {
      const { data } = await api.get("/b2b/market-report", {
        params: { item: productName || t("b2bTrade.productOrServiceName"), lang: language || "ko" },
      });
      setReport(data);
    } catch (e) {
      setError(e.message || t("common.reportError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title={t("b2bTrade.marketReportTitle")} className="mb-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          placeholder={t("b2bTrade.productOrServiceName")}
          className="flex-1 min-w-[200px] rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          <FileText className="w-4 h-4" />
          {loading ? t("common.generating") : t("common.reportGenerate")}
        </button>
      </div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {report && (
        <div className="rounded-lg border border-border bg-muted/20 p-5 space-y-5 text-sm">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-foreground">{t("b2bTrade.marketEvaluationReport")}: {report.productName}</h3>
              <p className="text-muted-foreground">{t("b2bTrade.asOf")}: {report.generatedAt}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-mono text-pillar2">
                {t("b2bTrade.overallScore")}: {report.totalScore}/100
              </span>
              <span className="text-lg">{report.starRating}</span>
            </div>
          </div>

          <ReportBlock title={`1. ${t("b2bTrade.marketSizeAnalysis")}`}>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>TAM: {report.sections.marketSize.tam} · SAM: {report.sections.marketSize.sam} · SOM: {report.sections.marketSize.som}</li>
              <li>CAGR (2026-2031): {report.sections.marketSize.cagr}</li>
              <li className="flex items-center gap-1">
                {report.sections.marketSize.evaluation.startsWith("✅") ? <CheckCircle className="w-4 h-4 text-primary shrink-0" /> : <AlertTriangle className="w-4 h-4 text-accent shrink-0" />}
                {report.sections.marketSize.evaluation}
              </li>
            </ul>
          </ReportBlock>

          <ReportBlock title={`2. ${t("b2bTrade.competitiveEnv")}`}>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>{t("b2bTrade.mainCompetitors")}: {report.sections.competition.competitors}{t("common.items")} · HHI {report.sections.competition.hhi} ({t("common.moderate")})</li>
              <li>{t("b2bTrade.entryTiming")}: {report.sections.competition.entryTiming}</li>
              <li className="flex items-center gap-1">
                {report.sections.competition.evaluation.startsWith("✅") ? <CheckCircle className="w-4 h-4 text-primary shrink-0" /> : <AlertTriangle className="w-4 h-4 text-accent shrink-0" />}
                {report.sections.competition.evaluation}
              </li>
            </ul>
          </ReportBlock>

          <ReportBlock title={`3. ${t("b2bTrade.profitabilityProspect")}`}>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>{t("b2bTrade.avgMarginLabel")}: {report.sections.profitability.avgMargin}% · CAC: ${report.sections.profitability.cac} · LTV: ${report.sections.profitability.ltv}</li>
              <li>LTV/CAC: {report.sections.profitability.ltvCac}x</li>
              <li className="flex items-center gap-1">
                {report.sections.profitability.evaluation.startsWith("✅") ? <CheckCircle className="w-4 h-4 text-primary shrink-0" /> : <AlertTriangle className="w-4 h-4 text-accent shrink-0" />}
                {report.sections.profitability.evaluation}
              </li>
            </ul>
          </ReportBlock>

          <ReportBlock title={`4. ${t("b2bTrade.trendAnalysis")}`}>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>{t("b2bTrade.googleSearchVolume")}: ↗️ {t("b2bTrade.last12Months")} +{report.sections.trend.searchGrowth}% · {t("common.social")} +{report.sections.trend.socialGrowth}%</li>
              <li>{t("b2bTrade.investmentInflow")}: ${report.sections.trend.investment6m}M ({t("b2bTrade.last6Months")})</li>
              <li className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                {report.sections.trend.evaluation}
              </li>
            </ul>
          </ReportBlock>

          <ReportBlock title={`5. ${t("b2bTrade.riskFactorsLabel")}`}>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {report.sections.risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </ReportBlock>

          <ReportBlock title={t("b2bTrade.aiOpinion")}>
            <div className="space-y-1">
              <p className="font-medium text-foreground">{report.sections.aiRecommendation.verdict.replace(/\*\*/g, "")}</p>
              <p>{t("b2bTrade.recommendedStrategy")}: &quot;{report.sections.aiRecommendation.strategy}&quot;</p>
              <p className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {t("b2bTrade.expectedInvestment")}: {report.sections.aiRecommendation.investmentRange}
              </p>
              <p className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {t("b2bTrade.breakeven")}: {report.sections.aiRecommendation.breakeven}
              </p>
            </div>
          </ReportBlock>
        </div>
      )}
    </SectionCard>
  );
}

function ReportBlock({ title, children }) {
  return (
    <div>
      <h4 className="font-semibold text-foreground mb-1">{title}</h4>
      {children}
    </div>
  );
}

function MarketingStrategySection() {
  const { t } = useLanguage();
  const [product, setProduct] = useState("");
  const [target, setTarget] = useState("B2B");
  const [budget, setBudget] = useState("");
  const [goal, setGoal] = useState("lead");
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setError(null);
    setStrategy(null);
    setLoading(true);
    try {
      const { data } = await api.post("/b2b/marketing-strategy", {
        product: product || t("b2bTrade.productOrServiceName"),
        target,
        budget: budget || t("common.undecided"),
        goal,
      });
      setStrategy(data);
    } catch (e) {
      setError(e.message || t("b2bTrade.strategyError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title={t("b2bTrade.marketingStrategyTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("b2bTrade.marketingStrategyIntro")}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.productDesc")}</label>
          <input
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder={t("b2bTrade.productOrServiceName")}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.destCountry")}</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="B2B">B2B</option>
            <option value="B2C">B2C</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.budgetUsd")}</label>
          <input
            type="text"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder={t("common.budgetPlaceholder")}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.goal")}</label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="awareness">{t("seoContent.awareness")}</option>
            <option value="lead">{t("b2bTrade.leadsTitle")}</option>
            <option value="revenue">{t("seoContent.revenue")}</option>
          </select>
        </div>
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        <Megaphone className="w-4 h-4" />
        {loading ? t("b2bTrade.generatingStrategy") : t("b2bTrade.createStrategy")}
      </button>
      {error && <p className="text-sm text-destructive mt-3">{error}</p>}
      {strategy && (
        <div className="mt-5 p-4 rounded-lg border border-border bg-muted/20 space-y-4">
          <p className="text-foreground">{strategy.summary}</p>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t("b2bTrade.channelAllocation")}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {strategy.channels?.map((ch, i) => (
                <div key={i} className="p-3 rounded-md border border-border bg-card">
                  <div className="font-medium text-foreground">{ch.name}</div>
                  <div className="text-sm text-pillar2">{ch.allocation}</div>
                  <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside">
                    {ch.tactics?.map((tactic, j) => (
                      <li key={j}>{tactic}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-muted-foreground">{t("common.timeline")}:</span>
            <span className="text-foreground">{strategy.timeline}</span>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-muted-foreground">KPI:</span>
            {strategy.kpis?.map((k, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs">
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function IntegratedMarketingSection() {
  const { t } = useLanguage();
  const [product, setProduct] = useState("");
  const [budget, setBudget] = useState("$50,000");
  const [period, setPeriod] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setError(null);
    setData(null);
    setLoading(true);
    try {
      const { data: res } = await api.get("/b2b/integrated-marketing-strategy", {
        params: {
          product: product || t("b2bTrade.productOrServiceName"),
          budget: budget || "$50,000",
          period: period || "3m",
        },
      });
      setData(res);
    } catch (e) {
      setError(e.message || t("b2bTrade.integratedStrategyError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title={t("b2bTrade.integratedMarketingTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("b2bTrade.integratedStrategyIntro")}
      </p>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.productOrServiceName")}</label>
          <input
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder={t("b2bTrade.productOrServiceName")}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[120px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.budgetUsd")}</label>
          <input
            type="text"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="$50,000"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[100px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2bTrade.deadline")}</label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder={t("common.periodPlaceholder")}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          <LayoutList className="w-4 h-4" />
          {loading ? t("common.generating") : t("b2bTrade.createStrategy")}
        </button>
      </div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {data && (
        <div className="rounded-lg border border-border bg-muted/20 p-5 space-y-6 text-sm">
          <div className="border-b border-border pb-3">
            <h3 className="text-lg font-bold text-foreground">{t("b2bTrade.integratedMarketingTitle")}: {data.productName}</h3>
            <p className="text-muted-foreground">
              {t("common.budget")}: {data.budget} | {t("common.period")}: {data.period}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-pillar2" />
              {t("b2bTrade.customerPersonaTitle")}
            </h4>
            <div className="space-y-4">
              {data.personas?.map((p, i) => (
                <div key={i} className="p-4 rounded-lg border border-border bg-card">
                  <div className="font-medium text-foreground mb-2">{p.title}</div>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>{t("common.age")}: {p.age} · {t("common.role")}: {p.role} · {t("common.salary")}: {p.salary}</li>
                    <li><span className="text-foreground">{t("b2bTrade.personaPainPoints")}:</span></li>
                    <ul className="list-disc list-inside ml-2">
                      {p.painPoints?.map((pt, j) => (
                        <li key={j}>{pt}</li>
                      ))}
                    </ul>
                    <li><span className="text-foreground">{t("b2bTrade.infoSource")}:</span> {p.infoSources?.join(", ")}</li>
                    <li><span className="text-foreground">{t("b2bTrade.purchaseTrigger")}:</span> {p.purchaseTriggers?.join(", ")}</li>
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <LayoutList className="w-4 h-4 text-pillar2" />
              {t("b2bTrade.channelStrategyTitle")}
            </h4>
            <div className="space-y-4">
              {data.channelStrategies?.map((ch, i) => (
                <div key={i} className="p-4 rounded-lg border border-border bg-card">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="font-medium text-foreground">
                      {ch.name} ({ch.percent}% - {ch.amount})
                    </span>
                  </div>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5 mb-2">
                    {ch.bullets?.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground whitespace-pre-line mt-2">
                    <span className="text-foreground">{t("common.timeline")}:</span><br />{ch.timeline}
                  </p>
                  {ch.expectedResults?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="text-foreground">{t("b2bTrade.expectedPerformance")}:</span> {ch.expectedResults.join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-pillar2" />
              {t("b2bTrade.kpiTitle")}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4 text-muted-foreground font-medium">Week</th>
                    <th className="py-2 pr-4 text-muted-foreground font-medium">Traffic</th>
                    <th className="py-2 pr-4 text-muted-foreground font-medium">Leads</th>
                    <th className="py-2 pr-4 text-muted-foreground font-medium">Trials</th>
                    <th className="py-2 pr-4 text-muted-foreground font-medium">Customers</th>
                    <th className="py-2 text-muted-foreground font-medium">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {data.kpiMilestones?.map((k, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-mono">{k.week}</td>
                      <td className="py-2 pr-4">{k.traffic}</td>
                      <td className="py-2 pr-4">{k.leads} {t("common.items")}</td>
                      <td className="py-2 pr-4">{k.trials} {t("common.items")}</td>
                      <td className="py-2 pr-4">{k.customers ?? "—"}</td>
                      <td className="py-2">{k.mrr ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-pillar2" />
              {t("b2bTrade.aiAssetsTitle")}
            </h4>
            <ul className="space-y-1">
              {data.aiAssets?.map((asset, i) => (
                <li key={i} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  {asset}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function CustomerInsightEngineSection() {
  const { t } = useLanguage();
  const blocks = [
    {
      title: `1. ${t("b2bTrade.webAnalysis")}`,
      icon: BarChart3,
      items: [
        "Google Analytics 4",
        t("b2bTrade.hotjar"),
        t("b2bTrade.mixpanel"),
      ],
    },
    {
      title: `2. ${t("b2bTrade.crmData")}`,
      icon: Users,
      items: [
        t("b2bTrade.customerLifecycleStage"),
        t("b2bTrade.purchaseHistory"),
        t("b2bTrade.supportTickets"),
      ],
    },
    {
      title: `3. ${t("b2bTrade.socialListening")}`,
      icon: MessageSquare,
      items: [
        t("b2bTrade.brandMentions"),
        t("b2bTrade.sentimentAnalysis"),
        t("b2bTrade.influencerIdentification"),
      ],
    },
    {
      title: `4. ${t("b2bTrade.survey")}`,
      icon: ClipboardList,
      items: [
        t("b2bTrade.aiGeneratedSurvey"),
        t("b2bTrade.npsAutoTracking"),
        t("b2bTrade.openEndedResponseThemeAnalysis"),
      ],
    },
  ];

  return (
    <SectionCard title={t("b2bTrade.customerInsightEngineTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
        <Brain className="w-4 h-4 text-pillar2" />
        {t("b2bTrade.insightEngineDesc")}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {blocks.map(({ title, icon: Icon, items }) => (
          <div
            key={title}
            className="p-4 rounded-lg border border-border bg-muted/30"
          >
            <div className="flex items-center gap-2 font-medium text-foreground mb-2">
              <Icon className="w-4 h-4 text-pillar2" />
              {title}
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
