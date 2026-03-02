# -*- coding: utf-8 -*-
"""
관리자 API: 조직도(부서) CRUD, 파이프라인 순서. gm/director 전용.
"""

from typing import List, Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from ...auth import get_db_conn, get_tenant_conn_dependency, require_gm_or_director
from ...services.audit_service import log_audit

router = APIRouter(prefix="/admin", tags=["admin"])


class DepartmentCreate(BaseModel):
    dept_name: str
    parent_id: Optional[int] = None
    sort_order: Optional[int] = None


class DepartmentUpdate(BaseModel):
    dept_name: Optional[str] = None
    parent_id: Optional[int] = None
    manager_id: Optional[int] = None
    sort_order: Optional[int] = None


class PipelineOrderUpdate(BaseModel):
    dept_ids: List[int]


@router.get("/departments")
async def list_departments(
    user: dict = Depends(require_gm_or_director),
    tenant_conn: Optional[asyncpg.Connection] = Depends(get_tenant_conn_dependency),
):
    """조직도 부서 목록 (트리/파이프라인용). 회사별·고객사 DB 사용."""
    if tenant_conn is None:
        return {"departments": []}
    company_id = user.get("company_id")
    if company_id is not None:
        rows = await tenant_conn.fetch(
            """SELECT dept_id, dept_name, parent_id, manager_id, COALESCE(sort_order, 0) AS sort_order
               FROM departments WHERE company_id = $1 ORDER BY COALESCE(sort_order, 999), dept_id""",
            company_id,
        )
    else:
        rows = await tenant_conn.fetch(
            """SELECT dept_id, dept_name, parent_id, manager_id, COALESCE(sort_order, 0) AS sort_order
               FROM departments ORDER BY COALESCE(sort_order, 999), dept_id"""
        )
    return {
        "departments": [
            {
                "dept_id": r["dept_id"],
                "dept_name": r["dept_name"],
                "parent_id": r["parent_id"],
                "manager_id": r["manager_id"],
                "sort_order": r["sort_order"],
            }
            for r in rows
        ],
    }


