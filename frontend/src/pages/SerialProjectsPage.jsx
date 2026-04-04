import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ExternalLink, Trash2, RefreshCw, Music } from "lucide-react";
import SectionCard from "../components/SectionCard";
import { shortsApi } from "../lib/api";
import { useLanguage } from "../context/LanguageContext.jsx";

const GENRES = ["novel", "comic", "music", "longform", "shorts"];

export default function SerialProjectsPage() {
  const { t } = useLanguage();
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newGenre, setNewGenre] = useState("novel");
  const [manuscript, setManuscript] = useState("");
  const [charsPerEpisode, setCharsPerEpisode] = useState(2500);
  const [chunkLoading, setChunkLoading] = useState(false);
  const [hint, setHint] = useState(null);
  const [musicInfo, setMusicInfo] = useState(null);
  const [playlistInput, setPlaylistInput] = useState("");
  const [episodeEdits, setEpisodeEdits] = useState({});

  const loadSeries = useCallback(() => {
    setLoading(true);
    shortsApi
      .listContentSeries()
      .then((d) => setSeriesList(d?.series ?? []))
      .catch(() => setSeriesList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  const loadDetail = useCallback((id) => {
    if (!id) {
      setDetail(null);
      setEpisodes([]);
      return;
    }
    shortsApi
      .getContentSeries(id, true)
      .then((d) => {
        setDetail(d);
        setEpisodes(d?.episodes ?? []);
        setPlaylistInput(d?.youtubePlaylistId ?? "");
        const edits = {};
        (d?.episodes ?? []).forEach((ep) => {
          edits[ep.id] = {
            jobId: ep.jobId ?? "",
            scheduledPublishAt: ep.scheduledPublishAt ? ep.scheduledPublishAt.slice(0, 16) : "",
            status: ep.status ?? "draft",
          };
        });
        setEpisodeEdits(edits);
      })
      .catch(() => {
        setDetail(null);
        setEpisodes([]);
      });
  }, []);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const handleCreateSeries = async () => {
    if (!newTitle.trim()) return;
    try {
      const row = await shortsApi.createContentSeries({
        title: newTitle.trim(),
        genre: newGenre,
      });
      setNewTitle("");
      loadSeries();
      setSelectedId(row.id);
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Error");
    }
  };

  const handleSaveSeries = async () => {
    if (!selectedId) return;
    try {
      await shortsApi.patchContentSeries(selectedId, {
        youtubePlaylistId: playlistInput.trim() || null,
      });
      loadDetail(selectedId);
      loadSeries();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Error");
    }
  };

  const handleDeleteSeries = async () => {
    if (!selectedId || !window.confirm("Delete this series and all episodes?")) return;
    try {
      await shortsApi.deleteContentSeries(selectedId);
      setSelectedId(null);
      setDetail(null);
      setEpisodes([]);
      loadSeries();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Error");
    }
  };

  const handleChunk = async () => {
    if (!selectedId || !manuscript.trim()) return;
    setChunkLoading(true);
    try {
      await shortsApi.chunkSeriesText(selectedId, {
        text: manuscript,
        charsPerEpisode,
        titlePrefix: detail?.title?.slice(0, 40) || "Ep",
      });
      setManuscript("");
      loadDetail(selectedId);
      loadSeries();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Error");
    } finally {
      setChunkLoading(false);
    }
  };

  const handleSaveEpisode = async (episodeId) => {
    if (!selectedId) return;
    const ed = episodeEdits[episodeId];
    if (!ed) return;
    try {
      await shortsApi.patchSeriesEpisode(selectedId, episodeId, {
        jobId: ed.jobId?.trim() || null,
        scheduledPublishAt: ed.scheduledPublishAt ? new Date(ed.scheduledPublishAt).toISOString() : null,
        status: ed.status,
      });
      loadDetail(selectedId);
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Error");
    }
  };

  const loadPipelineHint = () => {
    const g = detail?.genre || newGenre;
    shortsApi.getSerialPipelineHint(g).then(setHint).catch(() => setHint(null));
  };

  const loadMusic = () => {
    shortsApi.getMusicVideoInfo().then(setMusicInfo).catch(() => setMusicInfo(null));
  };

  return (
    <div className="p-6 lg:p-8 pb-24 max-w-5xl mx-auto">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" />
            {t("serialProjects.pageTitle")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("serialProjects.pageSubtitle")}</p>
        </div>
        <Link
          to="/shorts"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          {t("serialProjects.openShorts")}
          <ExternalLink className="w-4 h-4" />
        </Link>
      </header>

      <SectionCard title={t("serialProjects.newSeries")} className="mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">{t("serialProjects.seriesTitle")}</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="rounded border border-border bg-background px-3 py-2 text-sm min-w-[200px]"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">{t("serialProjects.genre")}</label>
            <select
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleCreateSeries}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {t("serialProjects.create")}
          </button>
        </div>
      </SectionCard>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <SectionCard title={t("serialProjects.episodes")}>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : seriesList.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("serialProjects.noSeries")}</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {seriesList.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                      selectedId === s.id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <span className="font-medium block truncate">{s.title}</span>
                    <span className="text-xs text-muted-foreground">{s.genre}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={loadSeries}
            className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            {t("common.refresh")}
          </button>
        </SectionCard>

        <SectionCard title={t("serialProjects.loadHint")}>
          <button
            type="button"
            onClick={loadPipelineHint}
            className="text-sm text-primary hover:underline mb-2"
          >
            {t("serialProjects.loadHint")} ({detail?.genre || newGenre})
          </button>
          {hint?.steps && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">{t("serialProjects.hintSteps")}</p>
              <ol className="list-decimal pl-4 space-y-1">
                {hint.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm font-medium flex items-center gap-2 mb-2">
              <Music className="w-4 h-4" />
              {t("serialProjects.musicInfoTitle")}
            </p>
            <button
              type="button"
              onClick={loadMusic}
              className="text-sm text-primary hover:underline"
            >
              {t("serialProjects.musicInfoBtn")}
            </button>
            {musicInfo && (
              <div className="mt-2 text-xs text-muted-foreground space-y-2">
                <p>{musicInfo.licenseReminder}</p>
                <ul className="list-disc pl-4">
                  {(musicInfo.pipeline || []).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {!selectedId && (
        <p className="text-sm text-muted-foreground mb-6">{t("serialProjects.selectSeries")}</p>
      )}

      {selectedId && detail && (
        <>
          <SectionCard title={detail.title} className="mb-6">
            <p className="text-xs text-muted-foreground mb-3">{t("serialProjects.linkShortsHint")}</p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-muted-foreground block mb-1">{t("serialProjects.playlistId")}</label>
                <input
                  value={playlistInput}
                  onChange={(e) => setPlaylistInput(e.target.value)}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveSeries}
                className="rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm hover:bg-muted/50"
              >
                {t("serialProjects.saveSeries")}
              </button>
              <button
                type="button"
                onClick={handleDeleteSeries}
                className="rounded-lg border border-destructive/40 text-destructive px-4 py-2 text-sm inline-flex items-center gap-1 hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                {t("serialProjects.deleteSeries")}
              </button>
            </div>
          </SectionCard>

          <SectionCard title={t("serialProjects.manuscript")} className="mb-6">
            <textarea
              value={manuscript}
              onChange={(e) => setManuscript(e.target.value)}
              rows={6}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm font-mono"
              placeholder="…"
            />
            <div className="flex flex-wrap gap-3 items-center mt-3">
              <label className="text-xs text-muted-foreground flex items-center gap-2">
                {t("serialProjects.charsPerEpisode")}
                <input
                  type="number"
                  min={200}
                  max={20000}
                  value={charsPerEpisode}
                  onChange={(e) => setCharsPerEpisode(parseInt(e.target.value, 10) || 2500)}
                  className="w-24 rounded border border-border px-2 py-1 text-sm"
                />
              </label>
              <button
                type="button"
                disabled={chunkLoading}
                onClick={handleChunk}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {chunkLoading ? t("common.loading") : t("serialProjects.chunkBtn")}
              </button>
            </div>
          </SectionCard>

          <SectionCard title={`${t("serialProjects.episodes")} (${episodes.length})`}>
            {episodes.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="py-2 pr-2">{t("serialProjects.episodeIndex")}</th>
                      <th className="py-2 pr-2">{t("serialProjects.episodeTitle")}</th>
                      <th className="py-2 pr-2">{t("serialProjects.status")}</th>
                      <th className="py-2 pr-2">jobId</th>
                      <th className="py-2 pr-2">{t("serialProjects.scheduledAt")}</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {episodes.map((ep) => (
                      <tr key={ep.id} className="border-b border-border/60 align-top">
                        <td className="py-2 pr-2 font-mono text-xs">{ep.episodeIndex}</td>
                        <td className="py-2 pr-2 max-w-[140px] truncate" title={ep.title}>
                          {ep.title}
                        </td>
                        <td className="py-2 pr-2">
                          <select
                            value={episodeEdits[ep.id]?.status ?? ep.status}
                            onChange={(e) =>
                              setEpisodeEdits((prev) => ({
                                ...prev,
                                [ep.id]: { ...prev[ep.id], status: e.target.value },
                              }))
                            }
                            className="rounded border border-border bg-background text-xs px-1 py-1"
                          >
                            <option value="draft">draft</option>
                            <option value="queued">queued</option>
                            <option value="published">published</option>
                          </select>
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            value={episodeEdits[ep.id]?.jobId ?? ""}
                            onChange={(e) =>
                              setEpisodeEdits((prev) => ({
                                ...prev,
                                [ep.id]: { ...prev[ep.id], jobId: e.target.value },
                              }))
                            }
                            placeholder={t("serialProjects.jobIdPlaceholder")}
                            className="w-full min-w-[120px] rounded border border-border bg-background px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="datetime-local"
                            value={episodeEdits[ep.id]?.scheduledPublishAt ?? ""}
                            onChange={(e) =>
                              setEpisodeEdits((prev) => ({
                                ...prev,
                                [ep.id]: { ...prev[ep.id], scheduledPublishAt: e.target.value },
                              }))
                            }
                            className="rounded border border-border bg-background px-1 py-1 text-xs"
                          />
                        </td>
                        <td className="py-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEpisode(ep.id)}
                            className="text-xs text-primary hover:underline whitespace-nowrap"
                          >
                            {t("serialProjects.saveEpisode")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
