# -*- coding: utf-8 -*-
"""
체크리스트: 내 업무 조회, 이행 체크. DB 또는 샘플.
"""

from datetime import date
from typing import List, Optional

import asyncpg

SAMPLE_TASKS = [
    {"id": 1, "name": "설비 외관 청소 및 윤활유 점검", "done": False},
    {"id": 2, "name": "작업장 바닥 오일 누유 확인", "done": False},
    {"id": 3, "name": "안전 가드 작동 여부 테스트", "done": False},
]
_sample_state: dict = {t["id"]: t["done"] for t in SAMPLE_TASKS}


async def get_my_tasks_from_db(
    conn: asyncpg.Connection,
    user_id: int,
    dept_id: Optional[int],
    target_date: date,
) -> List[dict]:
    """내 부서 체크리스트 + 오늘 이행 여부."""
    if dept_id is None:
        dept_id = await conn.fetchval(
            "SELECT dept_id FROM users WHERE user_id = $1",
            user_id,
        )
    if dept_id is None:
        return []

    rows = await conn.fetch(
        """SELECT c.task_id, c.task_name FROM checklists c
           WHERE c.dept_id = $1 ORDER BY c.task_id""",
        dept_id,
    )
    if not rows:
        return []

    out = []
    for r in rows:
        tid = r["task_id"]
        log = await conn.fetchrow(
            """SELECT status FROM execution_logs
               WHERE task_id = $1 AND user_id = $2 AND execution_date = $3""",
            tid,
            user_id,
            target_date,
        )
        done = bool(log["status"]) if log else False
        out.append({"id": tid, "name": r["task_name"], "done": done})
    return out


def get_my_tasks_sample() -> List[dict]:
    return [
        {"id": t["id"], "name": t["name"], "done": _sample_state.get(t["id"], t["done"])}
        for t in SAMPLE_TASKS
    ]


async def get_my_tasks(
    user_id: int,
    dept_id: Optional[int],
    conn: Optional[asyncpg.Connection],
    target_date: Optional[date] = None,
) -> List[dict]:
    target_date = target_date or date.today()
    if conn:
        return await get_my_tasks_from_db(conn, user_id, dept_id, target_date)
    return get_my_tasks_sample()


async def update_execution_in_db(
    conn: asyncpg.Connection,
    task_id: int,
    user_id: int,
    done: bool,
    target_date: date,
) -> bool:
    """execution_logs에 업데이트 또는 삽입."""
    existing = await conn.fetchrow(
        "SELECT log_id FROM execution_logs WHERE task_id = $1 AND user_id = $2 AND execution_date = $3",
        task_id,
        user_id,
        target_date,
    )
    if existing:
        await conn.execute(
            "UPDATE execution_logs SET status = $1 WHERE log_id = $2",
            done,
            existing["log_id"],
        )
    else:
        await conn.execute(
            """INSERT INTO execution_logs (task_id, user_id, status, execution_date)
               VALUES ($1, $2, $3, $4)""",
            task_id,
            user_id,
            done,
            target_date,
        )
    return True


def update_execution_sample(task_id: int, done: bool) -> bool:
    if task_id in _sample_state:
        _sample_state[task_id] = done
        return True
    return False


async def update_execution(
    task_id: int,
    user_id: int,
    done: bool,
    conn: Optional[asyncpg.Connection],
    target_date: Optional[date] = None,
) -> bool:
    target_date = target_date or date.today()
    if conn:
        return await update_execution_in_db(conn, task_id, user_id, done, target_date)
    return update_execution_sample(task_id, done)


