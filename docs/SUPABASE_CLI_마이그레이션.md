# Supabase 마이그레이션 적용 방법

프로젝트 ref: `kcqtprumfynuuxvpfjfy` (URL의 서브도메인과 동일)

## 방법 A — SQL Editor (가장 단순, CLI 불필요)

1. Supabase 대시보드 → **SQL Editor** → **New query**
2. 저장소의 `supabase/migrations/20260225120000_shorts_analytics.sql` 파일 **전체** 복사 → 붙여넣기 → **Run**

이미 테이블이 있으면 `CREATE TABLE IF NOT EXISTS`만 건너뛰고 나머지는 그대로 두면 됩니다.

---

## 방법 B — Supabase CLI (`db push`, 대시보드 안내와 동일 계열)

1. [Supabase CLI](https://supabase.com/docs/guides/cli) 설치 후 터미널에서:

```bash
cd nexus-ai
```

2. 아직 없으면 한 번만 초기화 ( `supabase/config.toml` 생성):

```bash
supabase init
```

3. 프로젝트 연결 (대시보드에 나온 ref 사용):

```bash
supabase link --project-ref kcqtprumfynuuxvpfjfy
```

로그인·DB 비밀번호 입력을 요구하면 대시보드 **Project Settings → Database**에서 확인합니다.

4. 로컬 `supabase/migrations/` 안의 SQL을 원격에 반영:

```bash
supabase db push
```

---

## `migration new "new-migration"` 은 언제 쓰나요?

- **새로 테이블/컬럼을 추가로 만들 때** 로컬에 빈 마이그레이션 파일을 만들 때 사용합니다.
- 이미 `20260225120000_shorts_analytics.sql`가 있으므로, **그 파일을 수정·추가하는 방식**으로 이어가면 됩니다. 꼭 `new-migration`을 또 만들 필요는 없습니다.

---

## 주의

- **방법 A와 B를 둘 다 실행**하면 같은 테이블을 두 번 만들려다 `IF NOT EXISTS` 덕분에 대부분 무해하지만, 정책/주석 중복 실행은 피하려면 **한 가지만** 선택하는 것이 좋습니다.
- 원격 DB에 이미 수동으로 만든 객체와 충돌하면 `db push`가 경고를 낼 수 있습니다. 그때는 SQL Editor로 해당 구문만 조정하세요.
