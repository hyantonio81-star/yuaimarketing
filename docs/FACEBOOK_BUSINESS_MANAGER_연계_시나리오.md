# Facebook Business Manager 연계 시나리오

yuaimarketing(nexus-ai)과 Facebook Business Manager(BM)를 연계해 광고·페이지·인스타·픽셀을 한곳에서 관리하는 기획 및 설정 가이드입니다.

**관련 문서**: [B2B_WHATSAPP_AND_FIELD_PLAYBOOK.md](./B2B_WHATSAPP_AND_FIELD_PLAYBOOK.md), [AFFILIATE_HUB_STRUCTURE.md](./AFFILIATE_HUB_STRUCTURE.md).

---

## 1. Business Manager를 쓰는 이유

- **광고·페이지·인스타·에셋을 한 계정에서** 관리하고, 팀 권한·결제·퍼포먼스를 한곳에서 조회.
- yuaimarketing은 **B2C(제품·afiliado)·블로그·B2B 리드**를 함께 쓰므로, BM으로 “메타 채널 전체”를 하나의 비즈니스 단위로 묶는 것이 목표.

---

## 2. 계정 생성 순서

| 단계 | 내용 |
|------|------|
| 1 | [business.facebook.com](https://business.facebook.com) 접속 → **Create Account** |
| 2 | **비즈니스 이름**: yuaimarketing (또는 법인/서비스명) |
| 3 | **본인 이름·이메일** 입력 → 이메일 인증 |
| 4 | **비즈니스 정보** (선택): 주소·웹사이트(nexus-ai 배포 URL 또는 랜딩 URL) |
| 5 | 완료 후 **Business Settings**에서 **페이지·광고 계정·픽셀·카탈로그** 등 추가·연결 |

---

## 3. BM 에셋과 nexus-ai 연계

| BM 에셋 | 용도 | nexus-ai/외부와의 연계 |
|---------|------|------------------------|
| **Facebook 페이지** | 브랜드·이벤트·제품 소식 | 공개 홈페이지·랜딩(Notion/Linktree) 링크 걸기 |
| **Instagram 계정** | 제품·블로그 요약·리els | 콘텐츠 허브 → 소셜 확장 채널로 활용 |
| **광고 계정 (Ad account)** | 유료 광고 집행 | 랜딩·nexus-ai 로그인·B2C 제품 페이지로 트래픽 유도 |
| **픽셀 / Conversions API** | 방문·가입·전환 측정 | nexus-ai 배포 URL·랜딩에 픽셀 설치 또는 CAPI로 서버 연동 |
| **카탈로그 (Commerce)** | B2C·afiliado 제품 노출 | 제품 피드 연동 시 Commerce/동적 광고에 사용 |
| **WhatsApp Business** (선택) | B2B 리드·문의 | 기존 B2B 플레이북(WhatsApp 템플릿)과 수동/자동 연동 |

---

## 4. 연계 플로우 요약

```
[콘텐츠 허브: nexus-ai]
    → 블로그/제품 분석 요약문·이미지 생성
         ↓
[BM: 페이지·인스타]
    → 동일 콘텐츠를 페이스북·인스타 포스트로 게시
         ↓
[BM: 광고 계정]
    → 중요 포스트/랜딩/제품 페이지로 부스팅 또는 캠페인
         ↓
[픽셀 / CAPI]
    → 랜딩·nexus-ai 방문/가입/전환 수집
         ↓
[nexus-ai 대시보드·B2B 리드]
    → (선택) 전환/리드 수치를 내부 KPI·리포트에 반영
```

- **B2C·afiliado**: BM 광고 → 랜딩/제품 페이지 → 픽셀 전환 → (선택) nexus-ai에서 리드/전환 수 집계.
- **B2B**: WhatsApp Business를 BM에 연결해 두면, 기존 B2B 발송 플로우와 “채널”만 통일.

---

## 5. 단계별 진행 (Phase)

| Phase | 작업 | 비고 |
|-------|------|------|
| **1** | BM 계정 생성, 비즈니스/웹사이트 정보 입력 | 위 §2 순서대로 |
| **2** | 페이지·인스타 연결(또는 생성), 프로필에 nexus-ai/랜딩 URL 기재 | 콘텐츠 허브와 소셜 일치 |
| **3** | 광고 계정 생성·결제 수단 추가, 픽셀 생성 후 랜딩(또는 nexus-ai 프론트)에 설치 | 전환 측정 준비 |
| **4** | (선택) 카탈로그 생성 후 B2C·afiliado 제품 피드 연동 | 동적 광고·커머스용 |
| **5** | 소액 부스팅 또는 트래픽 캠페인 테스트 → 픽셀 이벤트 확인 | 연계 검증 |
| **6** | (선택) WhatsApp Business를 BM에 연결, B2B 리드 채널 정책 통일 | 기존 플레이북과 병행 |

---

## 6. nexus-ai 측 설정

### 6.1 환경 변수 (픽셀 / CAPI용)

- **프론트엔드** (`frontend/.env`): `VITE_META_PIXEL_ID=픽셀ID` — 픽셀 스니펫에서 사용.
- **백엔드** (`backend/.env`):  
  - `META_PIXEL_ID=픽셀ID`  
  - `META_APP_ID=앱ID` (선택, Conversions API용)  
  - `META_ACCESS_TOKEN=시스템유저토큰` (선택, CAPI 전송용)

### 6.2 픽셀 스니펫 설치 위치

- **옵션 A**: `frontend/index.html`의 `<head>` 안에 Meta 픽셀 기본 스니펫 추가.  
  - 픽셀 ID는 빌드 시 `VITE_META_PIXEL_ID`로 치환하거나, 수동으로 입력.
- **옵션 B**: 공개 랜딩(Notion/Linktree/별도 HTML)에 동일 픽셀 스니펫 설치.

**예시 (Meta 기본 스니펫)**:

```html
<!-- Meta Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"/></noscript>
<!-- End Meta Pixel Code -->
```

- `YOUR_PIXEL_ID`를 BM에서 발급한 픽셀 ID로 교체.
- 전환 이벤트(가입, 구매 등)는 [Meta 이벤트 문서](https://developers.facebook.com/docs/meta-pixel/reference) 참고해 `fbq('track', 'Lead')` 등 추가.

### 6.3 Conversions API (선택)

- 서버에서 전환 이벤트를 직접 Meta로 보내려면 Conversions API 사용.
- 백엔드에 `META_ACCESS_TOKEN`(시스템 사용자 토큰), 픽셀 ID, 이벤트명을 넣어 POST 요청하는 모듈 추가 가능. (별도 구현)

---

## 7. Threads와의 관계

- Threads는 이미 메타 계정으로 게시하므로, BM과는 “같은 메타 에코시스템”으로 관리만 통일하면 됨.
- BM에서 **Instagram 계정**을 연결해 두면, Threads·인스타·페이스북 페이지를 한 BM에서 일괄 관리 가능.

---

## 8. 체크리스트 (설정 완료 확인)

- [ ] BM 계정 생성 완료
- [ ] 비즈니스 정보·웹사이트 URL 입력
- [ ] Facebook 페이지·Instagram 계정 BM에 연결
- [ ] 광고 계정 생성·결제 수단 추가
- [ ] 픽셀 생성 후 `VITE_META_PIXEL_ID` / `META_PIXEL_ID` 설정
- [ ] 랜딩 또는 nexus-ai 프론트에 픽셀 스니펫 설치
- [ ] (선택) 카탈로그·WhatsApp Business 연결
- [ ] 소액 캠페인 또는 부스팅으로 픽셀 이벤트 수신 확인

이 문서를 기준으로 BM 생성 후 단계별로 연계하면 됩니다.
