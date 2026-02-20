import { useState } from "react";
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
} from "lucide-react";
import SectionCard from "../components/SectionCard";
import { api } from "../lib/api";
import { useLanguage } from "../context/LanguageContext.jsx";

const SOURCES = [
  { name: "Google Trends API", descKey: "sourceDescTrends", icon: TrendingUp },
  { name: "Statista API", descKey: "sourceDescStats", icon: BarChart3 },
  { name: "CB Insights", descKey: "sourceDescStartup", icon: Rocket },
  { name: "PitchBook", descKey: "sourceDescMa", icon: Handshake },
  { name: "UN Comtrade", descKey: "sourceDescTrade", icon: Globe },
  { name: "World Bank Open Data", descKey: "sourceDescEconomic", icon: Landmark },
];

export default function B2BTrade() {
  const { t } = useLanguage();
  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t("b2bTrade.pillarTitle")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("b2bTrade.pillarSubtitle")}
        </p>
      </header>

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

      <MarketScoreSection />
      <MarketReportSection />
      <MarketingStrategySection />
      <IntegratedMarketingSection />
      <CustomerInsightEngineSection />
      <CustomerInsightReportSection />
      <BrandMonitoringSection />
      <BuyerHunterSection />
      <BuyerMatchingSection />
      <BuyerProfileSection />
      <TenderRfqSection />
      <TenderEvaluationSection />
      <TenderChecklistSection />
      <TradeDocumentSection />
      <CommercialInvoiceSection />
      <HsCodeClassifySection />
      <ShippingQuotesSection />
      <LandedCostSection />
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
            <h4 className="font-semibold text-foreground mb-2">AI 분석 요약</h4>
            <p className="text-muted-foreground">입찰 점수: {data.ai_summary?.score}/100 · 예상 경쟁사: {data.ai_summary?.competitors_range} · 승률 예측: {data.ai_summary?.win_rate_percent}%</p>
            <p className="text-muted-foreground mt-2">투자 대비 기대값: 계약 금액 {data.ai_summary?.contract_amount} · 준비 비용 {data.ai_summary?.prep_cost} · EV: {data.ai_summary?.ev_formula}</p>
            <p className="text-primary font-medium mt-2">추천: ✅ {data.ai_summary?.recommendation}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">위험 요소</h4>
            <ul className="text-muted-foreground space-y-1 mb-2">
              {data.risks?.map((r, i) => (
                <li key={i}>⚠️ {r.text}</li>
              ))}
            </ul>
            <p className="text-foreground text-xs mb-1">완화 전략:</p>
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
            placeholder="buyer-1 (선택)"
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
              <p>회사명: {profile.companyName} · 국가: {profile.country} {profile.countryEmoji}</p>
              <p>설립: {profile.founded} (업력 {profile.yearsActive}년) · 직원: {profile.employees} · 웹사이트: {profile.website}</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">구매 패턴 (AI 분석)</h4>
            <p className="text-muted-foreground">주요 수입 품목:</p>
            <ul className="list-decimal list-inside text-muted-foreground">
              {profile.purchasePattern?.mainImports?.map((m, i) => (
                <li key={i}>{m.name} (HS: {m.hs}) - {m.percent}%</li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-2">연간 수입액: {profile.purchasePattern?.annualImportUsd} · 평균 오더: {profile.purchasePattern?.avgOrderSize} · 주문 빈도: {profile.purchasePattern?.orderFrequency}</p>
            <p className="text-muted-foreground">주요 공급국: {profile.purchasePattern?.mainSupplyCountries?.map((s) => `${s.country} ${s.emoji} ${s.percent}%`).join(", ")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 p-3 rounded-lg bg-pillar2/10 border border-pillar2/30">
            <span className="font-bold text-foreground">매칭 점수: {profile.matchScore}/100 {stars(profile.matchScore)}</span>
            <span className="text-muted-foreground">제품 {profile.scoreBreakdown?.productFit}/35 · 규모 {profile.scoreBreakdown?.volume}/25 · 신뢰도 {profile.scoreBreakdown?.reputation}/20 · 물류 {profile.scoreBreakdown?.logistics}/10 · 응답률 {profile.scoreBreakdown?.responseRate}/10</span>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">AI 추천 전략</h4>
            <p className="text-muted-foreground mb-1">접근: {profile.strategy?.approach?.join(" · ")}</p>
            <p className="text-muted-foreground mb-1">제안 포인트: {profile.strategy?.proposalPoints?.map((p) => (p.type === "do" ? "✅ " : "⚠️ ") + p.text).join(" · ")}</p>
            <p className="text-muted-foreground">예상 성사율: {profile.strategy?.expectedSuccessRate} — {profile.strategy?.rationale?.join("; ")}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">자동 생성 이메일 (초안)</h4>
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
  const global = [
    "UNGM (UN Global Marketplace)",
    "World Bank Procurement",
    "ADB (Asian Development Bank)",
    "AfDB (African Development Bank)",
  ];
  const regional = [
    { region: "유럽", items: ["TED (Tenders Electronic Daily)"] },
    { region: "미국", items: ["SAM.gov", "FedBizOpps"] },
    { region: "중동", items: ["GCC Procurement Portal"] },
    { region: "아시아", items: ["KOTRA 입찰정보", "JETRO"] },
  ];
  return (
    <SectionCard title="Module 2.2: 입찰 & RFQ 자동화 (6%) — Tender & RFQ Scout" className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        입찰 정보 자동 수집 · 사용자 키워드 + HS코드 필터 · 매일 오전 9시
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-foreground mb-2">글로벌</h4>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            {global.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-2">지역별</h4>
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
        수집 주기: 매일 오전 9시 · 필터링: 사용자 설정 키워드 + HS코드
      </div>
    </SectionCard>
  );
}

function BuyerMatchingSection() {
  const [product, setProduct] = useState("8504");
  const [countries, setCountries] = useState("US,DE,JP,VN");
  const [minScore, setMinScore] = useState("70");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleMatch = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.get("/b2b/match-buyers", {
        params: {
          product: product || "8504",
          countries: countries || undefined,
          min_score: minScore || "70",
        },
      });
      setResult(data);
    } catch (e) {
      setError(e.message || "바이어 매칭 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="바이어 매칭 (match_buyers)" className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        제품매칭(35) + 거래규모(25) + 신뢰도(20) + 지역적합성(10) + 응답률예측(10) = 100 · import_volume_min $10K · 상위 50명
      </p>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="min-w-[100px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">HS 코드 / 제품</label>
          <input
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="8504"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[180px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">대상 국가 (쉼표 구분)</label>
          <input
            type="text"
            value={countries}
            onChange={(e) => setCountries(e.target.value)}
            placeholder="US,DE,JP"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[80px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">최소 점수</label>
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
          {loading ? "매칭 중…" : "바이어 매칭"}
        </button>
      </div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {result && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            제품: {result.product} · min_score: {result.min_score} · 매칭 {result.buyers?.length}명
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-2 font-medium text-muted-foreground">#</th>
                  <th className="p-2 font-medium text-muted-foreground">바이어</th>
                  <th className="p-2 font-medium text-muted-foreground">국가</th>
                  <th className="p-2 font-medium text-muted-foreground">연간 수입 (USD)</th>
                  <th className="p-2 font-medium text-muted-foreground">매칭 점수</th>
                  <th className="p-2 font-medium text-muted-foreground">세부</th>
                </tr>
              </thead>
              <tbody>
                {result.buyers?.map((b, i) => (
                  <tr key={b.id} className="border-b border-border/50">
                    <td className="p-2 font-mono">{i + 1}</td>
                    <td className="p-2">{b.name}</td>
                    <td className="p-2">{b.country}</td>
                    <td className="p-2 font-mono">${b.annual_imports?.toLocaleString()}</td>
                    <td className="p-2 font-mono text-primary">{b.match_score}</td>
                    <td className="p-2 text-xs text-muted-foreground">
                      P{b.score_breakdown?.product_match} V{b.score_breakdown?.volume} R{b.score_breakdown?.reputation} G{b.score_breakdown?.geo} Resp{b.score_breakdown?.response_prob}
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
    <SectionCard title="고객 인사이트 리포트 (월간)" className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        세그먼트 자동 발견 · 구매 여정 분석 · 이탈 예측 (ML)
      </p>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 mb-4"
      >
        {loading ? t("common.generating") : "월간 리포트 생성"}
      </button>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {report && (
        <div className="space-y-6 text-sm">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="text-muted-foreground">생성일: {report.generatedAt}</span>
            <span className="font-mono text-primary">{report.period}</span>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">1. 세그먼트 자동 발견 (AI 클러스터링)</h4>
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
                    <span className="text-foreground">추천 액션:</span>
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
            <h4 className="font-semibold text-foreground mb-3">2. 구매 여정 분석</h4>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1 mb-3">
              {report.journey?.steps?.map((s) => (
                <li key={s.order}>{s.step} {s.detail ? `(${s.detail})` : ""}</li>
              ))}
            </ol>
            <div className="p-3 rounded-lg border border-border bg-muted/20">
              <div className="text-accent font-medium">병목 구간: {report.journey?.bottleneck?.description} ({report.journey?.bottleneck?.rate})</div>
              <div className="text-muted-foreground mt-1">원인: {report.journey?.bottleneck?.causes?.join(", ")}</div>
              <div className="mt-2 text-primary">해결책: {report.journey?.bottleneck?.solutions?.map((s) => `✅ ${s}`).join(" ")}</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">3. 이탈 예측 (ML 모델)</h4>
            <div className="p-4 rounded-lg border border-border bg-muted/20">
              <p className="text-foreground">
                고위험 고객 (다음 30일 내 이탈 예상): <strong>{report.churn?.highRiskCount}명</strong> · 예상 손실: <strong>{report.churn?.estimatedLoss}</strong>
              </p>
              <p className="text-muted-foreground mt-2">이탈 신호:</p>
              <ul className="list-disc list-inside text-muted-foreground">
                {report.churn?.signals?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
              <p className="text-foreground mt-2">자동 개입 캠페인:</p>
              <ul className="list-inside text-primary">
                {report.churn?.interventions?.map((s, i) => (
                  <li key={i}>{s}</li>
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
  return (
    <SectionCard title="Module 1.4: 브랜드 모니터링 & PR (5%) — Brand Reputation Manager" className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        24/7 브랜드 모니터링 · 감정 분석 · 부정 멘션 알림 · 언론 보도 추적
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground">추적 대상</h4>
          <ul className="text-sm text-muted-foreground list-disc list-inside">
            <li>브랜드명 멘션 (소셜, 뉴스, 포럼)</li>
            <li>임원진 이름</li>
            <li>주요 제품명</li>
            <li>경쟁사 비교 멘션</li>
          </ul>
          <h4 className="font-semibold text-foreground mt-4">감정 분석</h4>
          <p className="text-sm text-muted-foreground">긍정 68% · 중립 22% · 부정 10%</p>
          <div className="p-3 rounded-lg border border-accent/30 bg-accent/10 text-sm">
            <p className="text-foreground font-medium">부정 멘션 자동 알림 예시</p>
            <p className="text-muted-foreground mt-1">&quot;Your customer service is terrible&quot;</p>
            <p className="text-muted-foreground">플랫폼: Twitter · 영향력: 4,500 팔로워</p>
            <p className="text-primary mt-1">추천: 1시간 내 응답 · 초안: [자동 생성된 사과 메시지]</p>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground">언론 보도 추적</h4>
          <ul className="text-sm text-muted-foreground list-disc list-inside">
            <li>Google News · 업계 미디어 RSS · Press release aggregators</li>
          </ul>
          <p className="text-sm text-foreground mt-2">알림: ✅ 긍정 → 소셜 공유 · ⚠️ 부정 → PR 팀 즉시 · 📊 중립 → 주간 리포트</p>
          <p className="text-sm text-muted-foreground">미디어 가치: 기사 1개 = 광고 가치 환산 · 월간 PR 가치 예시: $28,400</p>
        </div>
      </div>
    </SectionCard>
  );
}

function BuyerHunterSection() {
  const sources = [
    { title: "1. B2B 마켓플레이스", items: ["Alibaba (API 연동)", "Global Sources", "Made-in-China", "TradeKey", "EC21"] },
    { title: "2. 공개 무역 데이터", items: ["UN Comtrade (수입업체 리스트)", "Panjiva (선적 데이터)", "ImportGenius (미국 수입업체)"] },
    { title: "3. 비즈니스 디렉토리", items: ["Kompass", "Europages", "ThomasNet (제조업체)"] },
    { title: "4. 전시회 & 무역 미션", items: ["참가 업체 리스트 크롤링", "KOTRA 무역관 정보"] },
  ];
  return (
    <SectionCard title="Module 2.1: 글로벌 바이어 발굴 시스템 (8%) — International Buyer Hunter" className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        국제 무역 전문 모듈 · 바이어 데이터 소스 통합
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

function MarketScoreSection() {
  const [item, setItem] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCalculate = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.get("/b2b/market-score", {
        params: { item: item || "default" },
      });
      setResult(data);
    } catch (e) {
      setError(e.message || "점수 계산 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="시장성 점수 (Market Score, 0-100)" className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        시장 규모·성장률(25) + 경쟁강도(20) + 진입장벽(15) + 수익성(25) + 트렌드모멘텀(15) = 100
      </p>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
          placeholder="산업/키워드 (예: SaaS, 헬스케어)"
          className="flex-1 min-w-[200px] rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={handleCalculate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          <Calculator className="w-4 h-4" />
          {loading ? "계산 중…" : "점수 계산"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-destructive mb-4">{error}</p>
      )}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-pillar2/10 border border-pillar2/30">
            <Target className="w-8 h-8 text-pillar2" />
            <div>
              <span className="text-muted-foreground">총점 </span>
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
        params: { item: productName || "제품명", lang: language || "ko" },
      });
      setReport(data);
    } catch (e) {
      setError(e.message || t("common.reportError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="시장성 평가 리포트 (Market Assessment Report)" className="mb-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          placeholder="제품명 입력"
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
              <h3 className="font-bold text-foreground">시장성 평가 리포트: {report.productName}</h3>
              <p className="text-muted-foreground">생성일: {report.generatedAt}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-mono text-pillar2">
                종합 점수: {report.totalScore}/100
              </span>
              <span className="text-lg">{report.starRating}</span>
            </div>
          </div>

          <ReportBlock title="1. 시장 규모 분석">
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>TAM: {report.sections.marketSize.tam} · SAM: {report.sections.marketSize.sam} · SOM: {report.sections.marketSize.som}</li>
              <li>CAGR (2026-2031): {report.sections.marketSize.cagr}</li>
              <li className="flex items-center gap-1">
                {report.sections.marketSize.evaluation.startsWith("✅") ? <CheckCircle className="w-4 h-4 text-primary shrink-0" /> : <AlertTriangle className="w-4 h-4 text-accent shrink-0" />}
                {report.sections.marketSize.evaluation}
              </li>
            </ul>
          </ReportBlock>

          <ReportBlock title="2. 경쟁 환경">
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>주요 경쟁사: {report.sections.competition.competitors}개 · HHI {report.sections.competition.hhi} (보통)</li>
              <li>진입 시기: {report.sections.competition.entryTiming}</li>
              <li className="flex items-center gap-1">
                {report.sections.competition.evaluation.startsWith("✅") ? <CheckCircle className="w-4 h-4 text-primary shrink-0" /> : <AlertTriangle className="w-4 h-4 text-accent shrink-0" />}
                {report.sections.competition.evaluation}
              </li>
            </ul>
          </ReportBlock>

          <ReportBlock title="3. 수익성 전망">
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>업계 평균 마진: {report.sections.profitability.avgMargin}% · CAC: ${report.sections.profitability.cac} · LTV: ${report.sections.profitability.ltv}</li>
              <li>LTV/CAC: {report.sections.profitability.ltvCac}x</li>
              <li className="flex items-center gap-1">
                {report.sections.profitability.evaluation.startsWith("✅") ? <CheckCircle className="w-4 h-4 text-primary shrink-0" /> : <AlertTriangle className="w-4 h-4 text-accent shrink-0" />}
                {report.sections.profitability.evaluation}
              </li>
            </ul>
          </ReportBlock>

          <ReportBlock title="4. 트렌드 분석">
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Google 검색량: ↗️ 지난 12개월 +{report.sections.trend.searchGrowth}% · 소셜 +{report.sections.trend.socialGrowth}%</li>
              <li>투자 유입: ${report.sections.trend.investment6m}M (지난 6개월)</li>
              <li className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                {report.sections.trend.evaluation}
              </li>
            </ul>
          </ReportBlock>

          <ReportBlock title="5. 리스크 요인">
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {report.sections.risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </ReportBlock>

          <ReportBlock title="AI 추천 의견">
            <div className="space-y-1">
              <p className="font-medium text-foreground">{report.sections.aiRecommendation.verdict.replace(/\*\*/g, "")}</p>
              <p>권장 전략: &quot;{report.sections.aiRecommendation.strategy}&quot;</p>
              <p className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                예상 투자: {report.sections.aiRecommendation.investmentRange}
              </p>
              <p className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                손익분기: {report.sections.aiRecommendation.breakeven}
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
        product: product || "제품/서비스",
        target,
        budget: budget || "미정",
        goal,
      });
      setStrategy(data);
    } catch (e) {
      setError(e.message || "전략 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Module 1.2: AI 마케팅 전략 플래너 (10%) — Campaign Strategy Architect" className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        제품/서비스, 타겟(B2B/B2C), 예산, 목표(인지도/리드/매출)를 입력하면 자동 마케팅 전략을 제안합니다.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">제품/서비스</label>
          <input
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="제품 또는 서비스명"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">타겟 고객</label>
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
          <label className="block text-xs font-medium text-muted-foreground mb-1">예산</label>
          <input
            type="text"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="예: $10K/월"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">목표</label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="awareness">인지도</option>
            <option value="lead">리드</option>
            <option value="revenue">매출</option>
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
        {loading ? "전략 생성 중…" : "전략 수립"}
      </button>
      {error && <p className="text-sm text-destructive mt-3">{error}</p>}
      {strategy && (
        <div className="mt-5 p-4 rounded-lg border border-border bg-muted/20 space-y-4">
          <p className="text-foreground">{strategy.summary}</p>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">채널별 배분</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {strategy.channels?.map((ch, i) => (
                <div key={i} className="p-3 rounded-md border border-border bg-card">
                  <div className="font-medium text-foreground">{ch.name}</div>
                  <div className="text-sm text-pillar2">{ch.allocation}</div>
                  <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside">
                    {ch.tactics?.map((t, j) => (
                      <li key={j}>{t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-muted-foreground">타임라인:</span>
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
  const [product, setProduct] = useState("");
  const [budget, setBudget] = useState("$50,000");
  const [period, setPeriod] = useState("3개월");
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
          product: product || "제품명",
          budget: budget || "$50,000",
          period: period || "3개월",
        },
      });
      setData(res);
    } catch (e) {
      setError(e.message || "통합 전략 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="통합 마케팅 전략 (Integrated Marketing Strategy)" className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        제품명, 예산, 기간을 입력하면 페르소나·채널별 전략·KPI·AI 에셋을 포함한 통합 전략을 생성합니다.
      </p>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">제품명</label>
          <input
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="제품명"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[120px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">예산</label>
          <input
            type="text"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="$50,000"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[100px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">기간</label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="3개월"
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
          {loading ? "생성 중…" : "통합 전략 생성"}
        </button>
      </div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {data && (
        <div className="rounded-lg border border-border bg-muted/20 p-5 space-y-6 text-sm">
          <div className="border-b border-border pb-3">
            <h3 className="text-lg font-bold text-foreground">통합 마케팅 전략: {data.productName}</h3>
            <p className="text-muted-foreground">
              예산: {data.budget} | 기간: {data.period}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-pillar2" />
              1. 고객 페르소나 (AI 생성)
            </h4>
            <div className="space-y-4">
              {data.personas?.map((p, i) => (
                <div key={i} className="p-4 rounded-lg border border-border bg-card">
                  <div className="font-medium text-foreground mb-2">{p.title}</div>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>나이: {p.age} · 직책: {p.role} · 연봉: {p.salary}</li>
                    <li><span className="text-foreground">페인 포인트:</span></li>
                    <ul className="list-disc list-inside ml-2">
                      {p.painPoints?.map((pt, j) => (
                        <li key={j}>{pt}</li>
                      ))}
                    </ul>
                    <li><span className="text-foreground">정보 소스:</span> {p.infoSources?.join(", ")}</li>
                    <li><span className="text-foreground">구매 트리거:</span> {p.purchaseTriggers?.join(", ")}</li>
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <LayoutList className="w-4 h-4 text-pillar2" />
              2. 채널별 전략 & 예산 배분
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
                    <span className="text-foreground">타임라인:</span><br />{ch.timeline}
                  </p>
                  {ch.expectedResults?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="text-foreground">예상 성과:</span> {ch.expectedResults.join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-pillar2" />
              3. 성과 지표 (KPI)
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
                      <td className="py-2 pr-4">{k.leads}개</td>
                      <td className="py-2 pr-4">{k.trials}개</td>
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
              4. AI 자동 생성 에셋
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
  const blocks = [
    {
      title: "1. 웹 분석",
      icon: BarChart3,
      items: [
        "Google Analytics 4",
        "Hotjar (히트맵, 세션 녹화)",
        "Mixpanel (이벤트 트래킹)",
      ],
    },
    {
      title: "2. CRM 데이터",
      icon: Users,
      items: [
        "고객 라이프사이클 단계",
        "구매 이력",
        "서포트 티켓",
      ],
    },
    {
      title: "3. 소셜 리스닝",
      icon: MessageSquare,
      items: [
        "브랜드 멘션",
        "감정 분석",
        "인플루언서 식별",
      ],
    },
    {
      title: "4. 설문조사",
      icon: ClipboardList,
      items: [
        "AI 생성 설문 (Typeform 통합)",
        "NPS 자동 추적",
        "오픈엔드 응답 테마 분석",
      ],
    },
  ];

  return (
    <SectionCard title="Module 1.3: 고객 인사이트 엔진 (10%) — Customer Behavior Analyzer" className="mb-6">
      <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
        <Brain className="w-4 h-4 text-pillar2" />
        데이터 소스 통합: 웹 분석, CRM, 소셜 리스닝, 설문조사를 통합해 고객 행동 인사이트 생성
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
