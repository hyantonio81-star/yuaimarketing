# -*- coding: utf-8 -*-
"""리포트 생성 모듈 단위 테스트."""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.kpi_engine import calculate_kpi_grade, KPISystem
from app.models.report_models import DepartmentReport
from app.report_generator import (
    generate_evaluation_report,
    generate_executive_report_text,
    generate_ai_insight_rulebased,
)

def test_kpi_grade():
    r = DepartmentReport(
        dept_name="생산 1팀",
        current_rate=98.5,
        prev_rate=94.2,
        incidents=0,
        deadlines_met=95.0,
    )
    result = calculate_kpi_grade(r)
    assert result["grade"] == "S (탁월)"
    assert result["status"] == "▲"
    print("KPI 등급:", result)

def test_evaluation_report():
    reports = [
        DepartmentReport(dept_name="생산 1팀", current_rate=98.5, prev_rate=94.2, incidents=0, deadlines_met=95.0),
        DepartmentReport(dept_name="품질관리팀", current_rate=82.0, prev_rate=85.0, incidents=1, deadlines_met=88.0),
    ]
    ev = generate_evaluation_report(
        "2026-02",
        reports,
        ai_insight_text="생산 1팀 전월비 상승. 품질관리팀 집중 교육 권고.",
    )
    text = generate_executive_report_text(ev)
    assert "전사 평균" in text
    assert "생산 1팀" in text
    print("--- 리포트 텍스트 ---")
    print(text)

def test_ai_insight_rulebased():
    msg = generate_ai_insight_rulebased(
        "생산 1팀",
        {"rate": 98.5, "top_missed_tasks": []},
        {"rate": 94.2},
        rates_last_3_weeks=[90, 92, 94.2],
    )
    assert "전월 대비" in msg
    print("AI 인사이트:", msg)

if __name__ == "__main__":
    test_kpi_grade()
    test_evaluation_report()
    test_ai_insight_rulebased()
    print("All OK")
