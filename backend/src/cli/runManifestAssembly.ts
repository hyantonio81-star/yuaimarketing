/**
 * 원격 조립 워커: 매니페스트 JSON → FFmpeg 조립 → Supabase Storage 업로드
 * Usage (from repo root, with backend/.env):
 *   cd backend && npx tsx src/cli/runManifestAssembly.ts /path/to/manifest.json job-xxx
 */
import "dotenv/config";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createClient } from "@supabase/supabase-js";
import { assembleVideo } from "../services/shorts/shortsEditAgent.js";
import type { RemoteAssemblyManifest } from "../services/shorts/shortsTypes.js";
import type { SceneImageResult, SceneAudioResult } from "../services/shorts/shortsTypes.js";

const BUCKET = "shorts-videos";

async function downloadToFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
}

async function main() {
  const manifestPath = process.argv[2];
  const jobId = process.argv[3];
  if (!manifestPath || !jobId) {
    console.error("Usage: runManifestAssembly.ts <manifest.json> <jobId>");
    process.exit(1);
  }
  const raw = await readFile(manifestPath, "utf-8");
  const manifest = JSON.parse(raw) as RemoteAssemblyManifest;
  if (manifest.schemaVersion !== 1 || !manifest.script) {
    throw new Error("Invalid manifest");
  }

  const workDir = await mkdtemp(join(tmpdir(), "shorts-manifest-"));
  try {
    const sceneImages: SceneImageResult[] = manifest.sceneImageUrls.map((s) => ({
      sceneIndex: s.sceneIndex,
      imageUrl: s.imageUrl,
    }));

    const sceneAudios: SceneAudioResult[] = [];
    for (const a of manifest.sceneAudioUrls) {
      const ext = a.audioUrl.toLowerCase().includes(".wav") ? "wav" : "mp3";
      const p = join(workDir, `voice_${a.sceneIndex}.${ext}`);
      await downloadToFile(a.audioUrl, p);
      sceneAudios.push({ sceneIndex: a.sceneIndex, audioPath: p });
    }

    let bgmPath: string | null = null;
    if (manifest.bgmUrl) {
      const ext = manifest.bgmUrl.toLowerCase().includes(".wav") ? "wav" : "mp3";
      bgmPath = join(workDir, `bgm.${ext}`);
      await downloadToFile(manifest.bgmUrl, bgmPath);
    }

    const result = await assembleVideo({
      script: manifest.script,
      sceneImages,
      sceneAudios,
      bgmPath,
      bgmVolume: manifest.bgmVolume ?? 0.15,
    });

    if (result.fromStub) {
      throw new Error("Assemble returned stub (FFmpeg missing on worker?)");
    }

    const supabaseUrl = (process.env.SUPABASE_URL ?? "").trim();
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
    if (!supabaseUrl || !serviceKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for upload");
    }

    const videoBuf = await readFile(result.videoPath);
    const safeId = jobId.replace(/[^a-zA-Z0-9-_]/g, "_");
    const objectPath = `${safeId}/final.mp4`;
    const supabase = createClient(supabaseUrl, serviceKey);
    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, videoBuf, {
      contentType: "video/mp4",
      upsert: true,
    });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    console.log(JSON.stringify({ ok: true, publicUrl: data.publicUrl }));
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((e) => {
  console.log(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }));
  process.exit(1);
});
