import { isFfmpegAvailable } from "./shortsFfmpegPath.js";

export async function checkFfmpegInstalled(): Promise<boolean> {
  return isFfmpegAvailable();
}
