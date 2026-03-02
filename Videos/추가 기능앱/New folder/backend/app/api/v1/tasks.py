# -*- coding: utf-8 -*-
"""
현장 체크리스트 API. 인증 필수, 본인 업무만 조회/수정.
"""

from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

from ...auth import get_current_user, get_db_conn, get_tenant_conn_dependency
from ...services.audit_service import log_audit
from ...services.task_service import get_my_tasks, update_execution

router = APIRouter(prefix="/tasks", tags=["tasks-v1"])


class TaskExecuteBody(BaseModel):
    done: bool


def _client_ip(request: Request) -> Optional[str]:
    return request.client.host if request.client else None


@router.get("/my")
async def get_my_tasks_endpoint(
    request: Request,
    user: dict = Depends(get_current_user),
    main_conn: Optional[asyncpg.Connection] = Depends(get_db_conn),
    tenant_conn: Optional[asyncpg.Connection] = Depends(get_tenant_conn_dependency),
):
    """오늘 내 체크리스트. user_id/dept_id 기준. 고객사 DB 사용."""
    tasks = await get_my_tasks(user["user_id"], user.get("dept_id"), tenant_conn)
    await log_audit(
        main_conn, user["user_id"], "view_my_tasks", "tasks", None, _client_ip(request),
        request_method=request.method, request_path=request.url.path,
    )
    return {"tasks": tasks}


@router.patch("/{task_id}/execute")
async def update_execution_endpoint(
    task_id: int,
    body: TaskExecuteBody,
    request: Request,
    user: dict = Depends(get_current_user),
    main_conn: Optional[asyncpg.Connection] = Depends(get_db_conn),
    tenant_conn: Optional[asyncpg.Connection] = Depends(get_tenant_conn_dependency),
):
    """이행 체크. 본인 부서 업무만 허용. 고객사 DB 사용."""
    my_tasks = await get_my_tasks(user["user_id"], user.get("dept_id"), tenant_conn)
    my_ids = [t["id"] for t in my_tasks]
    if task_id not in my_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="해당 업무에 대한 권한이 없습니다.")
    ok = await update_execution(task_id, user["user_id"], body.done, tenant_conn)
    if not ok:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
    await log_audit(
        main_conn,
        user["user_id"],
        "task_execute",
        f"task_{task_id}",
        f"done={body.done}",
        _client_ip(request),
        request_method=request.method,
        request_path=request.url.path,
    )
    return {"task_id": task_id, "done": body.done}
