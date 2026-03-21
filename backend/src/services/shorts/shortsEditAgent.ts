/**
 * Shorts 편집/조립 에이전트: 이미지 + TTS + BGM → mp4
 * FFmpeg 사용. 미설치 시 스텁 경로 반환.
 */
import { exec, execSync } from "child_process";
import { promisify } from "util";
import { mkdtemp, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import type { ShortsScript } from "./shortsTypes.js";
import type { SceneImageResult } from "./shortsTypes.js";
import type { SceneAudioResult } from "./shortsTypes.js";

const execAsync = promisify(exec);

export interface AssembleInput {
  script: ShortsScript;
  sceneImages: SceneImageResult[];
  sceneAudios: SceneAudioResult[];
  bgmPath?: string | null;
  /** BGM 볼륨 비율 (0~1). 기본 0.15 */
  bgmVolume?: number;
}

export interface AssembleResult {
  videoPath: string;
  thumbnailPath: string;
  durationSeconds: number;
  fromStub: boolean;
}

function getFfmpegPath(): string | null {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return "ffmpeg";
  } catch {
    return null;
  }
}

/** 이미지 URL을 임시 파일로 다운로드 */
async function downloadImage(url: string, path: string): Promise<void> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(path, buf);
}

/**
 * 이미지 시퀀스 + TTS 오디오 + BGM(선택) → mp4
 * FFmpeg 없으면 스텁 반환.
 */
export async function assembleVideo(input: AssembleInput): Promise<AssembleResult> {
  const { script, sceneImages, sceneAudios, bgmPath, bgmVolume = 0.15 } = input;
  const durationSeconds = script.totalDurationSeconds;
  const workDir = await mkdtemp(join(tmpdir(), "shorts-edit-"));

  if (!getFfmpegPath()) {
    return {
      videoPath: join(workDir, "stub.mp4"),
      thumbnailPath: join(workDir, "stub-thumb.jpg"),
      durationSeconds,
      fromStub: true,
    };
  }

  try {
    const sortedScenes = [...script.scenes].sort((a, b) => a.sceneIndex - b.sceneIndex);
    const imagePaths: string[] = [];
    for (let i = 0; i < sortedScenes.length; i++) {
      const scene = sortedScenes[i];
      const img = sceneImages.find((s) => s.sceneIndex === scene.sceneIndex);
      if (!img?.imageUrl) continue;
      const ext = img.imageUrl.includes("png") ? "png" : "jpg";
      const p = join(workDir, `scene_${scene.sceneIndex}.${ext}`);
      await downloadImage(img.imageUrl, p);
      imagePaths.push(p);
    }

    if (imagePaths.length === 0) {
      return {
        videoPath: join(workDir, "stub.mp4"),
        thumbnailPath: join(workDir, "stub-thumb.jpg"),
        durationSeconds,
        fromStub: true,
      };
    }

    const scaleFilter = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2";
    const clipPaths: string[] = [];
    for (let i = 0; i < sortedScenes.length; i++) {
      const dur = sortedScenes[i].durationSeconds;
      const clipPath = join(workDir, `clip_${i}.mp4`);
      await execAsync(
        `ffmpeg -y -loop 1 -i "${imagePaths[i]}" -t ${dur} -vf "${scaleFilter}" -r 30 -pix_fmt yuv420p "${clipPath}"`,
        { timeout: 60000 }
      );
      clipPaths.push(clipPath);
    }

    const listPath = join(workDir, "list.txt");
    const listContent = clipPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n");
    await writeFile(listPath, listContent);

    const videoOnlyPath = join(workDir, "video.mp4");
    await execAsync(
      `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${videoOnlyPath}"`,
      { timeout: 60000 }
    );

    const audioPaths = sortedScenes
      .map((s) => sceneAudios.find((a) => a.sceneIndex === s.sceneIndex)?.audioPath)
      .filter((p): p is string => !!p);
    let finalAudioPath: string;

    if (audioPaths.length > 0) {
      const concatListPath = join(workDir, "audio_list.txt");
      const concatList = audioPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n");
      await writeFile(concatListPath, concatList);
      const voicePath = join(workDir, "voice.mp3");
      await execAsync(
        `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${voicePath}"`,
        { timeout: 30000 }
      );

      if (bgmPath) {
        finalAudioPath = join(workDir, "mixed.mp3");
        const vol = Math.max(0.05, Math.min(0.5, bgmVolume));
        await execAsync(
          `ffmpeg -y -i "${voicePath}" -i "${bgmPath}" -filter_complex "[0]volume=1[a];[1]volume=${vol},atrim=0:${durationSeconds}[b];[a][b]amix=inputs=2:duration=first" -t ${durationSeconds} "${finalAudioPath}"`,
          { timeout: 30000 }
        );
      } else {
        finalAudioPath = voicePath;
      }
    } else {
      if (bgmPath) {
        finalAudioPath = join(workDir, "bgm_only.mp3");
        await execAsync(
          `ffmpeg -y -i "${bgmPath}" -t ${durationSeconds} "${finalAudioPath}"`,
          { timeout: 15000 }
        );
      } else {
        finalAudioPath = "";
      }
    }

    const videoPath = join(workDir, "final.mp4");
    
    // 제휴 아이템 오버레이 (텍스트/아이콘) - 2026-03-20 build re-trigger
    let videoFinalPath = videoOnlyPath;
    if (script.affiliateItem) {
      const { name, displayTimingSeconds } = script.affiliateItem;
      const overlayPath = join(workDir, "video_with_aff.mp4");
      const drawtext = `drawtext=text='${name}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.5:boxborderw=10:x=(w-text_w)/2:y=h-200:enable='between(t,${displayTimingSeconds},${durationSeconds})'`;
      try {
        await execAsync(
          `ffmpeg -y -i "${videoOnlyPath}" -vf "${drawtext}" -codec:a copy "${overlayPath}"`,
          { timeout: 60000 }
        );
        videoFinalPath = overlayPath;
      } catch {
        // ignore overlay failure
      }
    }

    if (finalAudioPath) {
      await execAsync(
        `ffmpeg -y -i "${videoFinalPath}" -i "${finalAudioPath}" -c:v libx264 -c:a aac -shortest "${videoPath}"`,
        { timeout: 60000 }
      );
    } else {
      await execAsync(`ffmpeg -y -i "${videoFinalPath}" -c:v libx264 -c:a aac "${videoPath}"`, { timeout: 30000 });
    }

    const thumbnailPath = join(workDir, "thumb.jpg");
    await execAsync(
      `ffmpeg -y -i "${videoPath}" -vframes 1 -f image2 "${thumbnailPath}"`,
      { timeout: 10000 }
    );

    return {
      videoPath,
      thumbnailPath,
      durationSeconds,
      fromStub: false,
    };
  } catch {
    return {
      videoPath: join(workDir, "stub.mp4"),
      thumbnailPath: join(workDir, "stub-thumb.jpg"),
      durationSeconds,
      fromStub: true,
    };
  }
}
