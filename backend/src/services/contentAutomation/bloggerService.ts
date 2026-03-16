/**
 * Google Blogger 포스트 발행. 실제 연동 시 Blogger API v3 사용.
 * BLOGGER_BLOG_ID, Google OAuth2 credentials 필요.
 */

export interface BloggerPostResult {
  ok: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

/**
 * 블로그 포스트 발행. 현재 스텁: 설정 시 로그만 하고 postUrl 플레이스홀더 반환.
 * 실제: googleapis blogger.posts.insert 호출.
 */
export async function publishToBlogger(
  _blogId: string,
  _title: string,
  _bodyHtml: string,
  _imageUrls: string[] = []
): Promise<BloggerPostResult> {
  const blogId = (process.env.BLOGGER_BLOG_ID ?? "").trim();
  if (!blogId) {
    return { ok: false, error: "BLOGGER_BLOG_ID not set" };
  }
  // TODO: Google OAuth2 + blogger.posts.insert
  // const { google } = await import("googleapis"); ...
  const postId = `blog_stub_${Date.now()}`;
  const postUrl = `https://www.blogger.com/blog/post/edit/${blogId}/${postId}`;
  return { ok: true, postId, postUrl };
}
