import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Video, TrendingUp, Play, AlertTriangle, ExternalLink, Link2, CheckCircle, XCircle, User, Mic } from "lucide-react";
import SectionCard from "../components/SectionCard";
import { shortsApi } from "../lib/api";
import { useLanguage } from "../context/LanguageContext.jsx";

const STATUS_LABELS = {
  pending: "대기",
  collecting: "트렌드 수집 중",
  script: "스크립트 생성",
  images: "이미지 생성",
  video: "영상 조립",
  upload: "업로드 중",
  done: "완료",
  failed: "실패",
};

export default function ShortsAgent() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [keywords, setKeywords] = useState("YouTube Shorts, 트렌드, 이슈");
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trends, setTrends] = useState([]);
  const [trendsError, setTrendsError] = useState(null);
  const [runLoading, setRunLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [runError, setRunError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [youtubeStatus, setYoutubeStatus] = useState({ connected: false });
  const [avatars, setAvatars] = useState({ presets: [] });
  const [avatarPresetId, setAvatarPresetId] = useState("shortsbot");
  const [enableTts, setEnableTts] = useState(true);
  const [youtubeMessage, setYoutubeMessage] = useState(null); // { type: 'success'|'error', text: string } | null

  useEffect(() => {
    const y = searchParams.get("youtube");
    const msg = searchParams.get("message");
    if (y === "connected") {
      setYoutubeMessage({ type: "success", text: t("shortsAgent.youtubeConnected") });
      setSearchParams({}, { replace: true });
      shortsApi.getYoutubeStatus().then((d) => setYoutubeStatus(d)).catch(() => {});
    } else if (y === "error") {
      setYoutubeMessage({ type: "error", text: t("shortsAgent.youtubeError") + (msg ? `: ${decodeURIComponent(msg)}` : "") });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, t]);

  useEffect(() => {
    shortsApi.getYoutubeStatus().then((d) => setYoutubeStatus(d)).catch(() => setYoutubeStatus({ connected: false }));
    shortsApi.getAvatars().then((d) => setAvatars(d)).catch(() => setAvatars({ presets: [] }));
  }, []);

  const loadJobs = () => {
    setJobsLoading(true);
    shortsApi
      .getJobs(20)
      .then((d) => setJobs(d?.jobs ?? []))
      .catch(() => setJobs([]))
      .finally(() => setJobsLoading(false));
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const keywordList = keywords.split(/[,，\s]+/).map((k) => k.trim()).filter(Boolean);

  const handleCollectTrends = async () => {
    setTrendsLoading(true);
    setTrendsError(null);
    setTrends([]);
    try {
      const data = await shortsApi.getTrends(
        keywordList.length ? keywordList : ["YouTube Shorts", "트렌드"],
        5
      );
      setTrends(data?.topics ?? []);
    } catch (e) {
      setTrendsError(e?.response?.data?.error || e?.message || "트렌드 수집 실패");
    } finally {
      setTrendsLoading(false);
    }
  };

  const handleRunPipeline = async () => {
    setRunLoading(true);
    setRunError(null);
    setRunResult(null);
    try {
      const data = await shortsApi.runPipeline(keywordList.length ? keywordList : undefined, {
        avatarPresetId: avatarPresetId || undefined,
        enableTts,
      });
      setRunResult(data);
      loadJobs();
    } catch (e) {
      setRunError(e?.response?.data?.error || e?.message || "파이프라인 실행 실패");
    } finally {
      setRunLoading(false);
    }
  };

  const handleConnectYoutube = () => {
    shortsApi.getYoutubeAuthUrl().then((d) => {
      if (d?.url) window.location.href = d.url;
    });
  };
  const handleDisconnectYoutube = () => {
    shortsApi.disconnectYoutube().then(() => setYoutubeStatus({ connected: false }));
  };

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Video className="w-7 h-7 text-primary" />
          {t("shortsAgent.pageTitle")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("shortsAgent.pageSubtitle")}
        </p>
        {youtubeMessage && (
          <p className={`text-sm mt-2 px-3 py-2 rounded-md ${youtubeMessage.type === "success" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
            {youtubeMessage.text}
          </p>
        )}
      </header>

      <SectionCard title={t("shortsAgent.youtubeAccount")} className="mb-6">
        <p className="text-sm text-muted-foreground mb-3">{t("shortsAgent.youtubeAccountDesc")}</p>
        {youtubeStatus.connected ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-primary">
              <CheckCircle className="w-4 h-4" />
              {t("shortsAgent.youtubeConnected")}
            </span>
            <button
              type="button"
              onClick={handleDisconnectYoutube}
              className="text-sm text-muted-foreground hover:text-destructive"
            >
              {t("shortsAgent.youtubeDisconnect")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConnectYoutube}
            className="inline-flex items-center gap-2 rounded border border-border bg-muted/30 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
          >
            <Link2 className="w-4 h-4" />
            {t("shortsAgent.youtubeConnect")}
          </button>
        )}
      </SectionCard>

      <SectionCard title={t("shortsAgent.keywordsLabel")} className="mb-6">
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("shortsAgent.keywordsLabel")}</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder={t("shortsAgent.keywordsPlaceholder")}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {t("shortsAgent.avatarPreset")}
            </label>
            <select
              value={avatarPresetId}
              onChange={(e) => setAvatarPresetId(e.target.value)}
              className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {(avatars.presets || []).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enableTts}
              onChange={(e) => setEnableTts(e.target.checked)}
              className="rounded border-border"
            />
            <Mic className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{t("shortsAgent.enableTts")}</span>
          </label>
          <button
            type="button"
            onClick={handleCollectTrends}
            disabled={trendsLoading}
            className="inline-flex items-center gap-2 rounded bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80 disabled:opacity-50"
          >
            <TrendingUp className="w-4 h-4" />
            {trendsLoading ? t("common.loading") : t("shortsAgent.collectTrends")}
          </button>
          <button
            type="button"
            onClick={handleRunPipeline}
            disabled={runLoading}
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {runLoading ? t("common.loading") : t("shortsAgent.runPipeline")}
          </button>
        </div>
        {trendsError && (
          <p className="text-sm text-destructive flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {trendsError}
          </p>
        )}
        {runError && (
          <p className="text-sm text-destructive flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {runError}
          </p>
        )}
        {trends.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">수집된 주제 ({trends.length}건)</p>
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {trends.slice(0, 10).map((topic) => (
                <li key={topic.id} className="text-sm text-foreground flex justify-between gap-2">
                  <span className="truncate">{topic.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{topic.source}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {runResult && (
          <div className="rounded-lg border border-border bg-primary/5 p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">
              {t("shortsAgent.runSuccess")} — {runResult.jobId}
            </p>
            {runResult.topic && (
              <p className="text-xs text-muted-foreground">
                {t("shortsAgent.topic")}: {runResult.topic.title}
              </p>
            )}
            {runResult.videoUrl && (
              <a
                href={runResult.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {t("shortsAgent.videoUrl")}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {runResult.error && (
              <p className="text-xs text-destructive">{runResult.error}</p>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title={t("shortsAgent.jobsTitle")} className="mb-6">
        {jobsLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("shortsAgent.noJobs")}</p>
        ) : (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li
                key={job.jobId}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background/50 px-4 py-3 text-sm"
              >
                <span className="font-mono text-xs text-muted-foreground">{job.jobId}</span>
                <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {STATUS_LABELS[job.status] ?? job.status}
                </span>
                {job.topic?.title && (
                  <span className="truncate max-w-[200px] text-foreground" title={job.topic.title}>
                    {job.topic.title}
                  </span>
                )}
                {job.videoUrl && (
                  <a
                    href={job.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Shorts
                  </a>
                )}
                {job.error && (
                  <span className="text-destructive text-xs">{job.error}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
