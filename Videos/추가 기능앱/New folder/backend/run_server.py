# -*- coding: utf-8 -*-
"""
첫 번째 API 서버 구동 스크립트.
  python run_server.py
또는
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
