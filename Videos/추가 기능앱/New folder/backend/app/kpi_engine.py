# -*- coding: utf-8 -*-
"""
KPI 엔진: 부서별 이행률·기한준수·사고감점 기반 등급 산출.
ISO 9001 조항 9.1 (모니터링, 측정, 분석 및 평가) 요구사항 충족.
"""

import pandas as pd
from typing import List, Dict

from .models.report_models import DepartmentReport, KPIGradeResult


# 가중치 (스펙)
WEIGHT_EXECUTION = 0.6   # 업무 이행률 60%
WEIGHT_DEADLINE = 0.2    # 기한 준수율 20%
WEIGHT_INCIDENT = 0.2    # 부적합/CAPA 20%
INCIDENT_PENALTY_PER_ITEM = 10  # 건당 감점


def calculate_kpi_grade(report: DepartmentReport) -> Dict:
    """
    가중치 적용 최종 점수 및 등급 산출.
    최종점수 = (이행률×0.6) + (준수율×0.2) + (100 - 사고점수)×0.2
    """
    incident_score = min(report.incidents * INCIDENT_PENALTY_PER_ITEM, 100)
    score = (
        report.current_rate * WEIGHT_EXECUTION
        + report.deadlines_met * WEIGHT_DEADLINE
        + (100 - incident_score) * WEIGHT_INCIDENT
    )
    score = max(0.0, min(100.0, score))
    variance = report.current_rate - report.prev_rate
    grade = _assign_grade(score)
    return {
        "dept_name": report.dept_name,
        "score": round(score, 2),
        "grade": grade,
        "variance": round(variance, 2),
        "status": "▲" if variance > 0 else ("▼" if variance < 0 else "－"),
        "current_rate": report.current_rate,
        "prev_rate": report.prev_rate,
    }


def _assign_grade(score: float) -> str:
    """점수 → 등급 (S/A/B/C)."""
    if score >= 95:
        return "S (탁월)"
    if score >= 85:
        return "A (우수)"
    if score >= 75:
        return "B (보통)"
    return "C (개선필요)"


class KPISystem:
    """
    pandas 기반 일일/주간/월간 이행률 계산 및 평가 리포트 생성.
    """

    def __init__(self, data: List[Dict] or pd.DataFrame):
        self.df = pd.DataFrame(data) if isinstance(data, list) else data

    def calculate_completion_rate(self) -> pd.Series:
        """부서별 평균 이행률 (actual/target*100)."""
        if "completion_rate" not in self.df.columns and "actual" in self.df.columns and "target" in self.df.columns:
            self.df["completion_rate"] = (self.df["actual"] / self.df["target"].replace(0, 1)) * 100
        if "department" in self.df.columns:
            return self.df.groupby("department")["completion_rate"].mean()
        return self.df["completion_rate"] if "completion_rate" in self.df.columns else pd.Series()

    def generate_eval_report(self, prev_month_data: pd.Series) -> pd.DataFrame:
        """전월 대비 성장률 및 KPI 리포트 (DataFrame)."""
        current = self.calculate_completion_rate()
        report = pd.DataFrame({"Current": current, "Previous": prev_month_data})
        report["Previous"] = report["Previous"].fillna(0)
        report["Variance"] = report["Current"] - report["Previous"]
        report["Grade"] = report["Current"].apply(lambda s: _assign_grade(s))
        return report

    def assign_grade(self, score: float) -> str:
        """단일 점수 등급 (기존 호환)."""
        return _assign_grade(score)

    @staticmethod
    def batch_grade(reports: List[DepartmentReport]) -> List[KPIGradeResult]:
        """여러 부서 리포트를 일괄 등급 산출."""
        return [KPIGradeResult(**calculate_kpi_grade(r)) for r in reports]
