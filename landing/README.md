# YUAI Marketop 랜딩

www.yuaimarketop.com 용 랜딩·링크 허브. Nexus AI와 연동됩니다.

## 라우트

- `/` — 메인(홈)
- `/links` — 링크 허브 (인스타·Threads 바이오용)
- `/go/:id` — 단축 리다이렉트 (Nexus AI 백엔드 `GET /api/go/:id`로 이동)
- `/p/:slug` — 제품·캠페인별 랜딩 (추후 연동)

## 로컬 실행

```bash
cd nexus-ai/landing
npm install
npm run dev
```

브라우저: http://localhost:5174

`/go/:id`가 백엔드로 이동하려면 Nexus AI 백엔드를 띄우고 `.env`에 `VITE_API_URL=http://localhost:4000` 설정.

## 빌드

```bash
npm run build
```

산출물: `dist/`

## Vercel 배포

1. Vercel에서 **새 프로젝트** 생성 후 저장소 연결.
2. **Root Directory**를 `nexus-ai/landing`(또는 `landing`)으로 설정.
3. **Environment Variable**: `VITE_API_URL` = Nexus AI 백엔드 URL (예: `https://nexus-ai.vercel.app`).
4. 배포 후 도메인 `www.yuaimarketop.com` 연결 — [YUAIMARKETOP_DOMAIN_VERCEL_체크리스트.md](../docs/YUAIMARKETOP_DOMAIN_VERCEL_체크리스트.md) 참고.
