# 공장장 대시보드 & 현장 체크리스트 (React)

- **공장장 대시보드** (`/`): 부서별 이행률 차트, AI 진단 요약, 등급표
- **현장 체크리스트** (`/mobile`): 오늘 할 업무 터치 체크, 진행률

## 실행

1. 백엔드 먼저 실행 (port 8000):
   ```bash
   cd ../backend && pip install -r requirements.txt && python run_server.py
   ```
2. 프론트엔드:
   ```bash
   npm install && npm run dev
   ```
   http://localhost:5173 접속

API는 Vite 프록시로 ` /api` → `http://localhost:8000` 연결됨.
