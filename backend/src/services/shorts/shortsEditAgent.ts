/**
 * Shorts 편집/조립 에이전트: 이미지 + TTS + BGM → mp4
 * FFmpeg 사용. 미설치 시 스텁 경로 반환.
 */
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync } from "node:fs";
import { mkdtemp, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import type { ShortsScript } from "./shortsTypes.js";
import type { SceneImageResult } from "./shortsTypes.js";
import type { SceneAudioResult } from "./shortsTypes.js";
import { ffmpegShellPrefix, ffmpegExecOptions, isFfmpegAvailable } from "./shortsFfmpegPath.js";

const execAsync = promisify(exec);

const ff = () => ffmpegShellPrefix();

/** FFmpeg 미사용·오류 시에도 copy/upload 단계가 ENOENT로 죽지 않도록 최소 바이트 파일 생성 */
export const SHORTS_STUB_VIDEO_BYTES = 2048;

async function writeStubVideoAssets(
  workDir: string,
  durationSeconds: number
): Promise<AssembleResult> {
  const videoPath = join(workDir, "stub.mp4");
  const thumbnailPath = join(workDir, "stub-thumb.jpg");
  await writeFile(videoPath, Buffer.alloc(SHORTS_STUB_VIDEO_BYTES, 0));
  await writeFile(thumbnailPath, Buffer.alloc(32, 0));
  if (!existsSync(videoPath)) {
    throw new Error(`Shorts stub video was not written: ${videoPath}`);
  }
  return { videoPath, thumbnailPath, durationSeconds, fromStub: true };
}

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

  if (!isFfmpegAvailable()) {
    return writeStubVideoAssets(workDir, durationSeconds);
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
      return writeStubVideoAssets(workDir, durationSeconds);
    }

    // --- 영상 클립 생성 (Ken Burns 효과 + 동적 자막 포함) ---
    const clipPaths: string[] = [];
    for (let i = 0; i < sortedScenes.length; i++) {
      const scene = sortedScenes[i];
      const dur = scene.durationSeconds;
      const clipPath = join(workDir, `clip_${i}.mp4`);
      
      // 1. Ken Burns 효과 (줌인)
      const zoomFilter = `zoompan=z='min(zoom+0.0015,1.5)':d=${dur*30}:s=1080x1920:fps=30`;
      
      // 2. 동적 자막 (텍스트 하단 중앙)
      const sanitizedText = scene.text.replace(/'/g, "\\'").replace(/:/g, "\\:");
      const captionFilter = `drawtext=text='${sanitizedText}':fontcolor=white:fontsize=64:box=1:boxcolor=black@0.4:boxborderw=20:x=(w-text_w)/2:y=h-400`;
      
      const filterComplex = `${zoomFilter},${captionFilter}`;

      await execAsync(
        `${ff()} -y -loop 1 -i "${imagePaths[i]}" -t ${dur} -vf "${filterComplex}" -r 30 -pix_fmt yuv420p -c:v libx264 "${clipPath}"`,
        ffmpegExecOptions({ timeout: 60000 })
      );
      clipPaths.push(clipPath);
    }

    // --- 클립 합치기 (xfade 전환 효과 시도 - 단순화를 위해 일단 concat) ---
    const listPath = join(workDir, "list.txt");
    const listContent = clipPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n");
    await writeFile(listPath, listContent);

    const videoOnlyPath = join(workDir, "video.mp4");
    await execAsync(
      `${ff()} -y -f concat -safe 0 -i "${listPath}" -c copy "${videoOnlyPath}"`,
      ffmpegExecOptions({ timeout: 60000 })
    );

    // --- 오디오 처리 ---
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
        `${ff()} -y -f concat -safe 0 -i "${concatListPath}" -c copy "${voicePath}"`,
        ffmpegExecOptions({ timeout: 30000 })
      );

      if (bgmPath) {
        finalAudioPath = join(workDir, "mixed.mp3");
        const vol = Math.max(0.05, Math.min(0.5, bgmVolume));
        await execAsync(
          `${ff()} -y -i "${voicePath}" -i "${bgmPath}" -filter_complex "[0]volume=1[a];[1]volume=${vol},atrim=0:${durationSeconds}[b];[a][b]amix=inputs=2:duration=first" -t ${durationSeconds} "${finalAudioPath}"`,
          ffmpegExecOptions({ timeout: 30000 })
        );
      } else {
        finalAudioPath = voicePath;
      }
    } else {
      if (bgmPath) {
        finalAudioPath = join(workDir, "bgm_only.mp3");
        await execAsync(
          `${ff()} -y -i "${bgmPath}" -t ${durationSeconds} "${finalAudioPath}"`,
          ffmpegExecOptions({ timeout: 15000 })
        );
      } else {
        finalAudioPath = "";
      }
    }

    const videoPath = join(workDir, "final.mp4");
    
    // --- 제휴 아이템 오버레이 (텍스트/아이콘) ---
    let videoFinalPath = videoOnlyPath;
    if (script.affiliateItem) {
      const { name, displayTimingSeconds } = script.affiliateItem;
      const overlayPath = join(workDir, "video_with_aff.mp4");
      const durationSeconds = script.totalDurationSeconds;
      
      // 더 세련된 스타일: 하단 바 + 텍스트 + CTA
      const barHeight = 120;
      const barY = 1920 - 350;
      
      // 1. 바와 텍스트 오버레이
      let overlayFilter = `drawbox=y=${barY}:h=${barHeight}:color=black@0.6:t=fill:enable='between(t,${displayTimingSeconds},${durationSeconds})',` +
                           `drawtext=text='${name.replace(/'/g, "\\'")}':fontcolor=yellow:fontsize=48:x=(w-text_w)/2:y=${barY + 20}:enable='between(t,${displayTimingSeconds},${durationSeconds})',` +
                           `drawtext=text='CHECK LINK IN BIO':fontcolor=white:fontsize=32:x=(w-text_w)/2:y=${barY + 75}:enable='between(t,${displayTimingSeconds},${durationSeconds})'`;
      
      // 2. QR 코드 추가 (선택 사항 - 모바일 구매 전환용)
      const qrPath = join(workDir, "affiliate_qr.png");
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(script.affiliateItem.linkUrl)}`;
      try {
        await downloadImage(qrUrl, qrPath);
        // QR 코드를 우측 하단에 오버레이
        overlayFilter += `,overlay=x=W-250:y=H-650:enable='between(t,${displayTimingSeconds},${durationSeconds})'`;
        
        await execAsync(
          `${ff()} -y -i "${videoOnlyPath}" -i "${qrPath}" -filter_complex "[0]${overlayFilter}[out]" -map "[out]" -map 0:a? -c:v libx264 -c:a copy "${overlayPath}"`,
          ffmpegExecOptions({ timeout: 60000 })
        );
      } catch (qrErr) {
        console.warn("[QR Overlay Error] Skipping QR code:", qrErr);
        await execAsync(
          `${ff()} -y -i "${videoOnlyPath}" -vf "${overlayFilter}" -c:v libx264 -c:a copy "${overlayPath}"`,
          ffmpegExecOptions({ timeout: 60000 })
        );
      }
      videoFinalPath = overlayPath;
    }

    if (finalAudioPath) {
      await execAsync(
        `${ff()} -y -i "${videoFinalPath}" -i "${finalAudioPath}" -vf "fade=t=in:st=0:d=1,fade=t=out:st=${durationSeconds - 1}:d=1" -c:v libx264 -c:a aac -shortest "${videoPath}"`,
        ffmpegExecOptions({ timeout: 60000 })
      );
    } else {
      await execAsync(
        `${ff()} -y -i "${videoFinalPath}" -vf "fade=t=in:st=0:d=1,fade=t=out:st=${durationSeconds - 1}:d=1" -c:v libx264 -c:a aac "${videoPath}"`,
        ffmpegExecOptions({ timeout: 30000 })
      );
    }

    const thumbnailPath = join(workDir, "thumb.jpg");
    await execAsync(
      `${ff()} -y -i "${videoPath}" -vframes 1 -f image2 "${thumbnailPath}"`,
      ffmpegExecOptions({ timeout: 10000 })
    );

    return {
      videoPath,
      thumbnailPath,
      durationSeconds,
      fromStub: false,
    };
  } catch (e) {
    console.error("[Assemble Error]", e);
    return writeStubVideoAssets(workDir, durationSeconds);
  }
}
