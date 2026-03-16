import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Link2,
  Video,
  MessageCircle,
  Store,
  CheckCircle,
  XCircle,
  ExternalLink,
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronUp,
  Settings2,
} from "lucide-react";
import SectionCard from "../components/SectionCard";
import { useLanguage } from "../context/LanguageContext.jsx";
import { shortsApi, threadsCommerceApi, ecommerceApi, userSettingsApi } from "../lib/api.js";

const CONNECTION_PIN_VERIFIED_KEY = "connectionPinVerified";
const CONNECTION_PIN_TTL_MS = 15 * 60 * 1000; // 15 min

function getPinVerified() {
  try {
    const raw = sessionStorage.getItem(CONNECTION_PIN_VERIFIED_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    return Number.isFinite(ts) && Date.now() - ts < CONNECTION_PIN_TTL_MS;
  } catch {
    return false;
  }
}

function setPinVerified() {
  try {
    sessionStorage.setItem(CONNECTION_PIN_VERIFIED_KEY, String(Date.now()));
  } catch (_) {}
}

const CONNECTIONS = [
  {
    id: "threads",
    nameKey: "settings.connectionThreads",
    descKey: "settings.connectionThreadsDesc",
    icon: MessageCircle,
    color: "text-foreground",
    bgColor: "bg-muted/50",
    getStatus: () => threadsCommerceApi.getConnection().then((d) => ({ connected: !!d?.connected, displayName: d?.displayName })),
    connect: null,
    disconnect: () => threadsCommerceApi.disconnect(),
    linkTo: "/seo/threads-commerce",
  },
  {
    id: "shopify",
    nameKey: "settings.connectionShopify",
    descKey: "settings.connectionShopifyDesc",
    icon: Store,
    color: "text-pillar3",
    bgColor: "bg-pillar3/10",
    getStatus: () =>
      ecommerceApi.getConnections().then((d) => ({
        connected: Array.isArray(d?.connections) && d.connections.some((c) => c.channel === "shopify"),
        connections: d?.connections ?? [],
      })),
    connect: null,
    disconnect: () => ecommerceApi.disconnectChannel("shopify").then(() => ({})),
    linkTo: "/b2c/ecommerce",
  },
];

const CHANNEL_THEMES = [
  { value: "", labelKey: "settings.channelThemeNone" },
  { value: "health", labelKey: "settings.channelThemeHealth" },
  { value: "manga", labelKey: "settings.channelThemeManga" },
  { value: "culture_travel", labelKey: "settings.channelThemeCultureTravel" },
  { value: "affiliate_general", labelKey: "settings.channelThemeAffiliateGeneral" },
  { value: "affiliate_es", labelKey: "settings.channelThemeAffiliateEs" },
  { value: "lifestyle", labelKey: "settings.channelThemeLifestyle" },
  { value: "tech", labelKey: "settings.channelThemeTech" },
  { value: "other", labelKey: "settings.channelThemeOther" },
];

const CHANNEL_LANGUAGES = [
  { value: "", labelKey: "settings.channelLangNone" },
  { value: "es-DO", labelKey: "settings.channelLangEsDO" },
  { value: "es-MX", labelKey: "settings.channelLangEsMX" },
  { value: "pt-BR", labelKey: "settings.channelLangPtBR" },
  { value: "ko", labelKey: "settings.channelLangKo" },
  { value: "en", labelKey: "settings.channelLangEn" },
];

const MARKETPLACE_OPTIONS = [
  { value: "amazon", labelKey: "settings.marketplaceAmazon" },
  { value: "aliexpress", labelKey: "settings.marketplaceAliExpress" },
  { value: "temu", labelKey: "settings.marketplaceTemu" },
  { value: "shein", labelKey: "settings.marketplaceShein" },
];

/** 한 계정 행: 라벨 + 연동 해제 + 접이식 채널 프로필 폼 */
function ChannelAccountRow({
  acc,
  profile,
  expanded,
  onToggleExpand,
  onSaveProfile,
  saving,
  onDisconnect,
  disconnectLoading,
  t,
}) {
  const [theme, setTheme] = useState(profile.theme ?? "");
  const [primaryLanguage, setPrimaryLanguage] = useState(profile.primaryLanguage ?? "");
  const [affiliateFocus, setAffiliateFocus] = useState(!!profile.affiliateFocus);
  const [allowlist, setAllowlist] = useState(
    Array.isArray(profile.marketplaceAllowlist) ? profile.marketplaceAllowlist.join(", ") : ""
  );

  useEffect(() => {
    setTheme(profile.theme ?? "");
    setPrimaryLanguage(profile.primaryLanguage ?? "");
    setAffiliateFocus(!!profile.affiliateFocus);
    setAllowlist(Array.isArray(profile.marketplaceAllowlist) ? profile.marketplaceAllowlist.join(", ") : "");
  }, [profile, expanded]);

  const handleSave = () => {
    const marketplaceAllowlist = allowlist
      .split(/[,;\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    onSaveProfile({
      theme: theme || undefined,
      primaryLanguage: primaryLanguage || undefined,
      affiliateFocus,
      marketplaceAllowlist: marketplaceAllowlist.length ? marketplaceAllowlist : undefined,
    });
  };

  return (
    <div className="rounded-lg border border-border bg-background/50 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="inline-flex items-center gap-1.5 text-sm text-primary">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {acc.label || acc.key}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="w-3.5 h-3.5" />
            {t("settings.channelProfile")}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onDisconnect}
            disabled={disconnectLoading}
            className="text-sm text-muted-foreground hover:text-destructive disabled:opacity-50"
          >
            {disconnectLoading ? t("common.loading") : t("settings.disconnect")}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-border bg-muted/20 px-3 py-3 space-y-3">
          <p className="text-xs text-muted-foreground">{t("settings.channelProfileDesc")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">{t("settings.channelTheme")}</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
              >
                {CHANNEL_THEMES.map((o) => (
                  <option key={o.value || "_"} value={o.value}>{t(o.labelKey)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">{t("settings.primaryLanguage")}</label>
              <select
                value={primaryLanguage}
                onChange={(e) => setPrimaryLanguage(e.target.value)}
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
              >
                {CHANNEL_LANGUAGES.map((o) => (
                  <option key={o.value || "_"} value={o.value}>{t(o.labelKey)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`affiliate-${acc.key}`}
              checked={affiliateFocus}
              onChange={(e) => setAffiliateFocus(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor={`affiliate-${acc.key}`} className="text-sm text-foreground">
              {t("settings.affiliateFocus")}
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">{t("settings.marketplaceAllowlist")}</label>
            <input
              type="text"
              value={allowlist}
              onChange={(e) => setAllowlist(e.target.value)}
              placeholder="amazon, aliexpress, temu (비어두면 전부 허용)"
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {saving ? t("common.loading") : t("settings.saveProfile")}
          </button>
        </div>
      )}
    </div>
  );
}

/** YouTube (Shorts): 최대 5개 계정 목록 + 계정 추가 + 채널 프로필(웹에서만 툭딱 설정) */
function YouTubeAccountsSection({ t }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ accounts: [], suggestedNextKey: null, maxAccounts: 5 });
  const [profiles, setProfiles] = useState({});
  const [expandedProfileKey, setExpandedProfileKey] = useState(null);
  const [profileSaving, setProfileSaving] = useState({});
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [disconnectKey, setDisconnectKey] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([shortsApi.getYoutubeAccounts(), shortsApi.getChannelProfiles("youtube")])
      .then(([accountsRes, profilesRes]) => {
        setData({
          accounts: accountsRes?.accounts ?? [],
          suggestedNextKey: accountsRes?.suggestedNextKey ?? null,
          maxAccounts: accountsRes?.maxAccounts ?? 5,
        });
        setProfiles(profilesRes?.profiles ?? {});
      })
      .catch(() => {
        setData({ accounts: [], suggestedNextKey: "default", maxAccounts: 5 });
        setProfiles({});
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const youtube = searchParams.get("youtube");
    const msg = searchParams.get("message");
    if (youtube === "connected") {
      setMessage({ type: "success", text: t("settings.youtubeConnected") });
      setSearchParams({}, { replace: true });
      load();
    } else if (youtube === "error" && msg) {
      setMessage({ type: "error", text: decodeURIComponent(msg) });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, t]);

  const handleAddAccount = () => {
    const key = data.suggestedNextKey || "default";
    setConnectLoading(true);
    setError(null);
    shortsApi
      .getYoutubeAuthUrl(key)
      .then((d) => {
        if (d?.url) window.location.href = d.url;
        else setError(d?.error || t("settings.youtubeNotConfigured"));
      })
      .catch((e) => setError(e?.response?.data?.error || e?.message || t("settings.connectFailed")))
      .finally(() => setConnectLoading(false));
  };

  const handleDisconnect = (key) => {
    setDisconnectKey(key);
    setError(null);
    shortsApi
      .disconnectYoutube(key)
      .then(load)
      .catch((e) => setError(e?.response?.data?.error || e?.message || t("settings.disconnectFailed")))
      .finally(() => setDisconnectKey(null));
  };

  const canAdd = data.accounts.length < (data.maxAccounts ?? 5) && (data.suggestedNextKey != null || data.accounts.length === 0);

  const handleSaveProfile = async (key, profile) => {
    setProfileSaving((prev) => ({ ...prev, [key]: true }));
    setError(null);
    try {
      const res = await shortsApi.setChannelProfile(key, profile, "youtube");
      setProfiles((prev) => ({ ...prev, [key]: res?.profile ?? profile }));
      setExpandedProfileKey(null);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || t("settings.connectFailed"));
    } finally {
      setProfileSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    const form = e.target;
    const contactEmail = (form.contactEmail?.value ?? "").trim();
    const contactSiteUrl = (form.contactSiteUrl?.value ?? "").trim();
    const purpose = (form.purpose?.value ?? "").trim();
    if (!contactEmail && !contactSiteUrl) return;
    setRequestLoading(true);
    setError(null);
    try {
      await shortsApi.requestYoutubeAccount({ contactEmail, contactSiteUrl, purpose });
      setRequestSent(true);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || t("settings.connectFailed"));
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 bg-red-500/10 border-l-4 border-l-red-500 text-red-500">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t("settings.connectionYouTube")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t("settings.connectionYouTubeDesc")}</p>
          </div>
        </div>
        <Link to="/shorts" className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
          <ExternalLink className="w-3.5 h-3.5" />
          {t("settings.goToPage")}
        </Link>
      </div>
      {message && (
        <div className={`mb-3 rounded-lg px-3 py-2 text-sm ${message.type === "success" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
          {message.text}
        </div>
      )}
      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {loading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <div className="space-y-2">
          {data.accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("settings.notConnected")}</p>
          ) : (
            data.accounts.map((acc) => (
              <ChannelAccountRow
                key={acc.key}
                acc={acc}
                profile={profiles[acc.key] ?? {}}
                expanded={expandedProfileKey === acc.key}
                onToggleExpand={() => setExpandedProfileKey((k) => (k === acc.key ? null : acc.key))}
                onSaveProfile={(profile) => handleSaveProfile(acc.key, profile)}
                saving={profileSaving[acc.key]}
                onDisconnect={() => handleDisconnect(acc.key)}
                disconnectLoading={disconnectKey === acc.key}
                t={t}
              />
            ))
          )}
          {canAdd && (
            <button
              type="button"
              onClick={handleAddAccount}
              disabled={connectLoading}
              className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {connectLoading ? t("common.loading") : t("settings.addAccount")}
            </button>
          )}
          {data.accounts.length >= (data.maxAccounts ?? 5) && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <p className="text-xs text-muted-foreground">{t("settings.youtubeMaxAccounts", { max: data.maxAccounts })}</p>
              <p className="text-xs font-medium text-foreground">{t("settings.requestMoreAccounts")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.requestMoreDesc")}</p>
              {requestSent ? (
                <p className="text-sm text-primary">{t("settings.requestSent")}</p>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-2">
                  <input
                    type="email"
                    name="contactEmail"
                    placeholder={t("settings.contactEmailPlaceholder")}
                    className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                  />
                  <input
                    type="url"
                    name="contactSiteUrl"
                    placeholder={t("settings.contactSiteUrlPlaceholder")}
                    className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    name="purpose"
                    placeholder={t("settings.purposePlaceholder")}
                    className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={requestLoading}
                    className="rounded border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    {requestLoading ? t("common.loading") : t("settings.requestSubmit")}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** 연동 전용 PIN 설정/상태 */
function ConnectionPinCard({ pinConfigured, setPinConfigured, setPinVerified, t }) {
  const [setPinValue, setSetPinValue] = useState("");
  const [setPinConfirm, setSetPinConfirm] = useState("");
  const [setPinLoading, setSetPinLoading] = useState(false);
  const [setPinError, setSetPinError] = useState(null);

  const handleSetPin = async (e) => {
    e.preventDefault();
    if (setPinValue.length < 4) {
      setSetPinError(t("settings.pinMinLength"));
      return;
    }
    if (setPinValue !== setPinConfirm) {
      setSetPinError(t("settings.pinMismatch"));
      return;
    }
    setSetPinLoading(true);
    setSetPinError(null);
    try {
      await userSettingsApi.setConnectionPin(setPinValue);
      setPinConfigured(true);
      setPinVerified(true);
      setSetPinValue("");
      setSetPinConfirm("");
    } catch (err) {
      setSetPinError(err?.response?.data?.error || err?.message || t("settings.connectFailed"));
    } finally {
      setSetPinLoading(false);
    }
  };

  return (
    <SectionCard title={t("settings.connectionPinTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-3">{t("settings.connectionPinDesc")}</p>
      {pinConfigured ? (
        <p className="text-sm text-primary">{t("settings.connectionPinSet")}</p>
      ) : (
        <form onSubmit={handleSetPin} className="space-y-2 max-w-xs">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={setPinValue}
            onChange={(e) => setSetPinValue(e.target.value)}
            placeholder={t("settings.pinPlaceholder")}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            maxLength={20}
          />
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={setPinConfirm}
            onChange={(e) => setSetPinConfirm(e.target.value)}
            placeholder={t("settings.pinConfirmPlaceholder")}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            maxLength={20}
          />
          {setPinError && <p className="text-sm text-destructive">{setPinError}</p>}
          <button
            type="submit"
            disabled={setPinLoading}
            className="rounded border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {setPinLoading ? t("common.loading") : t("settings.setPin")}
          </button>
        </form>
      )}
    </SectionCard>
  );
}

function ConnectionCard({ item, t }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ connected: false });
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [error, setError] = useState(null);
  const Icon = item.icon;

  const load = () => {
    setLoading(true);
    setError(null);
    item
      .getStatus()
      .then(setStatus)
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [item.id]);

  const handleConnect = () => {
    if (item.getAuthUrl) {
      setConnectLoading(true);
      setError(null);
      item
        .getAuthUrl()
        .then((d) => {
          if (d?.url) window.location.href = d.url;
          else setError(d?.error || t("settings.youtubeNotConfigured"));
        })
        .catch((e) => setError(e?.response?.data?.error || e?.message || t("settings.connectFailed")))
        .finally(() => setConnectLoading(false));
    } else if (item.linkTo) {
      navigate(item.linkTo);
    }
  };

  const handleDisconnect = () => {
    setConnectLoading(true);
    setError(null);
    item
      .disconnect()
      .then(load)
      .catch((e) => setError(e?.response?.data?.error || e?.message || t("settings.disconnectFailed")))
      .finally(() => setConnectLoading(false));
  };

  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${item.bgColor} border-l-4 border-l-current ${item.color}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-lg ${item.bgColor} ${item.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground">{t(item.nameKey)}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t(item.descKey)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {loading ? (
            <span className="text-xs text-muted-foreground">{t("common.loading")}</span>
          ) : status.connected ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-sm text-primary">
                <CheckCircle className="w-4 h-4" />
                {t("settings.connected")}
                {status.displayName && (
                  <span className="text-muted-foreground font-normal">({status.displayName})</span>
                )}
              </span>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={connectLoading}
                className="text-sm text-muted-foreground hover:text-destructive disabled:opacity-50"
              >
                {t("settings.disconnect")}
              </button>
              <Link
                to={item.linkTo}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t("settings.goToPage")}
              </Link>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <XCircle className="w-4 h-4" />
                {t("settings.notConnected")}
              </span>
              <button
                type="button"
                onClick={handleConnect}
                disabled={connectLoading}
                className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                <Link2 className="w-4 h-4" />
                {connectLoading ? t("common.loading") : t("settings.connect")}
              </button>
              {item.linkTo && (
                <Link
                  to={item.linkTo}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {t("settings.setupOnPage")}
                </Link>
              )}
            </>
          )}
        </div>
      </div>
      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default function SettingsConnections() {
  const { t } = useLanguage();
  const [pinConfigured, setPinConfigured] = useState(false);
  const [pinVerified, setPinVerifiedState] = useState(getPinVerified);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const setPinVerified = (v) => {
    if (v) setPinVerified();
    setPinVerifiedState(v);
  };

  useEffect(() => {
    userSettingsApi.getConnectionPinConfig().then((d) => setPinConfigured(!!d?.configured)).catch(() => setPinConfigured(false));
  }, []);

  const needPinVerify = pinConfigured && !pinVerified;
  useEffect(() => {
    if (pinConfigured && !getPinVerified()) setPinModalOpen(true);
  }, [pinConfigured]);

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    setPinLoading(true);
    setPinError(null);
    try {
      const res = await userSettingsApi.verifyConnectionPin(pinInput);
      if (res?.ok !== false && res?.verified) {
        setPinVerified(true);
        setPinModalOpen(false);
        setPinInput("");
      } else {
        setPinError(t("settings.pinIncorrect"));
      }
    } catch (err) {
      setPinError(err?.response?.data?.error || err?.message || t("settings.pinIncorrect"));
    } finally {
      setPinLoading(false);
    }
  };

  if (needPinVerify && pinModalOpen) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-foreground mb-1">{t("settings.connectionPinTitle")}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t("settings.connectionPinVerifyDesc")}</p>
          <form onSubmit={handleVerifyPin} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder={t("settings.pinPlaceholder")}
              className="w-full rounded border border-border bg-background px-4 py-2.5 text-foreground"
              maxLength={20}
            />
            {pinError && <p className="text-sm text-destructive">{pinError}</p>}
            <button
              type="submit"
              disabled={pinLoading}
              className="w-full rounded bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {pinLoading ? t("common.loading") : t("settings.verify")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Link2 className="w-7 h-7 text-primary" />
          {t("settings.connectionsTitle")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("settings.connectionsDesc")}</p>
      </header>

      <ConnectionPinCard
        pinConfigured={pinConfigured}
        setPinConfigured={setPinConfigured}
        setPinVerified={setPinVerified}
        t={t}
      />

      <SectionCard title={t("settings.allConnections")} className="mb-6">
        <div className="space-y-4">
          <YouTubeAccountsSection t={t} />
          {CONNECTIONS.map((item) => (
            <ConnectionCard key={item.id} item={item} t={t} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
