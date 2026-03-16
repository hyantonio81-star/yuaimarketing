/**
 * Shorts BGM 에이전트: 길이/장르/무드에 맞는 BGM 선택 또는 다운로드
 */
import { mkdtemp, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export interface SelectBgmOptions {
  durationSeconds?: number;
  genre?: string;
  mood?: string;
  noBgm?: boolean;
  bgmGenre?: string;
  bgmMood?: string;
  bgmVolume?: number;
}

/** 무료 BGM 샘플 URL (CC0/무료). 장르·무드별로 확장 가능 */
const BGM_SAMPLES: Record<string, string> = {
  default: "https://cdn.pixabay.com/audio/2022/03/10/audio_2a6f738f2b.mp3",
  upbeat: "https://cdn.pixabay.com/audio/2022/05/27/audio_889c32a2c1.mp3",
  calm: "https://cdn.pixabay.com/audio/2022/08/04/audio_0e2d2aaba2.mp3",
  corporate: "https://cdn.pixabay.com/audio/2022/03/10/audio_2a6f738f2b.mp3",
  lofi: "https://cdn.pixabay.com/audio/2022/10/24/audio_35a0f0c825.mp3",
};

/**
 * BGM 파일 경로 반환. noBgm이면 null.
 * bgmGenre/bgmMood에 따라 샘플 선택.
 */
export async function selectBgm(options?: SelectBgmOptions): Promise<string | null> {
  if (options?.noBgm) return null;

  const genre = (options?.bgmGenre ?? options?.genre ?? "default").toLowerCase();
  const mood = (options?.bgmMood ?? options?.mood ?? "").toLowerCase();
  const key = genre && BGM_SAMPLES[genre] ? genre : mood && BGM_SAMPLES[mood] ? mood : "default";
  const url = BGM_SAMPLES[key] ?? BGM_SAMPLES.default;

  const dir = await mkdtemp(join(tmpdir(), "shorts-bgm-"));
  const path = join(dir, "bgm.mp3");

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(path, buf);
    return path;
  } catch {
    return null;
  }
}
