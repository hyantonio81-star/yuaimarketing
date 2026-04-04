/**
 * Shorts 파이프라인 공통 타입 (에이전트 간 입출력)
 */
export interface TrendTopic {
  id: string;
  keyword: string;
  title: string;
  summary: string;
  source: "youtube" | "manual";
  category?: string;
  publishedAt?: string;
  score?: number;
}

/** 음성 프리셋 (TTS용). 실제 엔진 연동 시 voice_id 등으로 매핑 */
export type VoiceGender = "female" | "male" | "neutral";
export type VoiceAge = "child" | "young" | "adult" | "mature";
export type VoiceTone = "bright" | "warm" | "calm" | "friendly" | "authoritative";

export interface VoicePresetOption {
  voicePresetId?: string;
  voiceGender?: VoiceGender;
  voiceAge?: VoiceAge;
  voiceTone?: VoiceTone;
  voiceSpeed?: number;
  voicePitch?: "high" | "medium" | "low";
}

/** 포맷: 숏츠(기본) / 시리즈(여러 편) / 롱(1~3분) */
export type ShortsFormat = "shorts" | "short_series" | "long";

/** BGM 옵션 */
export interface BgmOption {
  noBgm?: boolean;
  bgmGenre?: string;
  bgmMood?: string;
  bgmVolume?: number;
}

export interface ShortsCharacter {
  name: string;
  description: string;
  tone: string;
  imagePromptHint: string;
}

export interface ShortsScriptScene {
  sceneIndex: number;
  text: string;
  imagePrompt: string;
  durationSeconds: number;
}

export interface ShortsScript {
  topicId: string;
  topicTitle: string;
  hook: string;
  character: ShortsCharacter;
  scenes: ShortsScriptScene[];
  totalDurationSeconds: number;
  /** 제휴/홍보 아이템 정보 (추후 확장용) */
  affiliateItem?: {
    id: string;
    name: string;
    iconUrl?: string;
    linkUrl: string;
    displayTimingSeconds: number;
  };
}

/** 원격 FFmpeg 워커가 사용하는 조립 매니페스트 (스토리지 URL만 포함) */
export interface RemoteAssemblyManifest {
  schemaVersion: 1;
  sceneImageUrls: { sceneIndex: number; imageUrl: string }[];
  sceneAudioUrls: { sceneIndex: number; audioUrl: string }[];
  bgmUrl?: string;
  bgmVolume: number;
  script: ShortsScript;
}

/** 원격 조립 완료 후 이어질 업로드 옵션 */
export interface AssemblyFollowup {
  uploadMode: "review_first" | "immediate";
  platforms: ("youtube" | "tiktok" | "instagram" | "facebook")[];
  youtubeKey: string;
  ownerUserId: string;
}

export interface ShortsPipelineJob {
  jobId: string;
  status:
    | "pending"
    | "collecting"
    | "script"
    | "images"
    | "voice"
    | "video"
    | "pending_assembly"
    | "video_ready"
    | "upload"
    | "done"
    | "failed"
    | "reviewing"
    | "queued";
  topic?: TrendTopic;
  script?: ShortsScript;
  videoUrl?: string;
  /** 플랫폼별 배포 URL (youtube, tiktok, instagram, facebook 등) */
  deployedUrls?: Record<string, string>;
  /** 저장된 영상 파일 경로 (video_ready 또는 done 시) */
  videoPath?: string;
  /** Supabase Storage 영구 URL */
  supabaseUrl?: string;
  /** AI의 전략적 선택 근거 (Self-Optimization Reasoning) */
  reasoning?: string;
  /** 보관 만료일 ISO 문자열 (저장 정책용) */
  expiresAt?: string;
  /** 파일 삭제된 시점 (만료/상한 정리 후 체크리스트만 남을 때) */
  fileDeletedAt?: string;
  error?: string;
  /** 파이프라인을 시작한 Supabase 사용자 (YouTube 토큰·배포 시 사용) */
  ownerUserId?: string;
  /** FFmpeg 없음·조립 실패 시 생성된 더미 파일 (실제 Shorts mp4 아님) */
  videoStub?: boolean;
  /** 원격 조립 큐 상태 */
  assemblyStatus?: "none" | "queued" | "processing" | "complete" | "failed";
  assemblyError?: string;
  assemblyManifest?: RemoteAssemblyManifest;
  assemblyFollowup?: AssemblyFollowup;
  /** YouTube 업로드 후 Data API 처리 상태(폴링) */
  youtubeVideoId?: string;
  youtubeProcessingStatus?: "uploaded" | "processing" | "succeeded" | "failed";
  youtubeProcessingDetail?: string;
  /** 업로드 시 YouTube 프리셋 (롱폼 vs Shorts 링크·태그) */
  pipelineFormat?: "shorts" | "long";
  /** 파이프라인에 사용된 YouTube 계정 키 (배포 큐 기본값·메타데이터) */
  youtubeKey?: string;
  /** 실제 스크립트/TTS에 적용된 출력 언어(BCP-47 계열) 스냅샷 */
  outputLanguage?: string;
  /** 다계정 팬아웃 시 첫 번째 작업 jobId */
  parentJobId?: string;
  createdAt: string;
  updatedAt: string;
}

/** 배포 대기열 항목 */
export interface DistributionQueueItem {
  id: string;
  jobId: string;
  platform: "youtube" | "tiktok" | "instagram" | "facebook";
  status: "waiting" | "processing" | "done" | "failed";
  scheduledAt: string;
  publishedAt?: string;
  error?: string;
  retryCount: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface SceneImageResult {
  sceneIndex: number;
  imageUrl: string;
  imagePath?: string;
}

export interface SceneAudioResult {
  sceneIndex: number;
  audioPath: string | null;
}
