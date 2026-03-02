# -*- coding: utf-8 -*-
"""
KPI 대시보드 데이터: DB 기반 이행률·등급 산출 (리포트 엔진과 동일 로직).
역할별 부서 필터: gm/director=전체, leader=본인 부서.
"""

from datetime import date, timedelta
from typing import Optional

import asyncpg

# 등급 산출 (kpi_engine과 동일)
def _grade(score: float) -> str:
    if score >= 95:
        return "S"
    if score >= 85:
        return "A"
    if score >= 75:
        return "B"
    return "C"


SAMPLE_DEPARTMENTS = [
    {"dept_id": 1, "name": "Corrugadora", "rate": 97, "grade": "S", "trend": "+2.5"},
    {"dept_id": 2, "name": "Produccion", "rate": 88, "grade": "A", "trend": "+1.0"},
    {"dept_id": 3, "name": "Inspeccion de Calidad", "rate": 91, "grade": "A", "trend": "-0.5"},
    {"dept_id": 4, "name": "Sistema Gestion de Calidad", "rate": 85, "grade": "A", "trend": "+0.5"},
    {"dept_id": 5, "name": "Diseno y Desarrollo", "rate": 90, "grade": "A", "trend": "+1.0"},
    {"dept_id": 6, "name": "Materia Prima", "rate": 82, "grade": "B", "trend": "-1.0"},
    {"dept_id": 7, "name": "Transporte", "rate": 88, "grade": "A", "trend": "+0.5"},
    {"dept_id": 8, "name": "Despacho", "rate": 86, "grade": "A", "trend": "+0.2"},
    {"dept_id": 9, "name": "Almacen PT", "rate": 84, "grade": "B", "trend": "-0.5"},
    {"dept_id": 10, "name": "Mantenimiento Mecanico", "rate": 79, "grade": "B", "trend": "-2.0"},
    {"dept_id": 11, "name": "Caldera", "rate": 92, "grade": "A", "trend": "+1.5"},
    {"dept_id": 12, "name": "Limpieza", "rate": 95, "grade": "S", "trend": "+2.0"},
    {"dept_id": 13, "name": "Seguridad", "rate": 98, "grade": "S", "trend": "+1.0"},
    {"dept_id": 14, "name": "RRHH", "rate": 90, "grade": "A", "trend": "+0.5"},
    {"dept_id": 15, "name": "Compras", "rate": 87, "grade": "A", "trend": "+0.3"},
    {"dept_id": 16, "name": "Planificacion", "rate": 89, "grade": "A", "trend": "+0.8"},
    {"dept_id": 17, "name": "Repuesto", "rate": 81, "grade": "B", "trend": "-1.2"},
    {"dept_id": 18, "name": "Submaterial", "rate": 83, "grade": "B", "trend": "-0.3"},
]
SAMPLE_INSIGHT = (
    "전사 평균 이행률은 87.5%로 전월 대비 소폭 상승했습니다. "
    "공무/설비팀의 예방 정비 이행률이 급락(74%)함에 따라 다음 달 설비 가동률 저하 리스크가 15% 감지되었습니다. "
    "반면, 생산 1팀은 모든 루틴을 완벽히 이행하여 전사 KPI 상승을 견인했습니다."
)


