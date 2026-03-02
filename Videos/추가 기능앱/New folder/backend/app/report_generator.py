# -*- coding: utf-8 -*-
"""
리포트 생성 모듈: 월간 KPI 평가 리포트 및 AI 인사이트 생성.
- 데이터 수집 → 지표 산출 → AI 분석 → 공장장용 리포트 출력
- ISO 9001/45001/42001 증적 연동 (조직도, 성과평가, 지속적 개선)
"""

from typing import List, Dict, Optional, Any

from .models.report_models import (
    DepartmentReport,
    KPIGradeResult,
    AIInsight,
    MonthlySummary,
    EvaluationReport,
    CautionAlert,
)
from .kpi_engine import KPISystem
from .ai_security import AISecurityError, sanitize_input, validate_output as validate_ai_output


# ----- AI 인사이트: 이상 징후 판단 기준 -----

def _detect_trend_drop(rates_last_3_weeks: List[float]) -> bool:
    """최근 3주간 이행률이 지속 하락인지."""
    if len(rates_last_3_weeks) < 3:
        return False
    return rates_last_3_weeks[0] >= rates_last_3_weeks[1] >= rates_last_3_weeks[2] and rates_last_3_weeks[0] > rates_last_3_weeks[2]


def _detect_friday_afternoon_drop(daily_rates: Dict[str, float]) -> bool:
    """금요일 오후 등 특정 시점 이행률 급락 여부. daily_rates 예: {'mon': 95, 'tue': 96, ...}."""
    friday = daily_rates.get("fri") or daily_rates.get("금") or daily_rates.get("friday")
    if friday is None:
        return False
    others = [v for k, v in daily_rates.items() if k not in ("fri", "금", "friday")]
    if not others:
        return False
    avg_other = sum(others) / len(others)
    return friday < avg_other - 5  # 5%p 이상 낮으면 편중으로 간주


def _detect_bottleneck(low_completion_tasks: List[str], threshold: int = 3) -> bool:
    """특정 담당/단계 정체(병목) 여부."""
    return len(low_completion_tasks or []) >= threshold


def generate_ai_insight_rulebased(
    dept_name: str,
    current_data: Dict[str, Any],
    prev_data: Dict[str, Any],
    rates_last_3_weeks: Optional[List[float]] = None,
    daily_rates: Optional[Dict[str, float]] = None,
    top_missed_tasks: Optional[List[str]] = None,
) -> str:
    """
    규칙 기반 AI 진단 문구 생성 (LLM 없이 동작).
    LLM 연동 시에는 동일 인자를 프롬프트에 넣어 generate_ai_insight_llm() 호출 가능.
    """
    parts = []
    cur_rate = current_data.get("rate") or 0
    prev_rate = prev_data.get("rate") or 0
    variance = cur_rate - prev_rate

    # 1. 전월 대비 성과
    if variance > 0:
        parts.append(f"{dept_name}은(는) 전월 대비 이행률이 {variance:.1f}%p 상승했습니다.")
    else:
        parts.append(f"{dept_name}은(는) 전월 대비 이행률이 {abs(variance):.1f}%p 하락했습니다.")

    # 2. 특이점: 금요일 오후 하락
    if daily_rates and _detect_friday_afternoon_drop(daily_rates):
        parts.append(
            "금요일 오후 시간대 이행률이 집중적으로 하락하는 패턴이 보입니다. "
            "주말 전 업무 마감 프로세스 점검을 권고합니다."
        )

    # 3. 특이점: 3주 연속 하락
    if rates_last_3_weeks and _detect_trend_drop(rates_last_3_weeks):
        parts.append(
            "최근 3주간 이행률이 지속적으로 하락하고 있습니다. "
            "원인 분석 및 SOP/인력 점검이 필요합니다."
        )

    # 4. 병목(미이행 항목 다수)
    if top_missed_tasks and _detect_bottleneck(top_missed_tasks):
        parts.append(
            f"미이행이 많은 항목: {', '.join(top_missed_tasks[:5])}. "
            "해당 구간 병목(Bottleneck) 해소를 위한 리소스 조정을 권고합니다."
        )

    return " ".join(parts) if parts else f"{dept_name} 당월 이행률 {cur_rate:.1f}%, 전월 {prev_rate:.1f}%."


def generate_ai_insight_prompt(
    dept_name: str,
    current_data: Dict[str, Any],
    prev_data: Dict[str, Any],
) -> str:
    """
    LLM(GPT-4 등)에 전달할 프롬프트 문자열.
    실제 생성은 외부 ai_model.generate(prompt) 호출로 대체.
    """
    return f"""
부서: {dept_name}
이번 달 이행률: {current_data.get('rate', 0)}%
지난 달 이행률: {prev_data.get('rate', 0)}%
주요 미이행 항목: {current_data.get('top_missed_tasks', [])}

위 데이터를 바탕으로 공장장에게 보고할 3줄 요약을 작성해줘.
1. 전월 대비 성과 비교
2. 데이터에서 발견된 특이점(위험 요소)
3. 관리적 조치 권고 사항
"""


