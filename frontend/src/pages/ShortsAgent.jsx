import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Video, TrendingUp, Play, AlertTriangle, ExternalLink, Link2, CheckCircle, User, Mic, ChevronDown, ChevronUp, Music, Clock, Upload, Film, ClipboardList } from "lucide-react";
import SectionCard from "../components/SectionCard";
import { shortsApi } from "../lib/api";
import { useLanguage } from "../context/LanguageContext.jsx";

const STATUS_LABELS = {
  pending: "대기",
  collecting: "트렌드 수집 중",
  script: "스크립트 생성",
  images: "이미지 생성",
  video: "영상 조립",
  video_ready: "영상 준비됨",
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
  const [youtubeAccounts, setYoutubeAccounts] = useState([]);
  const [channelProfiles, setChannelProfiles] = useState({});
  const [selectedYoutubeKey, setSelectedYoutubeKey] = useState("default");
  const [avatars, setAvatars] = useState({ presets: [] });
  const [avatarPresetId, setAvatarPresetId] = useState("shortsbot");
  const [enableTts, setEnableTts] = useState(true);
  const [youtubeMessage, setYoutubeMessage] = useState(null); // { type: 'success'|'error', text: string } | null
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [noBgm, setNoBgm] = useState(false);
  const [voiceGender, setVoiceGender] = useState("female");
  const [voiceAge, setVoiceAge] = useState("young");
  const [voiceTone, setVoiceTone] = useState("friendly");
  const [voiceSpeed, setVoiceSpeed] = useState(1);
  const [format, setFormat] = useState("shorts");
  const [targetDurationSeconds, setTargetDurationSeconds] = useState(90);
  const [characterAge, setCharacterAge] = useState("young");
  const [characterGender, setCharacterGender] = useState("neutral");
  const [bgmGenre, setBgmGenre] = useState("default");
  const [bgmVolume, setBgmVolume] = useState(0.15);
  const [uploadMode, setUploadMode] = useState("immediate");
  const [platforms, setPlatforms] = useState(["youtube"]);
  const [availablePlatforms, setAvailablePlatforms] = useState(["youtube", "tiktok", "instagram", "facebook"]);
  const [libraryJobs, setLibraryJobs] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [uploadingJobId, setUploadingJobId] = useState(null);
  const [checklistJobs, setChecklistJobs] = useState([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [defaultsMessage, setDefaultsMessage] = useState(null); // { type: 'success'|'error', text: string } | null
  const [defaultsSaving, setDefaultsSaving] = useState(false);
  const [contentLanguage, setContentLanguage] = useState("ko");

  useEffect(() => {
    const y = searchParams.get("youtube");
    const msg = searchParams.get("message");
    if (y === "connected") {
      setYoutubeMessage({ type: "success", text: t("shortsAgent.youtubeConnected") });
      setSearchParams({}, { replace: true });
      shortsApi.getYoutubeAccounts().then((d) => {
        const list = d?.accounts ?? [];
        setYoutubeAccounts(list);
        if (list.length && !list.some((a) => a.key === selectedYoutubeKey)) setSelectedYoutubeKey(list[0].key);
      }).catch(() => {});
      shortsApi.getChannelProfiles("youtube").then((d) => setChannelProfiles(d?.profiles ?? {})).catch(() => {});
    } else if (y === "error") {
      setYoutubeMessage({ type: "error", text: t("shortsAgent.youtubeError") + (msg ? `: ${decodeURIComponent(msg)}` : "") });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, t]);

  useEffect(() => {
    shortsApi.getYoutubeAccounts().then((d) => {
      const list = d?.accounts ?? [];
      setYoutubeAccounts(list);
      if (list.length && !list.some((a) => a.key === selectedYoutubeKey)) setSelectedYoutubeKey(list[0].key);
    }).catch(() => setYoutubeAccounts([]));
    shortsApi.getChannelProfiles("youtube").then((d) => setChannelProfiles(d?.profiles ?? {})).catch(() => setChannelProfiles({}));
    shortsApi.getAvatars().then((d) => setAvatars(d)).catch(() => setAvatars({ presets: [] }));
    shortsApi.getPlatforms().then((d) => { if (Array.isArray(d?.platforms) && d.platforms.length) setAvailablePlatforms(d.platforms); }).catch(() => {});
  }, []);

  /** 선택한 계정의 세부옵션 로드 (계정 변경 시 자동 + 불러오기 버튼) */
  const loadChannelDefaults = (channelKey) => {
    const key = channelKey || selectedYoutubeKey || "default";
    shortsApi.getChannelDefaults(key).then((d) => {
      if (!d || typeof d !== "object") return;
      if (d.voiceGender != null) setVoiceGender(d.voiceGender);
      if (d.voiceAge != null) setVoiceAge(d.voiceAge);
      if (d.voiceTone != null) setVoiceTone(d.voiceTone);
      if (d.voiceSpeed != null) setVoiceSpeed(d.voiceSpeed);
      if (d.format != null) {
        if (d.format === "shorts" && d.targetDurationSeconds === 20) {
          setFormat("shorts_20");
          setTargetDurationSeconds(20);
        } else {
          setFormat(d.format);
          setTargetDurationSeconds(d.targetDurationSeconds ?? (d.format === "long" ? 90 : 9));
        }
      }
      if (d.characterAge != null) setCharacterAge(d.characterAge);
      if (d.characterGender != null) setCharacterGender(d.characterGender);
      if (d.noBgm != null) setNoBgm(d.noBgm);
      if (d.bgmGenre != null) setBgmGenre(d.bgmGenre);
      if (d.bgmVolume != null) setBgmVolume(d.bgmVolume);
      if (d.autoUpload != null) setUploadMode(d.autoUpload ? "immediate" : "review_first");
      if (Array.isArray(d.interestKeywords) && d.interestKeywords.length) setKeywords(d.interestKeywords.join(", "));
      if (d.language != null) setContentLanguage(d.language);
    }).catch(() => {});
  };

  useEffect(() => {
    if (!selectedYoutubeKey) return;
    loadChannelDefaults(selectedYoutubeKey);
  }, [selectedYoutubeKey]);

  const loadJobs = () => {
    setJobsLoading(true);
    shortsApi
      .getJobs(20)
      .then((d) => setJobs(d?.jobs ?? []))
      .catch(() => setJobs([]))
      .finally(() => setJobsLoading(false));
  };

  const loadLibrary = () => {
    setLibraryLoading(true);
    shortsApi
      .getLibrary()
      .then((d) => setLibraryJobs(d?.jobs ?? []))
      .catch(() => setLibraryJobs([]))
      .finally(() => setLibraryLoading(false));
  };

  const loadChecklist = () => {
    setChecklistLoading(true);
    shortsApi
      .getChecklist(100)
      .then((d) => setChecklistJobs(d?.jobs ?? []))
      .catch(() => setChecklistJobs([]))
      .finally(() => setChecklistLoading(false));
  };

  useEffect(() => {
    loadJobs();
    loadLibrary();
    loadChecklist();
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
      const runFormat = format === "shorts_20" ? "shorts" : format;
      const runTargetSec = format === "shorts_20" ? 20 : (format === "long" ? targetDurationSeconds : undefined);
      const data = await shortsApi.runPipeline(keywordList.length ? keywordList : undefined, {
        avatarPresetId: avatarPresetId || undefined,
        enableTts,
        noBgm,
        voiceGender,
        voiceAge,
        voiceTone,
        voiceSpeed,
        voicePitch: "medium",
        format: runFormat,
        targetDurationSeconds: runTargetSec,
        uploadMode: uploadMode === "review_first" ? "review_first" : "immediate",
        characterAge,
        characterGender,
        bgmGenre: noBgm ? undefined : bgmGenre,
        bgmMood: noBgm ? undefined : undefined,
        bgmVolume: noBgm ? undefined : bgmVolume,
        platforms: platforms.length ? platforms : ["youtube"],
      });
      setRunResult(data);
      loadJobs();
      loadLibrary();
      loadChecklist();
    } catch (e) {
      setRunError(e?.response?.data?.error || e?.message || "파이프라인 실행 실패");
    } finally {
      setRunLoading(false);
    }
  };

  const handleConnectYoutube = () => {
    shortsApi.getYoutubeAuthUrl().then((d) => {
      if (d?.url) {
        window.location.href = d.url;
      } else {
        setYoutubeMessage({
          type: "error",
          text: (d?.error || t("shortsAgent.youtubeError")) + " " + t("shortsAgent.youtubeCheckSettings"),
        });
      }
    }).catch((e) => {
      setYoutubeMessage({
        type: "error",
        text: (e?.response?.data?.error || e?.message || t("shortsAgent.youtubeError")) + " " + t("shortsAgent.youtubeCheckSettings"),
      });
    });
  };
  const handleDisconnectYoutube = () => {
    shortsApi.disconnectYoutube().then(() => setYoutubeStatus({ connected: false }));
  };

  const handleLoadDefaults = () => {
    setDefaultsMessage(null);
    loadChannelDefaults(selectedYoutubeKey);
    setDefaultsMessage({ type: "success", text: t("shortsAgent.defaultsLoaded") });
  };

  const togglePlatform = (platform) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleSaveDefaults = () => {
    setDefaultsMessage(null);
    setDefaultsSaving(true);
    const backendFormat = format === "shorts_20" ? "shorts" : format;
    const backendTargetSec = format === "shorts_20" ? 20 : (format === "long" ? targetDurationSeconds : undefined);
    const payload = {
      interestKeywords: keywords.split(/[,，\s]+/).map((k) => k.trim()).filter(Boolean),
      voiceGender,
      voiceAge,
      voiceTone,
      voiceSpeed,
      voicePitch: "medium",
      format: backendFormat,
      targetDurationSeconds: backendTargetSec,
      characterAge,
      characterGender,
      noBgm,
      bgmGenre: noBgm ? undefined : bgmGenre,
      bgmMood: noBgm ? undefined : undefined,
      bgmVolume: noBgm ? undefined : bgmVolume,
      autoUpload: uploadMode === "immediate",
      language: contentLanguage || undefined,
    };
    const channelKey = selectedYoutubeKey || "default";
    shortsApi.setChannelDefaults(channelKey, payload)
      .then(() => setDefaultsMessage({ type: "success", text: t("shortsAgent.defaultsSaved") }))
      .catch(() => setDefaultsMessage({ type: "error", text: t("shortsAgent.defaultsSaveError") }))
      .finally(() => setDefaultsSaving(false));
  };

  const handleUploadJob = async (jobId) => {
    setUploadingJobId(jobId);
    try {
      await shortsApi.uploadJob(jobId, selectedYoutubeKey || "default", platforms.length ? platforms : ["youtube"]);
      loadJobs();
      loadLibrary();
      loadChecklist();
      setRunResult((prev) => (prev?.jobId === jobId ? { ...prev, status: "done" } : prev));
    } catch (e) {
      setRunError(e?.response?.data?.error || e?.message || "업로드 실패");
    } finally {
      setUploadingJobId(null);
    }
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
        {youtubeAccounts.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-primary">
              <CheckCircle className="w-4 h-4" />
              {t("shortsAgent.youtubeConnected")}
              {youtubeAccounts.length > 1 && (
                <span className="text-muted-foreground font-normal">({youtubeAccounts.length} {t("shortsAgent.youtubeAccountsCount")})</span>
              )}
            </span>
            {youtubeAccounts.length > 1 && (
              <select
                value={selectedYoutubeKey}
                onChange={(e) => setSelectedYoutubeKey(e.target.value)}
                className="rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                {youtubeAccounts.map((acc) => {
                  const profile = channelProfiles[acc.key];
                  const label = acc.label || acc.key;
                  const summary = profile && (profile.theme || profile.primaryLanguage)
                    ? ` · ${[profile.theme, profile.primaryLanguage].filter(Boolean).join(" / ")}`
                    : "";
                  return (
                    <option key={acc.key} value={acc.key}>{label}{summary}</option>
                  );
                })}
              </select>
            )}
            <Link
              to="/settings/connections"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("shortsAgent.manageConnections")}
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/settings/connections"
              className="inline-flex items-center gap-2 rounded border border-border bg-muted/30 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
            >
              <Link2 className="w-4 h-4" />
              {t("shortsAgent.youtubeConnect")}
            </Link>
            <span className="text-sm text-muted-foreground">{t("shortsAgent.manageConnections")}</span>
          </div>
        )}
      </SectionCard>

      <SectionCard title={t("shortsAgent.defaultsTitle")} className="mb-6">
        <p className="text-sm text-muted-foreground mb-3">{t("shortsAgent.defaultsDesc")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleLoadDefaults}
            className="inline-flex items-center gap-2 rounded border border-border bg-muted/30 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
          >
            {t("shortsAgent.defaultsLoad")}
          </button>
          <button
            type="button"
            onClick={handleSaveDefaults}
            disabled={defaultsSaving}
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {defaultsSaving ? t("common.loading") : t("shortsAgent.defaultsSave")}
          </button>
        </div>
        {defaultsMessage && (
          <p className={`text-sm mt-2 px-3 py-2 rounded-md ${defaultsMessage.type === "success" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
            {defaultsMessage.text}
          </p>
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
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <span className="text-xs font-medium text-muted-foreground">{t("shortsAgent.deployPlatforms")}</span>
          {(availablePlatforms || []).map((p) => (
            <label key={p} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={platforms.includes(p)}
                onChange={() => togglePlatform(p)}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground capitalize">{t("shortsAgent.platform_" + p) || p}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {t("shortsAgent.advancedOptions")}
          </button>
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <p className="font-medium text-foreground mb-2 flex items-center gap-1.5"><Mic className="w-4 h-4" /> {t("shortsAgent.voiceOptions")}</p>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-muted-foreground w-16">{t("shortsAgent.voiceGender")}</span>
                    <select value={voiceGender} onChange={(e) => setVoiceGender(e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-foreground">
                      <option value="female">{t("shortsAgent.voiceFemale")}</option>
                      <option value="male">{t("shortsAgent.voiceMale")}</option>
                      <option value="neutral">{t("shortsAgent.voiceNeutral")}</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-muted-foreground w-16">{t("shortsAgent.voiceAge")}</span>
                    <select value={voiceAge} onChange={(e) => setVoiceAge(e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-foreground">
                      <option value="child">{t("shortsAgent.voiceChild")}</option>
                      <option value="young">{t("shortsAgent.voiceYoung")}</option>
                      <option value="adult">{t("shortsAgent.voiceAdult")}</option>
                      <option value="mature">{t("shortsAgent.voiceMature")}</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-muted-foreground w-16">{t("shortsAgent.voiceTone")}</span>
                    <select value={voiceTone} onChange={(e) => setVoiceTone(e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-foreground">
                      <option value="bright">{t("shortsAgent.voiceBright")}</option>
                      <option value="warm">{t("shortsAgent.voiceWarm")}</option>
                      <option value="calm">{t("shortsAgent.voiceCalm")}</option>
                      <option value="friendly">{t("shortsAgent.voiceFriendly")}</option>
                      <option value="authoritative">{t("shortsAgent.voiceAuthoritative")}</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-muted-foreground w-16">{t("shortsAgent.voiceSpeed")}</span>
                    <input type="range" min="0.8" max="1.2" step="0.05" value={voiceSpeed} onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))} className="w-24" />
                    <span className="text-muted-foreground text-xs">{voiceSpeed.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4" /> {t("shortsAgent.formatOptions")}</p>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-muted-foreground w-20">{t("shortsAgent.contentLanguage")}</span>
                    <select value={contentLanguage} onChange={(e) => setContentLanguage(e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-foreground">
                      <option value="ko">{t("shortsAgent.langKo")}</option>
                      <option value="en">{t("shortsAgent.langEn")}</option>
                      <option value="es">{t("shortsAgent.langEs")}</option>
                      <option value="es-DO">{t("shortsAgent.langEsDO")}</option>
                      <option value="pt-BR">{t("shortsAgent.langPtBR")}</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-muted-foreground w-20">{t("shortsAgent.uploadMode")}</span>
                    <select value={uploadMode} onChange={(e) => setUploadMode(e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-foreground">
                      <option value="immediate">{t("shortsAgent.uploadImmediate")}</option>
                      <option value="review_first">{t("shortsAgent.uploadReviewFirst")}</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-muted-foreground w-20">{t("shortsAgent.format")}</span>
                    <select value={format} onChange={(e) => setFormat(e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-foreground">
                      <option value="shorts">{t("shortsAgent.formatShorts")}</option>
                      <option value="shorts_20">{t("shortsAgent.formatShorts20")}</option>
                      <option value="long">{t("shortsAgent.formatLong")}</option>
                    </select>
                  </div>
                  {format === "long" && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-muted-foreground w-20">{t("shortsAgent.targetDuration")}</span>
                      <select value={targetDurationSeconds} onChange={(e) => setTargetDurationSeconds(Number(e.target.value))} className="rounded border border-border bg-background px-2 py-1 text-foreground">
                        <option value={60}>1분</option>
                        <option value={90}>1분 30초</option>
                        <option value={120}>2분</option>
                        <option value={180}>3분</option>
                      </select>
                    </div>
                  )}
                  {format === "shorts_20" && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-muted-foreground w-20">{t("shortsAgent.targetDuration")}</span>
                      <span className="text-foreground">20초</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-muted-foreground w-20">{t("shortsAgent.characterAge")}</span>
                    <select value={characterAge} onChange={(e) => setCharacterAge(e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-foreground">
                      <option value="child">{t("shortsAgent.voiceChild")}</option>
                      <option value="young">{t("shortsAgent.voiceYoung")}</option>
                      <option value="adult">{t("shortsAgent.voiceAdult")}</option>
                      <option value="mature">{t("shortsAgent.voiceMature")}</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-muted-foreground w-20">{t("shortsAgent.characterGender")}</span>
                    <select value={characterGender} onChange={(e) => setCharacterGender(e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-foreground">
                      <option value="female">{t("shortsAgent.voiceFemale")}</option>
                      <option value="male">{t("shortsAgent.voiceMale")}</option>
                      <option value="neutral">{t("shortsAgent.voiceNeutral")}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="font-medium text-foreground mb-2 flex items-center gap-1.5"><Music className="w-4 h-4" /> {t("shortsAgent.bgmOptions")}</p>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={noBgm} onChange={(e) => setNoBgm(e.target.checked)} className="rounded border-border" />
                    <span className="text-foreground">{t("shortsAgent.noBgm")}</span>
                  </label>
                  {!noBgm && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{t("shortsAgent.bgmGenre")}</span>
                        <select value={bgmGenre} onChange={(e) => setBgmGenre(e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-foreground">
                          <option value="default">{t("shortsAgent.bgmDefault")}</option>
                          <option value="upbeat">{t("shortsAgent.bgmUpbeat")}</option>
                          <option value="calm">{t("shortsAgent.bgmCalm")}</option>
                          <option value="corporate">{t("shortsAgent.bgmCorporate")}</option>
                          <option value="lofi">{t("shortsAgent.bgmLofi")}</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{t("shortsAgent.bgmVolume")}</span>
                        <input type="range" min="0.05" max="0.4" step="0.05" value={bgmVolume} onChange={(e) => setBgmVolume(parseFloat(e.target.value))} className="w-20" />
                        <span className="text-xs text-muted-foreground">{(bgmVolume * 100).toFixed(0)}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
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
            {runResult.status === "video_ready" && runResult.videoPath && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t("shortsAgent.previewBeforeUpload")}</p>
                <video
                  src={shortsApi.getJobVideoUrl(runResult.jobId)}
                  controls
                  className="max-w-md rounded border border-border bg-black"
                />
                <div className="flex flex-wrap gap-2">
                  <a
                    href={shortsApi.getJobVideoUrl(runResult.jobId)}
                    download={`short-${runResult.jobId}.mp4`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {t("shortsAgent.download")}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleUploadJob(runResult.jobId)}
                    disabled={uploadingJobId === runResult.jobId || youtubeAccounts.length === 0}
                    className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingJobId === runResult.jobId ? t("common.loading") : t("shortsAgent.uploadToYoutube")}
                  </button>
                </div>
              </div>
            )}
            {(runResult.deployedUrls && Object.keys(runResult.deployedUrls).length > 0) ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(runResult.deployedUrls).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline capitalize"
                  >
                    {t("shortsAgent.platform_" + platform) || platform}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            ) : runResult.videoUrl && (
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

      <SectionCard title={t("shortsAgent.libraryTitle")} className="mb-6">
        {libraryLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : libraryJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("shortsAgent.noLibrary")}</p>
        ) : (
          <ul className="space-y-4">
            {libraryJobs.map((job) => (
              <li key={job.jobId} className="rounded-lg border border-border bg-background/50 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{job.jobId}</span>
                  <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs">
                    {STATUS_LABELS[job.status] ?? job.status}
                  </span>
                  {(job.script?.topicTitle || job.topic?.title) && (
                    <span className="truncate text-sm text-foreground">
                      {job.script?.topicTitle || job.topic?.title}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 items-start">
                  <video
                    src={shortsApi.getJobVideoUrl(job.jobId)}
                    controls
                    className="w-full max-w-xs rounded border border-border bg-black"
                  />
                  <div className="flex flex-col gap-2">
                    <a
                      href={shortsApi.getJobVideoUrl(job.jobId)}
                      download={`short-${job.jobId}.mp4`}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      {t("shortsAgent.download")}
                    </a>
                    {(job.deployedUrls && Object.keys(job.deployedUrls).length > 0) ? (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(job.deployedUrls).map(([platform, url]) => (
                          <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline capitalize">
                            {t("shortsAgent.platform_" + platform) || platform}
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ))}
                      </div>
                    ) : job.status === "done" && job.videoUrl && (
                      <a href={job.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" />
                        YouTube
                      </a>
                    )}
                    {job.status === "video_ready" && (
                      <button
                        type="button"
                        onClick={() => handleUploadJob(job.jobId)}
                        disabled={uploadingJobId === job.jobId || youtubeAccounts.length === 0}
                        className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingJobId === job.jobId ? t("common.loading") : t("shortsAgent.uploadToYoutube")}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title={t("shortsAgent.checklistTitle")} className="mb-6">
        <p className="text-sm text-muted-foreground mb-3">{t("shortsAgent.checklistDesc")}</p>
        {checklistLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : checklistJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("shortsAgent.noChecklist")}</p>
        ) : (
          <ul className="space-y-2">
            {checklistJobs.map((job) => (
              <li key={job.jobId} className="flex flex-wrap items-center gap-2 rounded border border-border bg-muted/20 px-3 py-2 text-sm">
                <ClipboardList className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-mono text-xs text-muted-foreground">{job.jobId}</span>
                <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs">
                  {job.status === "done" ? t("shortsAgent.checklistUploaded") : t("shortsAgent.checklistNotUploaded")}
                </span>
                {(job.script?.topicTitle || job.topic?.title) && (
                  <span className="truncate text-foreground max-w-[200px]">{job.script?.topicTitle || job.topic?.title}</span>
                )}
                {job.fileDeletedAt && (
                  <span className="text-xs text-muted-foreground">{t("shortsAgent.fileDeletedAt")} {new Date(job.fileDeletedAt).toLocaleString()}</span>
                )}
                {(job.deployedUrls && Object.keys(job.deployedUrls).length > 0) ? (
                  Object.entries(job.deployedUrls).map(([platform, url]) => (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline capitalize text-xs">
                      {t("shortsAgent.platform_" + platform) || platform}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))
                ) : job.status === "done" && job.videoUrl && (
                  <a href={job.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" />
                    YouTube
                  </a>
                )}
              </li>
            ))}
          </ul>
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
                {(job.deployedUrls && Object.keys(job.deployedUrls).length > 0) ? (
                  Object.entries(job.deployedUrls).map(([platform, url]) => (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline capitalize text-xs">
                      {t("shortsAgent.platform_" + platform) || platform}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))
                ) : job.videoUrl && (
                  <a href={job.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Shorts
                  </a>
                )}
                {(job.status === "video_ready" && job.videoPath) && (
                  <>
                    <a
                      href={shortsApi.getJobVideoUrl(job.jobId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <Film className="w-3.5 h-3.5" />
                      미리보기
                    </a>
                    <button
                      type="button"
                      onClick={() => handleUploadJob(job.jobId)}
                      disabled={uploadingJobId === job.jobId || youtubeAccounts.length === 0}
                      className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      <Upload className="w-3 h-3" />
                      {uploadingJobId === job.jobId ? t("common.loading") : "업로드"}
                    </button>
                  </>
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
