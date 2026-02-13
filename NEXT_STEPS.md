# NEXUS AI — 다음 단계 (LOCAL ↔ REPO 연동)

## 1. Git 사용자 설정 (최초 1회)

커밋을 위해 이름과 이메일을 설정하세요.

```bash
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

## 2. 첫 커밋 완료

```bash
cd c:\Users\ANTONIO YU\Music\Mark01\nexus-ai
git add .
git commit -m "Initial commit: NEXUS AI monorepo (frontend + backend, i18n, Supabase)"
```

## 3. 원격 저장소

연동할 저장소: **https://github.com/hyantonio81-star/yuaimarketing**

## 4. 원격 연결 후 푸시

```bash
cd c:\Users\ANTONIO YU\Music\Mark01\nexus-ai
git remote add origin https://github.com/hyantonio81-star/yuaimarketing.git
git branch -M main
git push -u origin main
```

원격에 이미 README 등 커밋이 있으면 `git push` 시 충돌이 날 수 있습니다. 그때는 다음 중 하나를 선택하세요.

- **로컬 내용으로 덮어쓰기**: `git push -u origin main --force`
- **원격 커밋과 합치기**: `git pull origin main --allow-unrelated-histories` 후 충돌 해결하고 `git push -u origin main`

이후 작업 흐름:

- 변경 후: `git add .` → `git commit -m "메시지"` → `git push`
- 다른 PC에서: `git clone <저장소 URL>` 후 `npm install` (backend, frontend 각각)

## 5. 주의사항

- **`.env`** 파일은 `.gitignore`에 포함되어 있어 커밋되지 않습니다.  
  새 환경에서 실행할 때는 `backend/.env.example`, `frontend/.env.example`를 참고해 `.env`를 직접 만드세요.
- Supabase 서버 권한이 필요하면 `backend/.env`에 `SUPABASE_SERVICE_ROLE_KEY`를 추가하세요. (설명: `docs/SUPABASE_SETUP.md`)