def generate_ai_insight(
    dept_name: str,
    current_data: Dict[str, Any],
    prev_data: Dict[str, Any],
    ai_model: Optional[Any] = None,
) -> str:
    """
    설계서 명세: AI가 데이터를 해석하여 공장장용 요약 생성.
    - ai_model이 있으면 ai_model.generate(prompt) 호출 (LLM 연동), 입력 정제·출력 검증 적용.
    - 없으면 규칙 기반 문구 반환.
    """
    prompt = generate_ai_insight_prompt(dept_name, current_data, prev_data)
    if ai_model is not None and getattr(ai_model, "generate", None):
        try:
            safe_prompt = sanitize_input(prompt, max_length=4000)
            raw = ai_model.generate(safe_prompt)
            return validate_ai_output(raw, redact_pii=True)
        except AISecurityError:
            return "AI 보안 검사로 인해 요약을 생성할 수 없습니다. 규칙 기반 요약만 사용됩니다."
        except Exception:
            return generate_ai_insight_rulebased(
                dept_name, current_data, prev_data,
                rates_last_3_weeks=current_data.get("rates_last_3_weeks"),
                daily_rates=current_data.get("daily_rates"),
                top_missed_tasks=current_data.get("top_missed_tasks"),
            )
    return generate_ai_insight_rulebased(
        dept_name,
        current_data,
        prev_data,
        rates_last_3_weeks=current_data.get("rates_last_3_weeks"),
        daily_rates=current_data.get("daily_rates"),
        top_missed_tasks=current_data.get("top_missed_tasks"),
    )


def build_monthly_summary(
    year_month: str,
    department_grades: List[KPIGradeResult],
    ai_insight: Optional[AIInsight] = None,
) -> MonthlySummary:
    """전사 평균·전월비·최우수/중점부서·AI인사이트로 월간 요약 구성."""
    if not department_grades:
        return MonthlySummary(
            year_month=year_month,
            overall_rate=0.0,
            variance_vs_prev=0.0,
            ai_insight=ai_insight,
        )
    overall = sum(g.current_rate for g in department_grades) / len(department_grades)
    prev_avg = sum(g.prev_rate for g in department_grades) / len(department_grades)
    variance = overall - prev_avg
    top = max(department_grades, key=lambda x: x.score)
    focus = min((g for g in department_grades if "C" in g.grade or "B" in g.grade), key=lambda x: x.score, default=None)
    return MonthlySummary(
        year_month=year_month,
        overall_rate=round(overall, 2),
        variance_vs_prev=round(variance, 2),
        top_dept=top.dept_name if top else None,
        focus_dept=focus.dept_name if focus else None,
        ai_insight=ai_insight,
    )


def generate_evaluation_report(
    year_month: str,
    department_reports: List[DepartmentReport],
    *,
    ai_insight_text: Optional[str] = None,
    per_dept_ai_insights: Optional[Dict[str, str]] = None,
) -> EvaluationReport:
    """
    월간 KPI 평가 리포트 생성 (공장장/감독관용).
    - 부서별 등급 산출
    - 전사 요약 및 AI 인사이트
    - ISO 증적용 문구 포함
    """
    grades = KPISystem.batch_grade(department_reports)
    ai_insight = None
    if ai_insight_text:
        ai_insight = AIInsight(
            performance=None,
            risk=None,
            recommendation=None,
        )
        # 한 줄로 들어온 경우 recommendation에 넣음
        ai_insight.recommendation = ai_insight_text[:500] if len(ai_insight_text) > 500 else ai_insight_text
    summary = build_monthly_summary(year_month, grades, ai_insight)

    iso_context = (
        "본 리포트는 조직도(Context), 체크리스트 이행(Operation), "
        "성과 평가(Performance, ISO 9.1), 개선(CAPA/Improvement) 연동 증적 자료로 활용됩니다."
    )

    return EvaluationReport(
        summary=summary,
        department_grades=grades,
        ai_insight_full=ai_insight_text or (per_dept_ai_insights and "\n".join(per_dept_ai_insights.values())),
        iso_context=iso_context,
    )


