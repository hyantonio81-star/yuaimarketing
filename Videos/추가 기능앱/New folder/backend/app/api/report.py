# -*- coding: utf-8 -*-
"""리포트 생성 API: 부서별 KPI 등급 및 월간 평가 리포트 조회/생성."""

from typing import List, Optional
from fastapi import APIRouter

from ..models.report_models import (
    DepartmentReport,
    KPIGradeResult,
    EvaluationReport,
    EvaluationReportRequest,
    CautionAlert,
)
from ..kpi_engine import calculate_kpi_grade
from ..report_generator import (
    generate_evaluation_report,
    generate_executive_report_text,
    generate_ai_insight_rulebased,
    check_caution_alerts,
)

router = APIRouter(prefix="/report", tags=["report"])


@router.post("/kpi-grade", response_model=KPIGradeResult)
def api_calculate_kpi_grade(report: DepartmentReport) -> KPIGradeResult:
    """단일 부서 KPI 등급 산출 (가중치: 이행률 60%, 기한준수 20%, 사고감점 20%)."""
    result = calculate_kpi_grade(report)
    return KPIGradeResult(**result)


@router.post("/kpi-grade-batch", response_model=List[KPIGradeResult])
def api_calculate_kpi_grade_batch(reports: List[DepartmentReport]) -> List[KPIGradeResult]:
    """복수 부서 일괄 KPI 등급 산출."""
    return [KPIGradeResult(**calculate_kpi_grade(r)) for r in reports]


@router.post("/evaluation", response_model=EvaluationReport)
def api_generate_evaluation_report(
    body: EvaluationReportRequest,
    use_ai_insight: bool = True,
) -> EvaluationReport:
    """
    월간 KPI 평가 리포트 생성 (공장장/감독관용).
    use_ai_insight=True 시 규칙 기반 AI 진단 문구 포함.
    """
    year_month = body.year_month
    department_reports = body.department_reports
    ai_text: Optional[str] = None
    if use_ai_insight and department_reports:
        first = department_reports[0]
        cur = {"rate": first.current_rate, "top_missed_tasks": []}
        prev = {"rate": first.prev_rate}
        ai_text = generate_ai_insight_rulebased(
            first.dept_name, cur, prev,
            rates_last_3_weeks=[first.prev_rate, first.current_rate],
        )
    report = generate_evaluation_report(
        year_month,
        department_reports,
        ai_insight_text=ai_text,
    )
    return report


@router.post("/evaluation/text")
def api_get_evaluation_report_text(
    body: EvaluationReportRequest,
    use_production_format: bool = False,
) -> dict:
    """
    월간 경영 평가 보고서를 텍스트 본문으로 반환.
    use_production_format=True 시 [YYYY년 M월 생산본부 평가 요약] 레이아웃.
    이메일/PDF/메신저 발송용.
    """
    report = generate_evaluation_report(
        body.year_month,
        body.department_reports,
    )
    return {
        "text": generate_executive_report_text(report, use_production_format=use_production_format),
        "year_month": body.year_month,
    }


@router.post("/alerts/caution", response_model=List[CautionAlert])
def api_check_caution_alerts(
    body: EvaluationReportRequest,
    threshold: float = 80.0,
) -> List[CautionAlert]:
    """
    이행률이 threshold 미만인 부서에 대한 주의(Caution) 알람 목록.
    팀장/감독관에게 즉시 발송할 때 사용. (알람 자동화)
    """
    report = generate_evaluation_report(body.year_month, body.department_reports)
    return check_caution_alerts(report.department_grades, threshold=threshold)


# ----- 샘플 데이터로 빠른 테스트용 -----

SAMPLE_DEPARTMENT_REPORTS = [
    DepartmentReport(
        dept_name="생산 1팀",
        current_rate=98.5,
        prev_rate=94.2,
        incidents=0,
        deadlines_met=95.0,
    ),
    DepartmentReport(
        dept_name="품질관리팀",
        current_rate=82.0,
        prev_rate=85.0,
        incidents=1,
        deadlines_met=88.0,
    ),
    DepartmentReport(
        dept_name="공무팀",
        current_rate=78.0,
        prev_rate=81.0,
        incidents=2,
        deadlines_met=80.0,
    ),
]


@router.get("/evaluation/sample", response_model=EvaluationReport)
def api_get_sample_evaluation_report(year_month: Optional[str] = None) -> EvaluationReport:
    """샘플 데이터로 월간 평가 리포트 예시 반환 (대시보드 연동/테스트용)."""
    ym = year_month or "2026-02"
    body = EvaluationReportRequest(year_month=ym, department_reports=SAMPLE_DEPARTMENT_REPORTS)
    return api_generate_evaluation_report(body, use_ai_insight=True)


@router.get("/evaluation/sample/summary")
def api_get_sample_production_summary(year_month: Optional[str] = None) -> dict:
    """
    샘플 데이터로 [YYYY년 M월 생산본부 평가 요약] 형식 텍스트 반환.
    성과/위험/권고 3줄 AI 인사이트 포함.
    """
    ym = year_month or "2026-02"
    body = EvaluationReportRequest(year_month=ym, department_reports=SAMPLE_DEPARTMENT_REPORTS)
    report = api_generate_evaluation_report(body, use_ai_insight=True)
    text = generate_executive_report_text(report, use_production_format=True)
    alerts = check_caution_alerts(report.department_grades, threshold=80.0)
    return {
        "year_month": ym,
        "summary_text": text,
        "caution_alerts": [a.model_dump() for a in alerts],
    }
