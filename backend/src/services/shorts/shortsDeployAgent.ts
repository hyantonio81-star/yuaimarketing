/**
 * Shorts 배포 에이전트: 로컬 mp4 → 다중 플랫폼 (YouTube 실제 연동, TikTok/Instagram/Facebook 스텁)
 */
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  uploadVideo as youtubeUploadVideo,
  getConnectionStatus as getYoutubeConnectionStatus,
  type YoutubeUploadPreset,
} from "../youtubeUploadService.js";

export type DeployPlatform = "youtube" | "tiktok" | "instagram" | "facebook";

export const DEPLOY_PLATFORMS: DeployPlatform[] = ["youtube", "tiktok", "instagram", "facebook"];

export interface DeployMeta {
  title: string;
  description?: string;
}

export interface DeployResult {
  videoId: string;
  url: string;
  youtubeProcessingStatus?: "processing" | "succeeded" | "failed";
  youtubeProcessingDetail?: string;
}

export async function deployToYouTube(
  videoPath: string,
  meta: DeployMeta,
  youtubeKey: string = "default",
  ownerUserId: string = "",
  uploadPreset: YoutubeUploadPreset = "shorts"
): Promise<DeployResult> {
  const { connected } = await getYoutubeConnectionStatus(youtubeKey, ownerUserId);
  if (!connected) {
    throw new Error(
      "YouTube not connected. Link your Google account in Shorts Agent, then run upload again."
    );
  }
  const result = await youtubeUploadVideo(videoPath, meta, youtubeKey, ownerUserId, { uploadPreset });
  if ("error" in result) throw new Error(result.error);
  return {
    videoId: result.videoId,
    url: result.url,
    youtubeProcessingStatus: result.youtubeProcessingStatus,
    youtubeProcessingDetail: result.youtubeProcessingDetail,
  };
}

/** TikTok 배포 (스텁: 추후 API 연동) */
export async function deployToTikTok(_videoPath: string, meta: DeployMeta): Promise<DeployResult> {
  const id = "tiktok-stub-" + Date.now();
  return { videoId: id, url: `https://www.tiktok.com/@stub/video/${id}` };
}

/** Instagram Reels 배포 (스텁: 추후 API 연동) */
export async function deployToInstagram(_videoPath: string, meta: DeployMeta): Promise<DeployResult> {
  const id = "ig-reel-stub-" + Date.now();
  return { videoId: id, url: `https://www.instagram.com/reel/${id}/` };
}

/** Facebook Reels 배포 (스텁: 추후 API 연동) */
export async function deployToFacebook(_videoPath: string, meta: DeployMeta): Promise<DeployResult> {
  const id = "fb-reel-stub-" + Date.now();
  return { videoId: id, url: `https://www.facebook.com/reel/${id}` };
}

export interface DeployToPlatformsResult {
  results: Partial<Record<DeployPlatform, DeployResult>>;
  errors: Partial<Record<DeployPlatform, string>>;
}

/** 선택한 플랫폼들에 순차 배포. YouTube는 youtubeKey 사용. SEO 최적화 포함. */
export async function deployToPlatforms(
  videoPath: string,
  meta: DeployMeta,
  platforms: DeployPlatform[],
  youtubeKey: string = "default",
  ownerUserId: string = "",
  youtubeUploadPreset: YoutubeUploadPreset = "shorts"
): Promise<DeployToPlatformsResult> {
  const results: Partial<Record<DeployPlatform, DeployResult>> = {};
  const errors: Partial<Record<DeployPlatform, string>> = {};
  
  // SEO 최적화: 제목 및 해시태그 보강
  const optimizedTitle = meta.title.length > 60 ? meta.title.slice(0, 57) + "..." : meta.title;
  const commonHashtags = "#AI #Shorts #Trending #Insight #YUAI";
  const platformHashtags: Record<DeployPlatform, string> = {
    youtube: "#Shorts #Trending",
    tiktok: "#fyp #foryou #viral",
    instagram: "#reels #trending #daily",
    facebook: "#reels #video #viral"
  };

  const unique = [...new Set(platforms)].filter((p) => DEPLOY_PLATFORMS.includes(p));
  for (const platform of unique) {
    try {
      const platformMeta: DeployMeta = {
        title: optimizedTitle,
        description: `${meta.description}\n\n${commonHashtags} ${platformHashtags[platform]}`
      };

      if (platform === "youtube") {
        results.youtube = await deployToYouTube(
          videoPath,
          platformMeta,
          youtubeKey,
          ownerUserId,
          youtubeUploadPreset
        );
      } else if (platform === "tiktok") {
        results.tiktok = await deployToTikTok(videoPath, platformMeta);
      } else if (platform === "instagram") {
        results.instagram = await deployToInstagram(videoPath, platformMeta);
      } else if (platform === "facebook") {
        results.facebook = await deployToFacebook(videoPath, platformMeta);
      }
    } catch (e) {
      errors[platform] = e instanceof Error ? e.message : String(e);
    }
  }
  return { results, errors };
}

/** 공개 URL의 mp4를 임시 파일로 받아 deployToPlatforms 실행 (원격 조립 완료 후) */
export async function deployToPlatformsFromRemoteUrl(
  videoUrl: string,
  meta: DeployMeta,
  platforms: DeployPlatform[],
  youtubeKey: string = "default",
  ownerUserId: string = "",
  youtubeUploadPreset: YoutubeUploadPreset = "shorts"
): Promise<DeployToPlatformsResult> {
  const res = await fetch(videoUrl);
  if (!res.ok) throw new Error(`Failed to download video (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  const dir = await mkdtemp(join(tmpdir(), "shorts-deploy-"));
  const filePath = join(dir, "final.mp4");
  await writeFile(filePath, buf);
  try {
    return await deployToPlatforms(filePath, meta, platforms, youtubeKey, ownerUserId, youtubeUploadPreset);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
