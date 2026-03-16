/**
 * Shorts 배포 에이전트: 로컬 mp4 → 다중 플랫폼 (YouTube 실제 연동, TikTok/Instagram/Facebook 스텁)
 */
import { uploadVideo as youtubeUploadVideo, getConnectionStatus as getYoutubeConnectionStatus } from "../youtubeUploadService.js";

export type DeployPlatform = "youtube" | "tiktok" | "instagram" | "facebook";

export const DEPLOY_PLATFORMS: DeployPlatform[] = ["youtube", "tiktok", "instagram", "facebook"];

export interface DeployMeta {
  title: string;
  description?: string;
}

export interface DeployResult {
  videoId: string;
  url: string;
}

export async function deployToYouTube(
  videoPath: string,
  meta: DeployMeta,
  youtubeKey: string = "default"
): Promise<DeployResult> {
  const { connected } = getYoutubeConnectionStatus(youtubeKey);
  if (connected) {
    const result = await youtubeUploadVideo(videoPath, meta, youtubeKey);
    if ("error" in result) throw new Error(result.error);
    return { videoId: result.videoId, url: result.url };
  }
  return {
    videoId: "stub-video-id",
    url: "https://www.youtube.com/shorts/stub-video-id",
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

/** 선택한 플랫폼들에 순차 배포. YouTube는 youtubeKey 사용. */
export async function deployToPlatforms(
  videoPath: string,
  meta: DeployMeta,
  platforms: DeployPlatform[],
  youtubeKey: string = "default"
): Promise<DeployToPlatformsResult> {
  const results: Partial<Record<DeployPlatform, DeployResult>> = {};
  const errors: Partial<Record<DeployPlatform, string>> = {};
  const unique = [...new Set(platforms)].filter((p) => DEPLOY_PLATFORMS.includes(p));
  for (const platform of unique) {
    try {
      if (platform === "youtube") {
        results.youtube = await deployToYouTube(videoPath, meta, youtubeKey);
      } else if (platform === "tiktok") {
        results.tiktok = await deployToTikTok(videoPath, meta);
      } else if (platform === "instagram") {
        results.instagram = await deployToInstagram(videoPath, meta);
      } else if (platform === "facebook") {
        results.facebook = await deployToFacebook(videoPath, meta);
      }
    } catch (e) {
      errors[platform] = e instanceof Error ? e.message : String(e);
    }
  }
  return { results, errors };
}
