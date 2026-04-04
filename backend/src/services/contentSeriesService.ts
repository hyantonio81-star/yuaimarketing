/**
 * 연재 시리즈·에피소드 CRUD (Supabase content_series / content_episode)
 */
import { getSupabaseAdmin } from "../lib/supabaseServer.js";

export type SeriesGenre = "novel" | "comic" | "music" | "longform" | "shorts";
export type EpisodeStatus = "draft" | "queued" | "published";

export interface ContentSeries {
  id: string;
  userId: string;
  title: string;
  genre: SeriesGenre;
  defaultLanguage: string;
  tone?: string;
  youtubePlaylistId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentEpisode {
  id: string;
  seriesId: string;
  episodeIndex: number;
  title?: string;
  bodyText?: string;
  imageAssetUrl?: string;
  jobId?: string;
  scheduledPublishAt?: string;
  status: EpisodeStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

function mapSeries(row: Record<string, unknown>): ContentSeries {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title ?? ""),
    genre: row.genre as SeriesGenre,
    defaultLanguage: String(row.default_language ?? "ko"),
    tone: row.tone != null ? String(row.tone) : undefined,
    youtubePlaylistId: row.youtube_playlist_id != null ? String(row.youtube_playlist_id) : undefined,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

function mapEpisode(row: Record<string, unknown>): ContentEpisode {
  return {
    id: String(row.id),
    seriesId: String(row.series_id),
    episodeIndex: Number(row.episode_index ?? 0),
    title: row.title != null ? String(row.title) : undefined,
    bodyText: row.body_text != null ? String(row.body_text) : undefined,
    imageAssetUrl: row.image_asset_url != null ? String(row.image_asset_url) : undefined,
    jobId: row.job_id != null ? String(row.job_id) : undefined,
    scheduledPublishAt: row.scheduled_publish_at != null ? String(row.scheduled_publish_at) : undefined,
    status: (row.status as EpisodeStatus) || "draft",
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

function requireSb() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  return sb;
}

export async function listSeriesForUser(userId: string): Promise<ContentSeries[]> {
  const sb = requireSb();
  const { data, error } = await sb
    .from("content_series")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapSeries(r as Record<string, unknown>));
}

export async function getSeriesForUser(userId: string, seriesId: string): Promise<ContentSeries | null> {
  const sb = requireSb();
  const { data, error } = await sb
    .from("content_series")
    .select("*")
    .eq("user_id", userId)
    .eq("id", seriesId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapSeries(data as Record<string, unknown>);
}

export async function createSeries(
  userId: string,
  input: {
    title: string;
    genre: SeriesGenre;
    defaultLanguage?: string;
    tone?: string;
    youtubePlaylistId?: string;
  }
): Promise<ContentSeries> {
  const sb = requireSb();
  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    title: input.title.trim(),
    genre: input.genre,
    default_language: (input.defaultLanguage ?? "ko").trim() || "ko",
    tone: input.tone?.trim() || null,
    youtube_playlist_id: input.youtubePlaylistId?.trim() || null,
    created_at: now,
    updated_at: now,
  };
  const { data, error } = await sb.from("content_series").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return mapSeries(data as Record<string, unknown>);
}

export async function updateSeries(
  userId: string,
  seriesId: string,
  patch: Partial<{
    title: string;
    genre: SeriesGenre;
    defaultLanguage: string;
    tone: string | null;
    youtubePlaylistId: string | null;
  }>
): Promise<ContentSeries | null> {
  const existing = await getSeriesForUser(userId, seriesId);
  if (!existing) return null;
  const sb = requireSb();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title != null) row.title = patch.title.trim();
  if (patch.genre != null) row.genre = patch.genre;
  if (patch.defaultLanguage != null) row.default_language = patch.defaultLanguage.trim();
  if (patch.tone !== undefined) row.tone = patch.tone?.trim() || null;
  if (patch.youtubePlaylistId !== undefined) row.youtube_playlist_id = patch.youtubePlaylistId?.trim() || null;
  const { data, error } = await sb.from("content_series").update(row).eq("id", seriesId).eq("user_id", userId).select("*").single();
  if (error) throw new Error(error.message);
  return mapSeries(data as Record<string, unknown>);
}

export async function deleteSeries(userId: string, seriesId: string): Promise<boolean> {
  const sb = requireSb();
  const { data, error } = await sb.from("content_series").delete().eq("id", seriesId).eq("user_id", userId).select("id");
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function listEpisodesForSeries(userId: string, seriesId: string): Promise<ContentEpisode[]> {
  const series = await getSeriesForUser(userId, seriesId);
  if (!series) return [];
  const sb = requireSb();
  const { data, error } = await sb
    .from("content_episode")
    .select("*")
    .eq("series_id", seriesId)
    .order("episode_index", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapEpisode(r as Record<string, unknown>));
}

export async function createEpisode(
  userId: string,
  seriesId: string,
  input: {
    episodeIndex: number;
    title?: string;
    bodyText?: string;
    imageAssetUrl?: string;
    jobId?: string;
    scheduledPublishAt?: string;
    status?: EpisodeStatus;
    metadata?: Record<string, unknown>;
  }
): Promise<ContentEpisode> {
  const series = await getSeriesForUser(userId, seriesId);
  if (!series) throw new Error("Series not found");
  const sb = requireSb();
  const now = new Date().toISOString();
  const row = {
    series_id: seriesId,
    episode_index: input.episodeIndex,
    title: input.title?.trim() || null,
    body_text: input.bodyText ?? null,
    image_asset_url: input.imageAssetUrl?.trim() || null,
    job_id: input.jobId?.trim() || null,
    scheduled_publish_at: input.scheduledPublishAt?.trim() || null,
    status: input.status ?? "draft",
    metadata: input.metadata ?? {},
    created_at: now,
    updated_at: now,
  };
  const { data, error } = await sb.from("content_episode").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return mapEpisode(data as Record<string, unknown>);
}

export async function updateEpisode(
  userId: string,
  seriesId: string,
  episodeId: string,
  patch: Partial<{
    title: string | null;
    bodyText: string | null;
    imageAssetUrl: string | null;
    jobId: string | null;
    scheduledPublishAt: string | null;
    status: EpisodeStatus;
    metadata: Record<string, unknown>;
  }>
): Promise<ContentEpisode | null> {
  const series = await getSeriesForUser(userId, seriesId);
  if (!series) return null;
  const sb = requireSb();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) row.title = patch.title?.trim() || null;
  if (patch.bodyText !== undefined) row.body_text = patch.bodyText;
  if (patch.imageAssetUrl !== undefined) row.image_asset_url = patch.imageAssetUrl?.trim() || null;
  if (patch.jobId !== undefined) row.job_id = patch.jobId?.trim() || null;
  if (patch.scheduledPublishAt !== undefined) row.scheduled_publish_at = patch.scheduledPublishAt?.trim() || null;
  if (patch.status != null) row.status = patch.status;
  if (patch.metadata != null) row.metadata = patch.metadata;
  const { data, error } = await sb
    .from("content_episode")
    .update(row)
    .eq("id", episodeId)
    .eq("series_id", seriesId)
    .select("*")
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return mapEpisode(data as Record<string, unknown>);
}

export async function deleteEpisode(userId: string, seriesId: string, episodeId: string): Promise<boolean> {
  const series = await getSeriesForUser(userId, seriesId);
  if (!series) return false;
  const sb = requireSb();
  const { data, error } = await sb
    .from("content_episode")
    .delete()
    .eq("id", episodeId)
    .eq("series_id", seriesId)
    .select("id");
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

/** 원고를 목표 글자수 단위로 나누고 에피소드 초안을 연속 인덱스로 생성 */
export async function chunkTextIntoEpisodes(
  userId: string,
  seriesId: string,
  options: { text: string; charsPerEpisode?: number; titlePrefix?: string }
): Promise<ContentEpisode[]> {
  const series = await getSeriesForUser(userId, seriesId);
  if (!series) throw new Error("Series not found");
  const raw = options.text.replace(/\r\n/g, "\n").trim();
  if (!raw) throw new Error("text is empty");
  const chunkSize = Math.max(200, Math.min(20000, options.charsPerEpisode ?? 2500));
  const prefix = (options.titlePrefix ?? "Episode").trim() || "Episode";

  const existing = await listEpisodesForSeries(userId, seriesId);
  let startIndex = existing.length ? Math.max(...existing.map((e) => e.episodeIndex)) + 1 : 1;

  const chunks: string[] = [];
  for (let i = 0; i < raw.length; i += chunkSize) {
    chunks.push(raw.slice(i, i + chunkSize).trim());
  }
  const filtered = chunks.filter((c) => c.length > 0);
  const created: ContentEpisode[] = [];
  for (let i = 0; i < filtered.length; i++) {
    const ep = await createEpisode(userId, seriesId, {
      episodeIndex: startIndex + i,
      title: `${prefix} ${startIndex + i}`,
      bodyText: filtered[i],
      status: "draft",
      metadata: { source: "chunk_text", chunkSize },
    });
    created.push(ep);
  }
  return created;
}

export function serialContentPipelineHint(genre: SeriesGenre): { genre: SeriesGenre; steps: string[] } {
  const base = [
    "Split manuscript: POST /api/shorts/series/:id/episodes/chunk-text or add episodes manually.",
    "Run Shorts Agent for each episode script; paste resulting jobId on the episode row.",
    "Schedule: set scheduledPublishAt on episodes and use distribution queue / cron for publish time.",
    "YouTube playlist: save playlist id on the series (youtubePlaylistId) for manual or API linking.",
  ];
  if (genre === "comic") {
    return {
      genre,
      steps: [
        ...base,
        "Comic cuts: planned extension — per-episode panel script → shortsVisualAgent batch (metadata.panelPrompts).",
      ],
    };
  }
  if (genre === "novel") {
    return {
      genre,
      steps: [
        ...base,
        "Novel: use long or shorts format TTS + scene images from chunked bodyText as script input (manual paste or future auto-script).",
      ],
    };
  }
  return { genre, steps: base };
}

export function musicVideoModeInfo(): {
  mode: string;
  licenseReminder: string;
  pipeline: string[];
} {
  return {
    mode: "music_video",
    licenseReminder:
      "Upload or use only audio you have rights to (original, licensed library, or platform-safe tracks). Document license in episode metadata when applicable.",
    pipeline: [
      "Optional: attach audio URL or path in episode metadata (musicAudioUrl).",
      "Visualizer / album-art Ken Burns assembly is planned in shortsEditAgent (music preset).",
      "Use genre \"music\" on the series and schedule episodes like other serial content.",
    ],
  };
}