async def get_dashboard_from_db(
    conn: asyncpg.Connection,
    user: dict,
    target_date: Optional[date] = None,
) -> dict:
    """DB에서 부서별 이행률 계산. user.role/dept_id로 필터."""
    target_date = target_date or date.today()
    year_month = target_date.strftime("%Y-%m")
    first = date(target_date.year, target_date.month, 1)
    prev_month = (first - timedelta(days=1)).strftime("%Y-%m")

    company_id = user.get("company_id")
    dept_filter = ""
    params = []
    if company_id is not None:
        dept_filter = " AND d.company_id = $1"
        params.append(company_id)
    if user.get("role") in ("leader", "staff") and user.get("dept_id") is not None:
        dept_filter += " AND d.dept_id = $" + str(len(params) + 1)
        params.append(user["dept_id"])

    # 부서 목록 (회사·역할 필터)
    if params:
        rows = await conn.fetch(
            "SELECT d.dept_id, d.dept_name FROM departments d WHERE 1=1" + dept_filter
            + " ORDER BY COALESCE(d.sort_order, 999), d.dept_id",
            *params,
        )
    else:
        rows = await conn.fetch(
            "SELECT dept_id, dept_name FROM departments ORDER BY COALESCE(sort_order, 999), dept_id"
        )

    if not rows:
        return _sample_response()

    dept_ids = [r["dept_id"] for r in rows]
    # 당월 이행률: execution_logs + checklists
    rates = {}
    for dept_id in dept_ids:
        total = await conn.fetchval(
            """SELECT COUNT(*) FROM checklists c WHERE c.dept_id = $1""",
            dept_id,
        )
        if not total:
            rates[dept_id] = 0.0
            continue
        done = await conn.fetchval(
            """SELECT COUNT(DISTINCT c.task_id) FROM execution_logs e
               JOIN checklists c ON c.task_id = e.task_id
               WHERE c.dept_id = $1 AND e.status = TRUE
                 AND e.execution_date >= $2::date AND e.execution_date < ($2::date + INTERVAL '1 month')""",
            dept_id,
            year_month + "-01",
        )
        rates[dept_id] = round((done or 0) / total * 100, 1) if total else 0.0

    # 전월 점수 (kpi_reports)
    prev_scores = {}
    for dept_id in dept_ids:
        r = await conn.fetchrow(
            "SELECT score FROM kpi_reports WHERE dept_id = $1 AND target_month = $2",
            dept_id,
            prev_month,
        )
        prev_scores[dept_id] = float(r["score"]) if r and r["score"] is not None else 0.0

    departments = []
    for r in rows:
        dept_id, name = r["dept_id"], r["dept_name"]
        rate = rates.get(dept_id, 0.0)
        prev = prev_scores.get(dept_id, 0.0)
        trend = rate - prev
        trend_str = f"+{trend:.1f}" if trend >= 0 else f"{trend:.1f}"
        grade = _grade(rate)
        departments.append({
            "dept_id": dept_id,
            "name": name,
            "rate": rate,
            "grade": grade,
            "trend": trend_str,
        })

    avg = sum(d["rate"] for d in departments) / len(departments) if departments else 0
    top = max(departments, key=lambda x: x["rate"]) if departments else None
    risk = min(departments, key=lambda x: x["rate"]) if departments else None
    prev_avg = sum(prev_scores.values()) / len(prev_scores) if prev_scores else 0
    trend_vs = avg - prev_avg

    ai_row = await conn.fetchrow(
        "SELECT ai_summary FROM kpi_reports WHERE target_month = $1 LIMIT 1",
        year_month,
    )
    ai_insight = (ai_row["ai_summary"] or SAMPLE_INSIGHT) if ai_row else SAMPLE_INSIGHT

    return {
        "summary": {
            "avg_rate": round(avg, 1),
            "total_incidents": 0,
            "top_dept": top["name"] if top else None,
            "risk_dept": risk["name"] if risk else None,
            "trend_vs_prev": f"+{trend_vs:.1f}" if trend_vs >= 0 else f"{trend_vs:.1f}",
        },
        "departments": departments,
        "ai_insight": ai_insight,
    }


def _sample_response() -> dict:
    rates = [d["rate"] for d in SAMPLE_DEPARTMENTS]
    avg = sum(rates) / len(rates)
    top = max(SAMPLE_DEPARTMENTS, key=lambda x: x["rate"])
    risk = min(SAMPLE_DEPARTMENTS, key=lambda x: x["rate"])
    return {
        "summary": {
            "avg_rate": round(avg, 1),
            "total_incidents": 0,
            "top_dept": top["name"],
            "risk_dept": risk["name"],
            "trend_vs_prev": "+1.8",
        },
        "departments": SAMPLE_DEPARTMENTS,
        "ai_insight": SAMPLE_INSIGHT,
    }


async def get_dashboard(user: Optional[dict], conn: Optional[asyncpg.Connection]) -> dict:
    """대시보드 데이터. DB 있으면 역할 필터 적용, 없으면 샘플."""
    if conn and user:
        return await get_dashboard_from_db(conn, user)
    return _sample_response()