def department_reports_from_aggregates(
    aggregates: List[Dict[str, Any]],
) -> List[DepartmentReport]:
    """
    DB 집계 결과(부서별 이행률·기한준수율·사고건수)를 DepartmentReport 리스트로 변환.
    매일 밤 Execution_Logs 전수 조사 후 산출한 집계를 리포트 생성에 넣을 때 사용.
    """
    out = []
    for row in aggregates:
        out.append(
            DepartmentReport(
                dept_name=row["dept_name"],
                current_rate=float(row.get("completion_rate", 0)),
                prev_rate=float(row.get("prev_completion_rate", 0)),
                incidents=int(row.get("incidents", 0)),
                deadlines_met=float(row.get("deadline_rate", row.get("completion_rate", 0))),
            )
        )
    return out


# ----- 주의(Caution) 알람: 이행률 80% 미만 -----
CAUTION_THRESHOLD = 80.0


def check_caution_alerts(
    department_grades: List[KPIGradeResult],
    threshold: float = CAUTION_THRESHOLD,
) -> List[CautionAlert]:
    """
    이행률이 threshold 미만인 부서에 대해 팀장/감독관 발송용 주의 알람 목록 반환.
    알람 자동화: 이 API 또는 스케줄러에서 호출 후 이메일/메신저 발송.
    """
    alerts = []
    for g in department_grades:
        if g.current_rate < threshold:
            alerts.append(
                CautionAlert(
                    dept_name=g.dept_name,
                    current_rate=g.current_rate,
                    threshold=threshold,
                    message=f"주의(Caution): {g.dept_name} 이행률 {g.current_rate:.1f}%가 {threshold}% 미만입니다. 점검 및 독려를 권고합니다.",
                )
            )
    return alerts


def build_production_summary_text(
    year_month: str,
    overall_rate: float,
    variance_vs_prev: float,
    ai_performance: Optional[str] = None,
    ai_risk: Optional[str] = None,
    ai_recommendation: Optional[str] = None,
) -> str:
    """
    [YYYY년 M월 생산본부 평가 요약] 최종 형태.
    성과 / 위험 / 권고 3줄 구조로 공장장용 출력.
    """
    year_str, month_str = year_month.split("-") if "-" in year_month else (year_month[:4], year_month[4:6])
    title = f"[{year_str}년 {month_str}월 생산본부 평가 요약]"
    lines = [
        title,
        "",
        f"종합 평가: 전사 이행률 {overall_rate:.1f}% (전월비 {variance_vs_prev:+.1f}% 상승)" if variance_vs_prev >= 0 else f"종합 평가: 전사 이행률 {overall_rate:.1f}% (전월비 {variance_vs_prev:.1f}% 하락)",
        "",
        "AI 인사이트:",
    ]
    if ai_performance:
        lines.append(f"  * 성과: {ai_performance}")
    if ai_risk:
        lines.append(f"  * 위험: {ai_risk}")
    if ai_recommendation:
        lines.append(f"  * 권고: {ai_recommendation}")
    if not (ai_performance or ai_risk or ai_recommendation):
        lines.append("  (이번 달 요약 없음)")
    return "\n".join(lines)


def generate_executive_report_text(
    report: EvaluationReport,
    use_production_format: bool = False,
) -> str:
    """
    [월간 경영 평가 보고서] 형식의 텍스트 출력.
    use_production_format=True 시 [YYYY년 M월 생산본부 평가 요약] 레이아웃 사용.
    이메일/카카오톡/PDF 본문으로 사용 가능.
    """
    s = report.summary
    if use_production_format:
        # 성과/위험/권고는 ai_insight_full을 한 줄씩 파싱하거나, summary.ai_insight 사용
        perf = risk = rec = None
        if report.summary.ai_insight:
            perf, risk, rec = report.summary.ai_insight.performance, report.summary.ai_insight.risk, report.summary.ai_insight.recommendation
        if report.ai_insight_full and not (perf or risk or rec):
            rec = report.ai_insight_full[:500]
        return build_production_summary_text(
            s.year_month,
            s.overall_rate,
            s.variance_vs_prev,
            ai_performance=perf,
            ai_risk=risk,
            ai_recommendation=rec,
        )
    lines = [
        f"[{s.year_month} 월간 경영 평가 보고서]",
        "",
        f"전사 평균 이행률: {s.overall_rate}% (전월 대비 {s.variance_vs_prev:+.1f}%p)",
        f"최우수 부서: {s.top_dept or '-'}",
        f"중점 관리 부서: {s.focus_dept or '-'}",
        "",
    ]
    if report.ai_insight_full:
        lines.append("AI 인사이트:")
        lines.append(report.ai_insight_full)
        lines.append("")
    lines.append("부서별 등급:")
    for g in report.department_grades:
        lines.append(f"  - {g.dept_name}: {g.grade} (점수 {g.score}, 전월비 {g.variance:+.1f}%p {g.status})")
    if report.iso_context:
        lines.append("")
        lines.append(f"[ISO 연동] {report.iso_context}")
    return "\n".join(lines)
