# -*- coding: utf-8 -*-
"""
공장장 대시보드·KPI API. 인증 필수, 역할별 부서 필터.
"""

from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request, status

from ...auth import get_current_user, get_db_conn, get_tenant_conn_dependency
from ...services.audit_service import log_audit
from ...services.kpi_service import get_dashboard

router = APIRouter(prefix="/kpi", tags=["kpi-v1"])


def _client_ip(request: Request) -> Optional[str]:
    return request.client.host if request.client else None


@router.get("/department/{dept_id}")
async def get_department_kpi(
    dept_id: int,
    request: Request,
    user: dict = Depends(get_current_user),
    main_conn: Optional[asyncpg.Connection] = Depends(get_db_conn),
    tenant_conn: Optional[asyncpg.Connection] = Depends(get_tenant_conn_dependency),
):
    """부서별 KPI. gm/director=전체, leader/staff=본인 부서만. 고객사별 DB 사용."""
    if user.get("role") in ("leader", "staff") and user.get("dept_id") != dept_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="해당 부서 조회 권한이 없습니다.")
    data = await get_dashboard(user, tenant_conn)
    dept = next((d for d in data["departments"] if d["dept_id"] == dept_id), None)
    if not dept:
        raise HTTPException(status_code=404, detail="부서를 찾을 수 없습니다.")
    insight = (
        "주간 목표 대비 상회 중입니다. 장비 정비 루틴 이행률이 특히 높습니다."
        if dept["grade"] in ("S", "A")
        else "예방 정비 이행률 보강이 필요합니다. 다음 주 루틴 점검을 권고합니다."
    )
    await log_audit(
        main_conn, user["user_id"], "view_dept_kpi", f"dept_{dept_id}", None, _client_ip(request),
        request_method=request.method, request_path=request.url.path,
    )
    return {"dept_id": dept_id, "rate": dept["rate"], "grade": dept["grade"], "insight": insight}


@router.get("/factory-summary")
async def get_factory_summary(
    request: Request,
    user: dict = Depends(get_current_user),
    main_conn: Optional[asyncpg.Connection] = Depends(get_db_conn),
    tenant_conn: Optional[asyncpg.Connection] = Depends(get_tenant_conn_dependency),
):
    """전사 요약. 역할에 따라 본인 부서만 또는 전체. 고객사별 DB 사용."""
    data = await get_dashboard(user, tenant_conn)
    await log_audit(
        main_conn, user["user_id"], "view_factory_summary", None, None, _client_ip(request),
        request_method=request.method, request_path=request.url.path,
    )
    return data["summary"]


@router.get("/dashboard")
async def get_dashboard_endpoint(
    request: Request,
    user: dict = Depends(get_current_user),
    main_conn: Optional[asyncpg.Connection] = Depends(get_db_conn),
    tenant_conn: Optional[asyncpg.Connection] = Depends(get_tenant_conn_dependency),
):
    """대시보드 한 번에. 인증 필수, 역할별 부서 필터. 고객사별 DB 사용."""
    data = await get_dashboard(user, tenant_conn)
    await log_audit(
        main_conn, user["user_id"], "view_dashboard", "kpi", None, _client_ip(request),
        request_method=request.method, request_path=request.url.path,
    )
    return data
