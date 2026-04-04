import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Video, TrendingUp, Play, AlertTriangle, ExternalLink, Link2, CheckCircle, User, Mic, ChevronDown, ChevronUp, Music, Clock, Upload, Film, ClipboardList, Clock3, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import SectionCard from "../components/SectionCard";
import { shortsApi } from "../lib/api";
import { useLanguage } from "../context/LanguageContext.jsx";

/** Vite `public/` 문서 링크 (예: /docs/FFMPEG_SETUP.md) */
function publicDocHref(filename) {
  const base = import.meta.env.BASE_URL ?? "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}docs/${filename}`;
}

/** 업로드된 영상 ID: API 필드 또는 URL에서 추출 */
function extractYoutubeVideoId(job) {
  if (!job) return null;
  const raw = job.youtubeVideoId;
  if (raw && /^[a-zA-Z0-9_-]{6,15}$/.test(String(raw))) return String(raw);
  const urls = [job.videoUrl, job.deployedUrls?.youtube].filter(Boolean);
  for (const u of urls) {
    const s = String(u);
    const m =
      s.match(/(?:\/shorts\/|v=)([a-zA-Z0-9_-]{11})/) || s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
  }
  return null;
}

function YoutubeExtraLinks({ job, t }) {
  const id = extractYoutubeVideoId(job);
  if (!id) return null;
  const watch = `https://www.youtube.com/watch?v=${id}`;
  const shorts = `https://www.youtube.com/shorts/${id}`;
  const studio = `https://studio.youtube.com/video/${id}/edit`;
  return (
    <div className="mt-2 space-y-1 rounded-md border border-border/60 bg-muted/20 px-2 py-2 text-xs">
      <p className="text-muted-foreground">{t("shortsAgent.youtubeLinkAlternativesIntro")}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <a
          href={watch}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-0.5"
        >
          {t("shortsAgent.youtubeOpenWatch")}
          <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href={shorts}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-0.5"
        >
          {t("shortsAgent.youtubeOpenShorts")}
          <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href={studio}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-0.5"
        >
          {t("shortsAgent.youtubeOpenStudio")}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">{t("shortsAgent.youtubePrivateLinkHint")}</p>
    </div>
  );
}

