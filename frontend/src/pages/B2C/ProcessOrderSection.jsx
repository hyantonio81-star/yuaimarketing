import { useState } from "react";
import { FileText, Package, Truck, Mail, CheckCircle, AlertTriangle } from "lucide-react";
import SectionCard from "../../components/SectionCard";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext.jsx";

function getError(t, e) {
  return e?.response?.data?.error ? t("b2cCommerce.errGeneric") : t("b2cCommerce.errProcessFailed");
}

export default function ProcessOrderSection() {
  const { t } = useLanguage();
  const [orderId, setOrderId] = useState("");
  const [orderEmail, setOrderEmail] = useState("");
  const [orderItems, setOrderItems] = useState("SKU-001 2\nSKU-002 1");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    if (!orderId.trim() || !orderEmail.trim()) return;
    const items = orderItems
      .split("\n")
      .map((line) => line.trim().split(/\s+/))
      .filter((parts) => parts.length >= 2)
      .map((parts) => ({ sku: parts[0], quantity: parseInt(parts[1], 10) || 1 }));
    if (items.length === 0) {
      setError(t("b2cCommerce.errItemsFormat"));
      return;
    }
    setProcessing(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.post("/b2c/process-order", {
        id: orderId.trim(),
        customer: { email: orderEmail.trim() },
        items,
      });
      setResult(data);
    } catch (e) {
      setError(getError(t, e));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SectionCard title={t("b2cCommerce.orderTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">{t("b2cCommerce.orderDesc")}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.orderId")}</label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder={t("b2cCommerce.orderIdPlaceholder")}
            className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.customerEmail")}</label>
          <input
            type="email"
            value={orderEmail}
            onChange={(e) => setOrderEmail(e.target.value)}
            placeholder="customer@example.com"
            className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
          />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.itemsPerLine")}</label>
        <textarea
          value={orderItems}
          onChange={(e) => setOrderItems(e.target.value)}
          placeholder={t("b2cCommerce.itemsPlaceholder")}
          rows={3}
          className="rounded border border-border bg-background px-3 py-2 text-sm w-full font-mono"
        />
      </div>
      <button
        onClick={run}
        disabled={processing || !orderId.trim() || !orderEmail.trim()}
        className="flex items-center gap-2 rounded bg-pillar3 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        <CheckCircle className={processing ? "w-4 h-4 animate-pulse" : "w-4 h-4"} />
        {processing ? t("b2cCommerce.processing") : t("b2cCommerce.processOrder")}
      </button>
      {error && (
        <p className="text-sm text-destructive mt-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </p>
      )}
      {result && (
        <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
          <div className="flex items-center gap-2 font-medium">
            {result.status === "processing" && (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-foreground">{t("b2cCommerce.statusComplete")}</span>
              </>
            )}
            {result.status === "flagged_manual_review" && (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-foreground">{t("b2cCommerce.statusFlagged").replace("{score}", result.steps?.fraud_check?.score?.toFixed(2) ?? "")}</span>
              </>
            )}
            {result.status === "cancelled" && (
              <>
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-foreground">{t("b2cCommerce.statusCancelled")} — {result.cancel_reason === "out_of_stock" ? t("b2cCommerce.cancelOutOfStock") : t("b2cCommerce.cancelPaymentFailed")}</span>
              </>
            )}
          </div>
          {result.status === "processing" && result.steps && (
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-pillar3" />
                {t("b2cCommerce.invoice")}: {result.steps.invoice_id}
              </li>
              <li className="flex items-center gap-2">
                <Package className="w-4 h-4 text-pillar3" />
                {t("b2cCommerce.picking")}: {result.steps.picking_list_id} · {t("b2cCommerce.pickingSent")}
              </li>
              <li className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-pillar3" />
                {t("b2cCommerce.carrier")}: {result.steps.carrier} · {t("b2cCommerce.estimatedDelivery")}: {result.steps.estimated_delivery}
              </li>
              <li className="flex items-center gap-2">
                <a href={result.steps.tracking_url} target="_blank" rel="noopener noreferrer" className="text-pillar3 hover:underline">
                  {result.steps.tracking_url}
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                {t("b2cCommerce.orderEmailSent")}
              </li>
            </ul>
          )}
        </div>
      )}
    </SectionCard>
  );
}
