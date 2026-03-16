# 초기 사용자 생성 (시드)

Supabase Auth에 **관리자**와 **일반 사용자**를 한 번만 생성할 때 사용합니다.  
비밀번호는 코드에 넣지 않고 **환경 변수**로만 전달합니다.

---

## 1. 백엔드 .env에 변수 추가

`backend/.env`에 아래 네 개를 **임시로** 추가합니다. (실제 비밀번호를 입력하세요.)

```env
SEED_ADMIN_EMAIL=admin@yuanto.com
SEED_ADMIN_PASSWORD=관리자비밀번호
SEED_USER_EMAIL=antonio@yuanto.com
SEED_USER_PASSWORD=사용자비밀번호
```

이미 있어야 하는 값: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. 시드 실행

```bash
cd backend
npm run seed-users
```

- 관리자: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` → `app_metadata.role = "admin"`
- 추가 사용자: `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` → `app_metadata.role = "user"`

이미 동일 이메일로 사용자가 있으면 "already exists, skipping" 이라고 나오고 넘어갑니다.

---

## 3. 보안

- 시드 실행 후 **.env에서 위 네 변수 삭제 또는 주석 처리**를 권장합니다.
- `SEED_*` 비밀번호는 **저장소에 커밋하지 마세요.**
