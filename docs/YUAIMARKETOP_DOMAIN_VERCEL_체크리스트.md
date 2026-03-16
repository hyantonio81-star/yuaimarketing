# yuaimarketop.com 도메인·Vercel 연결 체크리스트

Google Workspace에서 도메인을 구매한 뒤 랜딩(예: yuaimarketing.vercel.app)을 **www.yuaimarketop.com**으로 연결할 때 확인할 항목입니다.

---

## 1. 도메인 활성화 대기 (DNS 전파)

| 항목 | 내용 |
|------|------|
| **소요 시간** | 최대 48시간 (보통 몇 시간~24시간) |
| **확인** | 구매·DNS 변경 직후에는 전파 중일 수 있으므로 24~48시간 기다린 뒤 아래 단계 진행 |
| **전파 확인** | [whatsmydns.net](https://www.whatsmydns.net)에서 도메인 입력 후 전 세계 DNS 응답 확인 |

---

## 2. 이메일 인증 (ICANN) — 가장 빈번한 실패 원인

| 항목 | 내용 |
|------|------|
| **필수** | 도메인 구매 후 Google(또는 등록 대행)에서 발송한 **「이메일 주소 확인」** 메일 처리 |
| **확인 위치** | 워크스페이스 관리자 이메일 또는 구매 시 입력한 보조 이메일 |
| **조치** | 메일 내 **인증 링크 클릭** 완료 |
| **미완료 시** | 도메인이 일시 정지(Suspended)되어 연결·이메일 모두 작동하지 않음 |

---

## 3. Google 관리자 콘솔에서 도메인 상태 확인

| 단계 | 내용 |
|------|------|
| 1 | [admin.google.com](https://admin.google.com) 로그인 |
| 2 | **계정** → **도메인** → **도메인 관리** |
| 3 | yuaimarketop.com 상태가 **활성(Active)** 인지 확인 |

---

## 4. Vercel에 도메인 연결

| 단계 | 내용 |
|------|------|
| 1 | Vercel 대시보드 → 프로젝트 선택 → **Settings** → **Domains** |
| 2 | **Add** → `www.yuaimarketop.com` (및 필요 시 `yuaimarketop.com`) 입력 |
| 3 | Vercel이 안내하는 **DNS 레코드** 확인 |

### Google Domains(Workspace) DNS 설정

| 레코드 유형 | 이름 | 값(Value) | 비고 |
|-------------|------|-----------|------|
| **A** | `@` (또는 루트) | Vercel이 안내한 IP (예: 76.76.21.21) | 루트 도메인용 |
| **CNAME** | `www` | `cname.vercel-dns.com` | www 서브도메인용 |

※ 실제 값은 **Vercel Domains 화면에 표시된 값**을 그대로 사용하세요.

---

## 5. Google Search Console 소유권 (선택)

도메인을 Search Console에서 쓰려면:

| 항목 | 내용 |
|------|------|
| **방법** | Google이 안내하는 **TXT 레코드**를 DNS에 추가 |
| **위치** | Google Domains(Workspace) → DNS 설정에 TXT 레코드 추가 |

---

## 6. 연결 후 확인

| 확인 항목 | 기대 결과 |
|-----------|-----------|
| 브라우저에서 `https://www.yuaimarketop.com` 접속 | Vercel에 배포한 사이트가 열림 |
| Vercel Domains 화면 | 도메인 상태 **Valid** / **Configured** |
| "Invalid Configuration" 표시 시 | DNS 값(A/CNAME) 재확인, 전파 대기 후 다시 확인 |

---

## 7. 문제 해결

| 증상 | 확인할 것 |
|------|------------|
| 연결이 안 됨 | ① 이메일 인증 완료 여부 ② DNS 전파(48시간 대기) ③ A/CNAME 값 오타 |
| Vercel "Invalid Configuration" | Domains 탭에서 요구하는 **정확한 레코드 값** 복사 후 DNS에 재입력 |
| www만 되고 루트 안 됨 | 루트용 A 레코드 추가 또는 Vercel에서 리다이렉트(루트 → www) 설정 |

---

## 참고

- [YUAIMARKETOP_HOMEPAGE_기획.md](./YUAIMARKETOP_HOMEPAGE_기획.md) — 랜딩 구조·기술 권장
- [DEPLOYMENT_VERCEL.md](./DEPLOYMENT_VERCEL.md) — Vercel 배포·Root Directory
