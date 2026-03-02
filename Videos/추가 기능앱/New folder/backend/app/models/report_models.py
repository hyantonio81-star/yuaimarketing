# -*- coding: utf-8 -*-
"""리포트 생성 모듈용 Pydantic 모델 (ISO 9001/42001 증적 연동)."""

from typing import List, Optional
from pydantic import BaseModel, Field


class DepartmentReport(BaseModel):
    """부서별 KPI 입력 데이터 (평가 리포트 산출용)."""
    dept_name: str = Field(..., description="부서명")
    current_rate: float = Field(..., ge=0, le=100, description="당월 이행률(%)")
    prev_rate: float = Field(..., ge=0, le=100, description="전월 이행률(%)")
    incidents: int = Field(0, ge=0, description="부적합/CAPA 발생 건수")
    deadlines_met: float = Field(..., ge=0, le=100, description="기한 준수율(%)")


class KPIGradeResult(BaseModel):
    """부서별 KPI 등급 산출 결과."""
    dept_name: str
    score: float
    grade: str
    variance: float
    status: str  # ▲ / ▼
    current_rate: float
    prev_rate: float


class AIInsight(BaseModel):
    """AI 인사이트 (공장장용 요약)."""
    performance: Optional[str] = Field(None, description="성과 요약")
    risk: Optional[str] = Field(None, description="위험/특이점")
    recommendation: Optional[str] = Field(None, description="권고 사항")


class MonthlySummary(BaseModel):
    """월간 경영 평가 보고서 요약."""
    year_month: str = Field(..., description="년월 (예: 2026-02)")
    overall_rate: float = Field(..., description="전사 평균 이행률(%)")
    variance_vs_prev: float = Field(..., description="전월 대비 변화량(%)")
    top_dept: Optional[str] = Field(None, description="최우수 부서")
    focus_dept: Optional[str] = Field(None, description="중점 관리 부서")
    ai_insight: Optional[AIInsight] = Field(None, description="AI 인사이트")


class EvaluationReportRequest(BaseModel):
    """월간 평가 리포트 생성 요청."""
    year_month: str = Field(..., description="년월 (예: 2026-02)")
    department_reports: List[DepartmentReport] = Field(..., description="부서별 KPI 입력")


class EvaluationReport(BaseModel):
    """최종 KPI 평가 리포트 (공장장/감독관용)."""
    summary: MonthlySummary
    department_grades: List[KPIGradeResult]
    ai_insight_full: Optional[str] = Field(None, description="AI 진단 문구 전체")
    iso_context: Optional[str] = Field(
        None,
        description="ISO 조직도·성과평가 연동 설명 (증적용)"
    )


class CautionAlert(BaseModel):
    """이행률 80% 미만 시 팀장/감독관 발송용 주의(Caution) 알람."""
    dept_name: str
    current_rate: float
    threshold: float = 80.0
    message: str = Field(..., description="주의 알람 문구")