@router.post("/departments")
async def create_department(
    request: Request,
    body: DepartmentCreate,
    user: dict = Depends(require_gm_or_director),
    main_conn: Optional[asyncpg.Connection] = Depends(get_db_conn),
    tenant_conn: Optional[asyncpg.Connection] = Depends(get_tenant_conn_dependency),
):
    """부서 추가 (현재 사용자 회사 소속). 고객사 DB 사용."""
    if tenant_conn is None:
        raise HTTPException(status_code=503, detail="DB 연결이 필요합니다.")
    company_id = user.get("company_id")
    if company_id is None:
        raise HTTPException(status_code=400, detail="회사 소속이 없습니다.")
    try:
        row = await tenant_conn.fetchrow(
            """INSERT INTO departments (company_id, dept_name, parent_id, sort_order)
               VALUES ($1, $2, $3, COALESCE($4, 0)) RETURNING dept_id, dept_name, parent_id, manager_id, sort_order""",
            company_id,
            body.dept_name.strip(),
            body.parent_id,
            body.sort_order,
        )
        await log_audit(
            main_conn, user["user_id"], "admin_create_dept", f"dept_{row['dept_id']}", body.dept_name,
            request_method=request.method, request_path=request.url.path,
        )
        return {"department": dict(row)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/departments/{dept_id}")
async def update_department(
    request: Request,
    dept_id: int,
    body: DepartmentUpdate,
    user: dict = Depends(require_gm_or_director),
    main_conn: Optional[asyncpg.Connection] = Depends(get_db_conn),
    tenant_conn: Optional[asyncpg.Connection] = Depends(get_tenant_conn_dependency),
):
    """부서 수정 (이름, 상위, 팀장, 순서). 본인 회사 부서만. 고객사 DB 사용."""
    if tenant_conn is None:
        raise HTTPException(status_code=503, detail="DB 연결이 필요합니다.")
    company_id = user.get("company_id")
    if company_id is not None:
        ok = await tenant_conn.fetchval("SELECT 1 FROM departments WHERE dept_id = $1 AND company_id = $2", dept_id, company_id)
        if not ok:
            raise HTTPException(status_code=404, detail="해당 부서를 찾을 수 없거나 권한이 없습니다.")
    updates = []
    vals = []
    i = 1
    if body.dept_name is not None:
        updates.append(f"dept_name = ${i}")
        vals.append(body.dept_name.strip())
        i += 1
    if body.parent_id is not None:
        updates.append(f"parent_id = ${i}")
        vals.append(body.parent_id)
        i += 1
    if body.manager_id is not None:
        updates.append(f"manager_id = ${i}")
        vals.append(body.manager_id)
        i += 1
    if body.sort_order is not None:
        updates.append(f"sort_order = ${i}")
        vals.append(body.sort_order)
        i += 1
    if not updates:
        raise HTTPException(status_code=400, detail="수정할 필드가 없습니다.")
    vals.append(dept_id)
    try:
        await tenant_conn.execute(
            f"UPDATE departments SET {', '.join(updates)} WHERE dept_id = ${i}",
            *vals,
        )
        await log_audit(
            main_conn, user["user_id"], "admin_update_dept", f"dept_{dept_id}", None,
            request_method=request.method, request_path=request.url.path,
        )
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/departments/{dept_id}")
async def delete_department(
    request: Request,
    dept_id: int,
    user: dict = Depends(require_gm_or_director),
    main_conn: Optional[asyncpg.Connection] = Depends(get_db_conn),
    tenant_conn: Optional[asyncpg.Connection] = Depends(get_tenant_conn_dependency),
):
    """부서 삭제. 본인 회사 부서만. 고객사 DB 사용. 하위 부서·사용자 있으면 거부."""
    if tenant_conn is None:
        raise HTTPException(status_code=503, detail="DB 연결이 필요합니다.")
    company_id = user.get("company_id")
    if company_id is not None:
        ok = await tenant_conn.fetchval("SELECT 1 FROM departments WHERE dept_id = $1 AND company_id = $2", dept_id, company_id)
        if not ok:
            raise HTTPException(status_code=404, detail="해당 부서를 찾을 수 없거나 권한이 없습니다.")
    children = await tenant_conn.fetchval("SELECT COUNT(*) FROM departments WHERE parent_id = $1", dept_id)
    if children and children > 0:
        raise HTTPException(status_code=400, detail="하위 부서가 있어 삭제할 수 없습니다.")
    users_count = await tenant_conn.fetchval("SELECT COUNT(*) FROM users WHERE dept_id = $1", dept_id)
    if users_count and users_count > 0:
        raise HTTPException(status_code=400, detail="소속 사용자가 있어 삭제할 수 없습니다. 먼저 사용자를 다른 부서로 이동하세요.")
    await tenant_conn.execute("DELETE FROM departments WHERE dept_id = $1", dept_id)
    await log_audit(
        main_conn, user["user_id"], "admin_delete_dept", f"dept_{dept_id}", None,
        request_method=request.method, request_path=request.url.path,
    )
    return {"ok": True}


@router.get("/pipeline")
async def get_pipeline(
  user: dict = Depends(require_gm_or_director),
  tenant_conn: Optional[asyncpg.Connection] = Depends(get_tenant_conn_dependency),
):
    """파이프라인 순서(부서 목록). 회사별·고객사 DB, sort_order 기준."""
    if tenant_conn is None:
        return {"departments": []}
    company_id = user.get("company_id")
    if company_id is not None:
        rows = await tenant_conn.fetch(
            """SELECT dept_id, dept_name, COALESCE(sort_order, 0) AS sort_order
               FROM departments WHERE company_id = $1 ORDER BY COALESCE(sort_order, 999), dept_id""",
            company_id,
        )
    else:
        rows = await tenant_conn.fetch(
            """SELECT dept_id, dept_name, COALESCE(sort_order, 0) AS sort_order
               FROM departments ORDER BY COALESCE(sort_order, 999), dept_id"""
        )
    return {
        "departments": [{"dept_id": r["dept_id"], "dept_name": r["dept_name"], "sort_order": r["sort_order"]} for r in rows],
    }


@router.patch("/pipeline")
async def update_pipeline_order(
    request: Request,
    body: PipelineOrderUpdate,
    user: dict = Depends(require_gm_or_director),
    main_conn: Optional[asyncpg.Connection] = Depends(get_db_conn),
    tenant_conn: Optional[asyncpg.Connection] = Depends(get_tenant_conn_dependency),
):
    """파이프라인 순서 저장. 본인 회사 부서만. 고객사 DB 사용."""
    if tenant_conn is None:
        raise HTTPException(status_code=503, detail="DB 연결이 필요합니다.")
    company_id = user.get("company_id")
    for order, dept_id in enumerate(body.dept_ids, start=1):
        if company_id is not None:
            await tenant_conn.execute(
                "UPDATE departments SET sort_order = $1 WHERE dept_id = $2 AND company_id = $3",
                order, dept_id, company_id,
            )
        else:
            await tenant_conn.execute("UPDATE departments SET sort_order = $1 WHERE dept_id = $2", order, dept_id)
    await log_audit(
        main_conn, user["user_id"], "admin_pipeline_order", None, str(len(body.dept_ids)),
        request_method=request.method, request_path=request.url.path,
    )
    return {"ok": True}