export default function ShortsAgent() {
  const { t } = useLanguage();

  const STATUS_LABELS = {
    pending: t("shortsAgent.statusPending"),
    collecting: t("shortsAgent.statusCollecting"),
    script: t("shortsAgent.statusScript"),
    images: t("shortsAgent.statusImages"),
    video: t("shortsAgent.statusVideo"),
    pending_assembly: t("shortsAgent.statusPendingAssembly"),
    video_ready: t("shortsAgent.statusVideoReady"),
    upload: t("shortsAgent.statusUpload"),
    done: t("shortsAgent.statusDone"),
    failed: t("shortsAgent.statusFailed"),
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("generate"); // 'generate' | 'studio' | 'queue'
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  
  // 배포 설정 상태
  const [distPlatforms, setDistPlatforms] = useState(["youtube"]);
  const [isDistributing, setIsDistributing] = useState(false);

  const toggleJobSelection = (jobId) => {
    setSelectedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const selectAllJobs = (jobList) => {
    if (selectedJobIds.length === jobList.length) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(jobList.map((j) => j.jobId));
    }
  };

  const handleAddToQueue = async () => {
    if (!selectedJobIds.length) return;
    setIsDistributing(true);
    try {
      await shortsApi.addToDistributionQueue(selectedJobIds, distPlatforms);
      setSelectedJobIds([]);
      loadJobs();
      loadQueue();
      alert(t("shortsAgent.alertQueueAdded", { count: selectedJobIds.length }));
    } catch (e) {
      alert(t("shortsAgent.alertQueueFailed", { error: e.message || t("common.error") }));
    } finally {
      setIsDistributing(false);
    }
  };

  const loadQueue = () => {
    setQueueLoading(true);
    shortsApi.getDistributionQueue()
      .then(d => setQueue(d?.queue ?? []))
      .catch(() => setQueue([]))
      .finally(() => setQueueLoading(false));
  };
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
  const [keywords, setKeywords] = useState("");
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [youtubeStatus, setYoutubeStatus] = useState({ connected: false });
  const [checklistJobs, setChecklistJobs] = useState([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [defaultsMessage, setDefaultsMessage] = useState(null); // { type: 'success'|'error', text: string } | null
  const [defaultsSaving, setDefaultsSaving] = useState(false);
  const [contentLanguage, setContentLanguage] = useState("ko");
  const [videoUrls, setVideoUrls] = useState({});
  const [ffmpegInstalled, setFfmpegInstalled] = useState(true);
  const [deployTarget, setDeployTarget] = useState("standard");
  const [remoteAssemblyEnabled, setRemoteAssemblyEnabled] = useState(false);
  const [workerSecretConfigured, setWorkerSecretConfigured] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);

  const ensureVideoUrl = (jobId) => {
    if (!jobId || videoUrls[jobId]) return;
    shortsApi
      .getJobVideoUrl(jobId)
      .then((url) => setVideoUrls((prev) => ({ ...prev, [jobId]: url })))
      .catch((e) => {
        const st = e?.response?.status;
        setRunError(
          st === 404
            ? t("shortsAgent.videoLoadError404")
            : e?.apiMessage || e?.message || t("shortsAgent.videoLoadError")
        );
      });
  };

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
      }).catch((e) => {
        setYoutubeMessage({ type: "error", text: e?.apiMessage || e?.message || t("shortsAgent.youtubeError") });
      });
      shortsApi.getChannelProfiles("youtube").then((d) => setChannelProfiles(d?.profiles ?? {})).catch((e) => {
        setYoutubeMessage({ type: "error", text: e?.apiMessage || e?.message || t("shortsAgent.youtubeError") });
      });
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
    }).catch((e) => {
      setYoutubeAccounts([]);
      setYoutubeMessage({ type: "error", text: e?.apiMessage || e?.message || t("shortsAgent.youtubeError") });
    });
    shortsApi.getChannelProfiles("youtube").then((d) => setChannelProfiles(d?.profiles ?? {})).catch((e) => {
      setChannelProfiles({});
      setYoutubeMessage({ type: "error", text: e?.apiMessage || e?.message || t("shortsAgent.youtubeError") });
    });
    shortsApi.getAvatars().then((d) => setAvatars(d)).catch((e) => {
      setAvatars({ presets: [] });
      setYoutubeMessage({ type: "error", text: e?.apiMessage || e?.message || t("shortsAgent.youtubeError") });
    });
    shortsApi.getPlatforms()
      .then((d) => { if (Array.isArray(d?.platforms) && d.platforms.length) setAvailablePlatforms(d.platforms); })
      .catch((e) => setYoutubeMessage({ type: "error", text: e?.apiMessage || e?.message || t("shortsAgent.youtubeError") }));
    
    shortsApi
      .getHealth()
      .then((d) => {
        setFfmpegInstalled(d?.ffmpegInstalled ?? true);
        setDeployTarget(d?.deployTarget === "vercel" ? "vercel" : "standard");
        setRemoteAssemblyEnabled(d?.remoteAssemblyEnabled === true);
        setWorkerSecretConfigured(d?.workerSecretConfigured === true);
      })
      .catch(() => {
        setFfmpegInstalled(true);
        setDeployTarget("standard");
        setRemoteAssemblyEnabled(false);
        setWorkerSecretConfigured(false);
      });
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
    }).catch((e) => {
      setDefaultsMessage({ type: "error", text: e?.apiMessage || e?.message || t("shortsAgent.defaultsSaveError") });
    });
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
      .catch((e) => {
        setJobs([]);
        setRunError(e?.apiMessage || e?.message || t("shortsAgent.jobsLoadError"));
      })
      .finally(() => setJobsLoading(false));
  };

  const loadLibrary = () => {
    setLibraryLoading(true);
    shortsApi
      .getLibrary()
      .then((d) => setLibraryJobs(d?.jobs ?? []))
      .catch((e) => {
        setLibraryJobs([]);
        setRunError(e?.apiMessage || e?.message || t("shortsAgent.jobsLoadError"));
      })
      .finally(() => setLibraryLoading(false));
  };

  const loadChecklist = () => {
    setChecklistLoading(true);
    shortsApi
      .getChecklist(100)
      .then((d) => setChecklistJobs(d?.jobs ?? []))
      .catch((e) => {
        setChecklistJobs([]);
        setRunError(e?.apiMessage || e?.message || t("shortsAgent.jobsLoadError"));
      })
      .finally(() => setChecklistLoading(false));
  };

  useEffect(() => {
    loadJobs();
    loadLibrary();
    loadChecklist();
  }, []);

  // 활성 작업(진행 중)이 있을 경우 폴링
  useEffect(() => {
    const activeStatuses = [
      "pending",
      "collecting",
      "script",
      "images",
      "voice",
      "video",
      "pending_assembly",
      "upload",
    ];
    const hasActiveJobs = jobs.some((j) => activeStatuses.includes(j.status));
    
    if (!hasActiveJobs) return;

    const timer = setInterval(() => {
      // 3초마다 작업 목록 갱신
      shortsApi.getJobs(20)
        .then((d) => {
          const newJobs = d?.jobs ?? [];
          setJobs(newJobs);
          
          // 현재 실행 중인 결과(runResult)가 있으면 해당 작업의 최신 상태도 업데이트
          if (runResult?.jobId) {
            const updated = newJobs.find(j => j.jobId === runResult.jobId);
            if (updated) setRunResult(updated);
          }
          
          // 완료된 작업이 있으면 라이브러리/체크리스트도 갱신
          if (newJobs.some(j => ["done", "video_ready", "failed"].includes(j.status))) {
            loadLibrary();
            loadChecklist();
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(timer);
  }, [jobs, runResult?.jobId]);

  useEffect(() => {
    if (
      (runResult?.status === "video_ready" || runResult?.status === "done") &&
      runResult?.jobId &&
      !runResult?.videoStub
    ) {
      ensureVideoUrl(runResult.jobId);
    }
  }, [runResult?.status, runResult?.jobId, runResult?.videoStub]);

  useEffect(() => {
    libraryJobs
      .filter((job) => job?.status === "video_ready" && job?.jobId && !job?.videoStub)
      .forEach((job) => ensureVideoUrl(job.jobId));
  }, [libraryJobs]);

  useEffect(() => {
    jobs
      .filter((job) => job?.status === "video_ready" && job?.jobId && !job?.videoStub)
      .forEach((job) => ensureVideoUrl(job.jobId));
  }, [jobs]);

  const keywordList = keywords.split(/[,，\s]+/).map((k) => k.trim()).filter(Boolean);

  const handleCollectTrends = async () => {
    setTrendsLoading(true);
    setTrendsError(null);
    setTrends([]);
    try {
      const data = await shortsApi.getTrends(
        keywordList.length ? keywordList : ["YouTube Shorts", t("shortsAgent.trend")],
        5
      );
      setTrends(data?.topics ?? []);
    } catch (e) {
      setTrendsError(e?.response?.data?.error || e?.message || t("shortsAgent.errTrendCollect"));
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
        youtubeKey: selectedYoutubeKey || "default",
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
      // 작업 목록 즉시 갱신 (pending 상태인 새 작업이 나타남)
      loadJobs();
    } catch (e) {
      setRunError(e?.response?.data?.error || e?.message || t("shortsAgent.errPipelineRun"));
    } finally {
      setRunLoading(false);
    }
  };

  const handleConnectYoutube = () => {
    shortsApi.getYoutubeAuthUrl(selectedYoutubeKey || undefined).then((d) => {
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
    shortsApi.disconnectYoutube(selectedYoutubeKey || undefined).then(() => setYoutubeStatus({ connected: false }));
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
      setRunError(e?.response?.data?.error || e?.message || t("shortsAgent.errUpload"));
    } finally {
      setUploadingJobId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 pb-24">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Video className="w-7 h-7 text-primary" />
            {t("shortsAgent.pageTitle")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("shortsAgent.pageSubtitle")}
          </p>
          <div className="mt-4 rounded-lg border border-border bg-muted/20">
            <button
              type="button"
              onClick={() => setWorkflowOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted/40 touch-manipulation"
            >
              <span>{t("shortsAgent.workflowTitle")}</span>
              {workflowOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
            </button>
            {workflowOpen && (
              <div className="space-y-2 border-t border-border px-3 py-3 text-xs text-muted-foreground leading-relaxed">
                <p>{t("shortsAgent.workflowIntro")}</p>
                <ol className="list-decimal space-y-1.5 pl-4">
                  <li>{t("shortsAgent.workflowStep1")}</li>
                  <li>{t("shortsAgent.workflowStep2")}</li>
                  <li>{t("shortsAgent.workflowStep3")}</li>
                  <li>{t("shortsAgent.workflowStep4")}</li>
                  <li>{t("shortsAgent.workflowStep5")}</li>
                  <li>
                    {t("shortsAgent.workflowStep6")}{" "}
                    <Link to="/shorts/serial" className="text-primary hover:underline font-medium">
                      {t("nav.serialProjects")}
                    </Link>
                  </li>
                </ol>
                <p className="pt-1 text-[11px] border-t border-border/60">{t("shortsAgent.workflowIntegrations")}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex bg-muted/50 p-1 rounded-xl border border-border self-start">
          <button 
            onClick={() => setActiveTab("generate")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "generate" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t("shortsAgent.tabGenerate")}
          </button>
          <button 
            onClick={() => { setActiveTab("studio"); loadJobs(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "studio" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t("shortsAgent.tabStudio")}
          </button>
          <button 
            onClick={() => { setActiveTab("queue"); loadQueue(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "queue" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t("shortsAgent.tabQueue")}
          </button>
        </div>
      </header>

      {youtubeMessage && (
        <p className={`text-sm mb-6 px-3 py-2 rounded-md ${youtubeMessage.type === "success" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
          {youtubeMessage.text}
        </p>
      )}

      {activeTab === "generate" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {youtubeAccounts.length === 0 && (
            <div className="mb-6 space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              <div className="flex flex-wrap items-start gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 space-y-2">
                  <p>{t("shortsAgent.youtubeNotConnectedBanner")}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to="/settings/connections"
                      className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      {t("shortsAgent.youtubeConnectCta")}
                    </Link>
                    <Link
                      to="/settings/connections"
                      className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 dark:text-amber-200 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {t("shortsAgent.setupGuideLink")}
                    </Link>
                  </div>
                </div>
              </div>
              {deployTarget === "vercel" && (
                <p className="text-xs text-amber-900/80 dark:text-amber-100/90 pl-7">{t("shortsAgent.youtubeVercelEphemeralHint")}</p>
              )}
            </div>
          )}

          {!ffmpegInstalled && deployTarget === "vercel" && (
            <div className="mb-6 space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              <div className="flex flex-wrap items-start gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 space-y-2">
                  <p>
                    {remoteAssemblyEnabled
                      ? t("shortsAgent.ffmpegVercelRemoteWorkerHint")
                      : t("shortsAgent.ffmpegVercelNotice")}
                  </p>
                  {!remoteAssemblyEnabled && (
                    <p className="text-xs opacity-90">{t("shortsAgent.remoteAssemblyDisabledHint")}</p>
                  )}
                  {remoteAssemblyEnabled && (
                    <p
                      className={`text-xs ${workerSecretConfigured ? "text-emerald-800 dark:text-emerald-200" : "text-amber-900 dark:text-amber-100"}`}
                    >
                      {workerSecretConfigured
                        ? t("shortsAgent.workerSecretStatusOk")
                        : t("shortsAgent.workerSecretStatusMissing")}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
                    <a
                      href={publicDocHref("SHORTS_REMOTE_ASSEMBLY.md")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-amber-900 underline underline-offset-2 dark:text-amber-100"
                    >
                      {t("shortsAgent.remoteAssemblyDocLink")}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={publicDocHref("FFMPEG_SETUP.md")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-amber-900 underline underline-offset-2 dark:text-amber-100"
                    >
                      {t("shortsAgent.ffmpegInstallGuideLink")}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!ffmpegInstalled && deployTarget !== "vercel" && (
            <div className="mb-6 space-y-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive dark:text-red-400">
              <div className="flex flex-wrap items-start gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 space-y-2">
                  <p>{t("shortsAgent.ffmpegNotInstalled")}</p>
                  <a
                    href={publicDocHref("FFMPEG_SETUP.md")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t("shortsAgent.ffmpegInstallGuideLink")}
                  </a>
                </div>
              </div>
            </div>
          )}

          {(!ffmpegInstalled || deployTarget === "vercel") && (
            <p className="mb-6 text-xs text-muted-foreground border border-border rounded-lg px-3 py-2 bg-muted/20">
              {t("shortsAgent.generationHowToVerify")}
            </p>
          )}

      <SectionCard title={t("shortsAgent.youtubeAccount")} className="mb-6">
        <p className="text-sm text-muted-foreground mb-3">{t("shortsAgent.youtubeAccountDesc")}</p>
        <p className="text-xs text-muted-foreground mb-3">{t("shortsAgent.ffmpegNote")}</p>
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
                        <option value={60}>1{t("shortsAgent.minute")}</option>
                        <option value={90}>{t("shortsAgent.minuteHalf")}</option>
                        <option value={120}>2{t("shortsAgent.minute")}</option>
                        <option value={180}>3{t("shortsAgent.minute")}</option>
                      </select>
                    </div>
                  )}
                  {format === "shorts_20" && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-muted-foreground w-20">{t("shortsAgent.targetDuration")}</span>
                      <span className="text-foreground">20{t("shortsAgent.seconds")}</span>
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
            <p className="text-xs font-medium text-muted-foreground mb-2">{t("shortsAgent.collectedTopics")} ({t("common.countItems", { count: trends.length })})</p>
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
            {runResult.videoStub && (
              <p className="text-xs font-medium rounded-md border border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-100 px-2 py-1.5">
                {t("shortsAgent.videoStubBadge")}
              </p>
            )}
            {runResult.topic && (
              <p className="text-xs text-muted-foreground">
                {t("shortsAgent.topic")}: {runResult.topic.title}
              </p>
            )}
            {runResult.status === "pending_assembly" && (
              <p className="text-xs text-muted-foreground border border-border rounded-md px-2 py-1.5 bg-muted/30">
                {runResult.assemblyStatus === "processing"
                  ? t("shortsAgent.assemblyProcessing")
                  : t("shortsAgent.assemblyQueued")}
              </p>
            )}
            {runResult.assemblyError && (
              <p className="text-xs text-destructive">{runResult.assemblyError}</p>
            )}
            {runResult.status === "video_ready" && runResult.videoPath && runResult.videoStub && (
              <p className="text-sm text-amber-800 dark:text-amber-200">{t("shortsAgent.videoStubNoPreview")}</p>
            )}
            {runResult.status === "video_ready" && runResult.videoPath && !runResult.videoStub && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t("shortsAgent.previewBeforeUpload")}</p>
                <video
                  src={videoUrls[runResult.jobId]}
                  controls
                  className="max-w-md rounded border border-border bg-black"
                />
                <div className="flex flex-wrap gap-2">
                  <a
                    href={videoUrls[runResult.jobId]}
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
            {(runResult.deployedUrls?.youtube ||
              (runResult.videoUrl && String(runResult.videoUrl).includes("youtube")) ||
              runResult.youtubeVideoId) && <YoutubeExtraLinks job={runResult} t={t} />}
            {runResult.error && (
              <p className="text-xs text-destructive">{runResult.error}</p>
            )}
            {runResult.status === "done" && runResult.youtubeProcessingStatus && (
              <p className="text-xs text-muted-foreground">
                {runResult.youtubeProcessingStatus === "succeeded" && t("shortsAgent.youtubeProcessingOk")}
                {runResult.youtubeProcessingStatus === "processing" && t("shortsAgent.youtubeProcessingWait")}
                {runResult.youtubeProcessingStatus === "failed" && t("shortsAgent.youtubeProcessingFail")}
                {runResult.youtubeProcessingStatus === "uploaded" && t("shortsAgent.youtubeProcessingUploaded")}
                {runResult.youtubeProcessingDetail ? ` — ${runResult.youtubeProcessingDetail}` : ""}
              </p>
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
                  {job.videoStub && (
                    <span className="text-xs font-medium rounded border border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-100 px-2 py-0.5">
                      {t("shortsAgent.videoStubBadge")}
                    </span>
                  )}
                  {job.status === "pending_assembly" && (
                    <span className="text-xs text-muted-foreground">
                      {job.assemblyStatus === "processing"
                        ? t("shortsAgent.assemblyProcessing")
                        : t("shortsAgent.assemblyQueued")}
                    </span>
                  )}
                  {job.assemblyError && <span className="text-xs text-destructive">{job.assemblyError}</span>}
                  {job.status === "done" && job.youtubeProcessingStatus && (
                    <span className="text-xs text-muted-foreground">
                      {job.youtubeProcessingStatus === "succeeded" && t("shortsAgent.youtubeProcessingOk")}
                      {job.youtubeProcessingStatus === "processing" && t("shortsAgent.youtubeProcessingWait")}
                      {job.youtubeProcessingStatus === "failed" && t("shortsAgent.youtubeProcessingFail")}
                      {job.youtubeProcessingStatus === "uploaded" && t("shortsAgent.youtubeProcessingUploaded")}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 items-start">
                  {job.videoStub ? (
                    <p className="text-sm text-amber-800 dark:text-amber-200 max-w-xs">{t("shortsAgent.videoStubNoPreview")}</p>
                  ) : (
                    <video
                      src={videoUrls[job.jobId]}
                      controls
                      className="w-full max-w-xs rounded border border-border bg-black"
                    />
                  )}
                  <div className="flex flex-col gap-2">
                    {!job.videoStub && (
                    <a
                      href={videoUrls[job.jobId]}
                      download={`short-${job.jobId}.mp4`}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      {t("shortsAgent.download")}
                    </a>
                    )}
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
                    {(job.deployedUrls?.youtube ||
                      (job.videoUrl && String(job.videoUrl).includes("youtube")) ||
                      job.youtubeVideoId) && (
                      <div className="w-full">
                        <YoutubeExtraLinks job={job} t={t} />
                      </div>
                    )}
                    {job.status === "video_ready" && !job.videoStub && (
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
              <li key={job.jobId} className="flex flex-col gap-2 rounded border border-border bg-muted/20 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
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
                </div>
                {(job.deployedUrls?.youtube ||
                  (job.videoUrl && String(job.videoUrl).includes("youtube")) ||
                  job.youtubeVideoId) && <YoutubeExtraLinks job={job} t={t} />}
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
                {job.videoStub && (
                  <span className="text-[10px] font-medium rounded border border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-100 px-1.5 py-0.5">
                    {t("shortsAgent.videoStubBadge")}
                  </span>
                )}
                {job.topic?.title && (
                  <span className="truncate max-w-[200px] text-foreground" title={job.topic.title}>
                    {job.topic.title}
                  </span>
                )}
                {job.status === "pending_assembly" && (
                  <span className="text-xs text-muted-foreground max-w-[220px] truncate">
                    {job.assemblyStatus === "processing"
                      ? t("shortsAgent.assemblyProcessing")
                      : t("shortsAgent.assemblyQueued")}
                  </span>
                )}
                {job.assemblyError && (
                  <span className="text-xs text-destructive max-w-[220px] truncate" title={job.assemblyError}>
                    {job.assemblyError}
                  </span>
                )}
                {job.status === "done" && job.youtubeProcessingStatus && (
                  <span className="text-xs text-muted-foreground">
                    {job.youtubeProcessingStatus === "succeeded" && t("shortsAgent.youtubeProcessingOk")}
                    {job.youtubeProcessingStatus === "processing" && t("shortsAgent.youtubeProcessingWait")}
                    {job.youtubeProcessingStatus === "failed" && t("shortsAgent.youtubeProcessingFail")}
                    {job.youtubeProcessingStatus === "uploaded" && t("shortsAgent.youtubeProcessingUploaded")}
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
                {(job.deployedUrls?.youtube ||
                  (job.videoUrl && String(job.videoUrl).includes("youtube")) ||
                  job.youtubeVideoId) && (
                  <div className="w-full basis-full">
                    <YoutubeExtraLinks job={job} t={t} />
                  </div>
                )}
                {(job.status === "video_ready" && job.videoPath && !job.videoStub) && (
                  <>
                    <a
                      href={videoUrls[job.jobId]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <Film className="w-3.5 h-3.5" />
                      {t("shortsAgent.previewVideo")}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleUploadJob(job.jobId)}
                      disabled={uploadingJobId === job.jobId || youtubeAccounts.length === 0}
                      className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      <Upload className="w-3 h-3" />
                      {uploadingJobId === job.jobId ? t("common.loading") : t("shortsAgent.uploadButton")}
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
  )}

  {activeTab === "studio" && (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SectionCard title={t("shortsAgent.studioTitle")} className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {t("shortsAgent.studioDesc")}
              </p>
              <button 
                onClick={() => selectAllJobs(jobs)}
                className="text-sm font-medium text-primary hover:underline"
              >
                {selectedJobIds.length === jobs.length ? t("shortsAgent.deselectAll") : t("shortsAgent.selectAll")}
              </button>
            </div>

            {jobsLoading ? (
              <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
            ) : jobs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">{t("shortsAgent.noStudioJobs")}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                  <div 
                    key={job.jobId}
                    className={`relative rounded-xl border-2 transition-all p-4 ${selectedJobIds.includes(job.jobId) ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/30"}`}
                  >
                    <div className="absolute top-3 left-3 z-10">
                      <input 
                        type="checkbox"
                        checked={selectedJobIds.includes(job.jobId)}
                        onChange={() => toggleJobSelection(job.jobId)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>
                    
                    <div className="mb-3 pl-8">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          job.status === "done" ? "bg-green-500/10 text-green-600" : 
                          job.status === "failed" ? "bg-red-500/10 text-red-600" : "bg-primary/10 text-primary"
                        }`}>
                          {STATUS_LABELS[job.status] || job.status}
                        </span>
                        {job.videoStub && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-700 dark:text-amber-300">
                            {t("shortsAgent.videoStubBadge")}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm line-clamp-1">{job.topic?.title || t("shortsAgent.noTitle")}</h4>
                    </div>

                    <div className="aspect-video rounded-lg bg-muted mb-3 flex items-center justify-center overflow-hidden border border-border group">
                      {job.videoStub ? (
                        <p className="text-xs text-center text-amber-800 dark:text-amber-200 px-2">{t("shortsAgent.videoStubNoPreview")}</p>
                      ) : videoUrls[job.jobId] ? (
                        <video 
                          src={videoUrls[job.jobId]} 
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Film className="w-8 h-8 text-muted-foreground/50" />
                          <button 
                            onClick={() => ensureVideoUrl(job.jobId)}
                            className="text-xs text-primary hover:underline"
                          >
                            {t("shortsAgent.previewLoad")}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground line-clamp-2 italic">
                        "{job.script?.hook}"
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {Object.keys(job.deployedUrls || {}).map(p => (
                          <span key={p} className="text-[10px] bg-muted px-1.5 py-0.5 rounded capitalize">{p}</span>
                        ))}
                      </div>
                      {(job.deployedUrls?.youtube ||
                        (job.videoUrl && String(job.videoUrl).includes("youtube")) ||
                        job.youtubeVideoId) && <YoutubeExtraLinks job={job} t={t} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {activeTab === "queue" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SectionCard title={t("shortsAgent.queueTitle")} className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {t("shortsAgent.queueDesc")}
              </p>
              <button 
                onClick={loadQueue}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                {t("common.refresh")}
              </button>
            </div>

            {queueLoading ? (
              <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
            ) : queue.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">{t("shortsAgent.noQueueItems")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                    <tr>
                      <th className="px-4 py-3">{t("shortsAgent.platform")}</th>
                      <th className="px-4 py-3">{t("shortsAgent.content")}</th>
                      <th className="px-4 py-3">{t("shortsAgent.scheduledAt")}</th>
                      <th className="px-4 py-3">{t("shortsAgent.status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-border">
                    {queue.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors border-b border-border last:border-0">
                        <td className="px-4 py-4 font-medium capitalize">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              item.platform === "youtube" ? "bg-red-500" :
                              item.platform === "tiktok" ? "bg-black dark:bg-white" :
                              item.platform === "instagram" ? "bg-pink-500" : "bg-blue-600"
                            }`}></span>
                            {item.platform}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-foreground font-medium">{item.metadata?.title || "AI Content"}</span>
                            <span className="text-[10px] text-muted-foreground">{item.jobId}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock3 className="w-3.5 h-3.5" />
                            <span>{new Date(item.scheduledAt).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold w-fit ${
                              item.status === "done" ? "bg-green-500/10 text-green-600" :
                              item.status === "failed" ? "bg-red-500/10 text-red-600" :
                              item.status === "processing" ? "bg-blue-500/10 text-blue-600 animate-pulse" :
                              "bg-amber-500/10 text-amber-600"
                            }`}>
                              {item.status === "done" ? <CheckCircle2 className="w-3 h-3" /> :
                               item.status === "failed" ? <XCircle className="w-3 h-3" /> :
                               item.status === "processing" ? <RefreshCw className="w-3 h-3 animate-spin" /> :
                               <Clock3 className="w-3 h-3" />}
                              {item.status === "waiting" ? t("shortsAgent.statusWaiting") : 
                               item.status === "processing" ? t("shortsAgent.statusProcessing") :
                               item.status === "done" ? t("shortsAgent.statusFinished") : t("shortsAgent.statusError")}
                            </span>
                            {item.retryCount > 0 && item.status !== "done" && (
                              <span className="text-[10px] text-amber-600 font-medium ml-1">
                                {t("shortsAgent.retryCount", { count: item.retryCount })}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* 플로팅 배포 액션 바 (항목 선택 시 표시) */}
      {selectedJobIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-foreground text-background rounded-2xl shadow-2xl px-6 py-4 flex flex-wrap items-center gap-6 border border-white/10 backdrop-blur-md bg-opacity-95">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                {selectedJobIds.length}
              </div>
              <span className="text-sm font-semibold">{t("shortsAgent.itemsSelected", { count: "" }).replace("{count}", "").trim()}</span>
            </div>
            
            <div className="h-8 w-px bg-white/20 mx-2 hidden sm:block"></div>
            
            <div className="flex items-center gap-3">
              {["youtube", "tiktok", "instagram", "facebook"].map(p => (
                <button
                  key={p}
                  onClick={() => setDistPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${distPlatforms.includes(p) ? "bg-primary text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={handleAddToQueue}
              disabled={isDistributing || distPlatforms.length === 0}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
            >
              {isDistributing ? t("common.loading") : t("shortsAgent.addToQueue")}
              <Upload className="w-4 h-4" />
            </button>
            
            <button 
              onClick={() => setSelectedJobIds([])}
              className="text-xs text-white/60 hover:text-white"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
