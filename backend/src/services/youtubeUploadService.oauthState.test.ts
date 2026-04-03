import { describe, it, expect, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import { verifyYoutubeOAuthState, YOUTUBE_LEGACY_USER_SENTINEL } from "./youtubeUploadService.js";

function buildSignedStateLegacy(secret: string, key: string, nonce: string): string {
  const payload = `${key}.${nonce}`;
  const sig = createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  return `v1:${key}:${nonce}:${sig}`;
}

function buildSignedStateV5(secret: string, userId: string, key: string, nonce: string): string {
  const payload = `${userId}.${key}.${nonce}`;
  const sig = createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  return `v1:${userId}:${key}:${nonce}:${sig}`;
}

describe("verifyYoutubeOAuthState", () => {
  const saved = {
    YOUTUBE_OAUTH_STATE_SECRET: process.env.YOUTUBE_OAUTH_STATE_SECRET,
    CONNECTION_PIN_SECRET: process.env.CONNECTION_PIN_SECRET,
  };

  afterEach(() => {
    if (saved.YOUTUBE_OAUTH_STATE_SECRET === undefined) delete process.env.YOUTUBE_OAUTH_STATE_SECRET;
    else process.env.YOUTUBE_OAUTH_STATE_SECRET = saved.YOUTUBE_OAUTH_STATE_SECRET;
    if (saved.CONNECTION_PIN_SECRET === undefined) delete process.env.CONNECTION_PIN_SECRET;
    else process.env.CONNECTION_PIN_SECRET = saved.CONNECTION_PIN_SECRET;
  });

  it("accepts HMAC-signed v1 legacy 4-part state when secret is set", () => {
    process.env.YOUTUBE_OAUTH_STATE_SECRET = "unit-test-oauth-state-secret";
    delete process.env.CONNECTION_PIN_SECRET;
    const nonce = "a".repeat(32);
    const state = buildSignedStateLegacy(process.env.YOUTUBE_OAUTH_STATE_SECRET, "default", nonce);
    expect(verifyYoutubeOAuthState(state)).toEqual({
      userId: YOUTUBE_LEGACY_USER_SENTINEL,
      key: "default",
      nonce,
    });
  });

  it("accepts v5 state with userId", () => {
    process.env.YOUTUBE_OAUTH_STATE_SECRET = "unit-test-oauth-state-secret";
    delete process.env.CONNECTION_PIN_SECRET;
    const uid = "11111111-1111-1111-1111-111111111111";
    const nonce = "c".repeat(32);
    const state = buildSignedStateV5(process.env.YOUTUBE_OAUTH_STATE_SECRET, uid, "yt_1", nonce);
    expect(verifyYoutubeOAuthState(state)).toEqual({ userId: uid, key: "yt_1", nonce });
  });

  it("rejects tampered signature", () => {
    process.env.YOUTUBE_OAUTH_STATE_SECRET = "unit-test-oauth-state-secret";
    delete process.env.CONNECTION_PIN_SECRET;
    const nonce = "b".repeat(32);
    const state = buildSignedStateLegacy(process.env.YOUTUBE_OAUTH_STATE_SECRET, "yt_2", nonce);
    const tampered = state.slice(0, -4) + "ffff";
    expect(verifyYoutubeOAuthState(tampered)).toBeNull();
  });

  it("rejects unsigned state when secret is set", () => {
    process.env.YOUTUBE_OAUTH_STATE_SECRET = "unit-test-oauth-state-secret";
    delete process.env.CONNECTION_PIN_SECRET;
    expect(verifyYoutubeOAuthState("just-a-key")).toBeNull();
  });

  it("treats raw state as account key when no signing secret (legacy)", () => {
    delete process.env.YOUTUBE_OAUTH_STATE_SECRET;
    delete process.env.CONNECTION_PIN_SECRET;
    expect(verifyYoutubeOAuthState("myaccount")).toEqual({
      userId: YOUTUBE_LEGACY_USER_SENTINEL,
      key: "myaccount",
    });
  });

  it("empty state yields sentinel userId and default key", () => {
    process.env.YOUTUBE_OAUTH_STATE_SECRET = "x";
    expect(verifyYoutubeOAuthState("")).toEqual({
      userId: YOUTUBE_LEGACY_USER_SENTINEL,
      key: "default",
    });
    expect(verifyYoutubeOAuthState("   ")).toEqual({
      userId: YOUTUBE_LEGACY_USER_SENTINEL,
      key: "default",
    });
  });
});
