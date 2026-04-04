/**
 * Vercel 등 FFmpeg 없는 환경에서 조립 자산을 Storage에 올리고 워커용 매니페스트 생성
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { uploadAssemblyBuffer } from "../shortsStorage.js";
import type { RemoteAssemblyManifest, ShortsScript } from "./shortsTypes.js";
import type { SceneImageResult } from "./shortsTypes.js";
import type { SceneAudioResult } from "./shortsTypes.js";

export async function buildRemoteAssemblyManifest(
  jobId: string,
  script: ShortsScript,
  sceneImages: SceneImageResult[],
  sceneAudios: SceneAudioResult[],
  bgmPath: string | null | undefined,
  bgmVolume: number
): Promise<RemoteAssemblyManifest | null> {
  const sceneImageUrls: { sceneIndex: number; imageUrl: string }[] = [];
  for (const img of sceneImages) {
    if (!img?.imageUrl) continue;
    sceneImageUrls.push({ sceneIndex: img.sceneIndex, imageUrl: img.imageUrl });
  }
  if (sceneImageUrls.length === 0) return null;

  const sceneAudioUrls: { sceneIndex: number; audioUrl: string }[] = [];
  for (const a of sceneAudios) {
    if (!a?.audioPath || !existsSync(a.audioPath)) continue;
    const buf = await readFile(a.audioPath);
    const ext = a.audioPath.toLowerCase().endsWith(".wav") ? "wav" : "mp3";
    const ct = ext === "wav" ? "audio/wav" : "audio/mpeg";
    const url = await uploadAssemblyBuffer(jobId, `voice_${a.sceneIndex}.${ext}`, buf, ct);
    if (!url) return null;
    sceneAudioUrls.push({ sceneIndex: a.sceneIndex, audioUrl: url });
  }

  let bgmUrl: string | undefined;
  if (bgmPath && existsSync(bgmPath)) {
    const bbuf = await readFile(bgmPath);
    const ext = bgmPath.toLowerCase().endsWith(".wav") ? "wav" : "mp3";
    const ct = ext === "wav" ? "audio/wav" : "audio/mpeg";
    const u = await uploadAssemblyBuffer(jobId, `bgm.${ext}`, bbuf, ct);
    if (u) bgmUrl = u;
  }

  return {
    schemaVersion: 1,
    sceneImageUrls,
    sceneAudioUrls,
    bgmUrl,
    bgmVolume,
    script,
  };
}
