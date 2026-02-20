import { useState } from "react";
import { Search, Bell, AlertTriangle, Building2, Calendar, Globe, FileCheck, TrendingUp, FileText } from "lucide-react";
import SectionCard from "../components/SectionCard";
import { api } from "../lib/api";

export default function GovTender() {
  const [keywords, setKeywords] = useState("시스템, 소프트웨어, 전자, 정보, 유지보수, 클라우드");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [intlKeywords, setIntlKeywords] = useState("IT, software, system, digital, consulting");
  const [intlLoading, setIntlLoading] = useState(false);
  const [intlResult, setIntlResult] = useState(null);
  const [intlError, setIntlError] = useState(null);

  const [qualDoc, setQualDoc] = useState("");
  const [qualLoading, setQualLoading] = useState(false);
  const [qualResult, setQualResult] = useState(null);
  const [qualError, setQualError] = useState(null);

  const [bidScope, setBidScope] = useState("시스템 구축 및 유지보수");
  const [bidPeriod, setBidPeriod] = useState("12개월");
  const [bidLocation, setBidLocation] = useState("국내");
  const [bidBudget, setBidBudget] = useState("");
  const [bidAgency, setBidAgency] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [bidResult, setBidResult] = useState(null);
  const [bidError, setBidError] = useState(null);

  const [propType, setPropType] = useState("SI");
  const [propScope, setPropScope] = useState("전자정부 시스템 구축");
  const [propPeriod, setPropPeriod] = useState("12개월");
  const [propTech, setPropTech] = useState("");
  const [propExpertise, setPropExpertise] = useState("PM, 시스템설계, 개발, QA");
  const [propGuidelines, setPropGuidelines] = useState("");
  const [propLoading, setPropLoading] = useState(false);
  const [propResult, setPropResult] = useState(null);
  const [propError, setPropError] = useState(null);

  const runMonitor = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const user_keywords = keywords
        .split(/[,，\s]+/)
        .map((k) => k.trim())
        .filter(Boolean);
      const { data } = await api.post("/gov/korea-procurement", {
        user_keywords: user_keywords.length ? user_keywords : undefined,
      });
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "모니터링 실패");
    } finally {
      setLoading(false);
    }
  };

  const runInternationalTenders = async () => {
    setIntlLoading(true);
    setIntlError(null);
    setIntlResult(null);
    try {
      const kw = intlKeywords.split(/[,，\s]+/).map((k) => k.trim()).filter(Boolean);
      const { data } = await api.post("/gov/international-tenders", {
        user_profile: kw.length ? { keywords: kw } : undefined,
      });
      setIntlResult(Array.isArray(data) ? data : []);
    } catch (e) {
      setIntlError(e.response?.data?.error || e.message || "모니터링 실패");
    } finally {
      setIntlLoading(false);
    }
  };

  const runCheckQualification = async () => {
    setQualLoading(true);
    setQualError(null);
    setQualResult(null);
    try {
      const { data } = await api.post("/gov/check-qualification", {
        tender: qualDoc.trim() ? { document: qualDoc.trim() } : {},
      });
      setQualResult(data);
    } catch (e) {
      setQualError(e.response?.data?.error || e.message || "자격 검토 실패");
    } finally {
      setQualLoading(false);
    }
  };

  const runOptimalBid = async () => {
    setBidLoading(true);
    setBidError(null);
    setBidResult(null);
    try {
      const { data } = await api.post("/gov/optimal-bid", {
        tender: {
          scope_of_work: bidScope.trim() || undefined,
          contract_period: bidPeriod.trim() || undefined,
          delivery_location: bidLocation.trim() || undefined,
          budget: bidBudget !== "" ? Number(bidBudget) : undefined,
          agency: bidAgency.trim() || undefined,
        },
      });
      setBidResult(data);
    } catch (e) {
      setBidError(e.response?.data?.error || e.message || "계산 실패");
    } finally {
      setBidLoading(false);
    }
  };

  const runGenerateProposal = async () => {
    setPropLoading(true);
    setPropError(null);
    setPropResult(null);
    try {
      const { data } = await api.post("/gov/generate-proposal", {
        tender: {
          type: propType.trim() || undefined,
          scope_of_work: propScope.trim() || undefined,
          contract_period: propPeriod.trim() || undefined,
          technical_specs: propTech.trim() || undefined,
          required_expertise: propExpertise.trim() || undefined,
          submission_guidelines: propGuidelines.trim() || undefined,
        },
      });
      setPropResult(data);
    } catch (e) {
      setPropError(e.response?.data?.error || e.message || "제안서 생성 실패");
    } finally {
      setPropLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Pillar 4 — Gov Tender (G2B)
        </h1>
        <p className="text-muted-foreground mt-1">
          나라장터·공공입찰 자동 모니터링 (10%)
        </p>
      </header>

      <SectionCard title="나라장터(G2B) 자동 모니터링" className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          공공데이터포털 입찰공고 조회 → 관심 키워드 필터 → match_score 70 초과 건 상세 분석 → 알림(고액 1억 이상 시 high)
        </p>
        <div className="mb-4">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            관심 키워드 (쉼표 구분)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="시스템, 소프트웨어, 전자, 정보..."
            className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
          />
        </div>
        <button
          onClick={runMonitor}
          disabled={loading}
          className="flex items-center gap-2 rounded bg-pillar4 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <Search className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
          {loading ? "모니터링 중…" : "나라장터 모니터링 실행"}
        </button>
        {error && (
          <p className="text-sm text-destructive mt-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </p>
        )}
        {result && (
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-foreground font-medium">
                조회 기간: {result.params_used?.inqryBgnDt} ~ {result.params_used?.inqryEndDt}
              </span>
              <span className="text-muted-foreground">
                매칭 입찰 <strong>{result.relevant?.length ?? 0}</strong>건
              </span>
              {result.notification_sent && (
                <span className="flex items-center gap-2 rounded px-2 py-1 bg-pillar4/20 text-pillar4">
                  <Bell className="w-4 h-4" />
                  {result.notification_sent.title}
                  <span
                    className={
                      result.notification_sent.priority === "high"
                        ? "text-amber-500 font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    ({result.notification_sent.priority})
                  </span>
                </span>
              )}
            </div>
            {result.relevant?.length > 0 ? (
              <ul className="space-y-3">
                {result.relevant.map((r, i) => (
                  <li
                    key={r.tender?.id || i}
                    className="rounded border border-border bg-background/50 p-3 text-sm"
                  >
                    <div className="font-medium text-foreground mb-1">{r.tender?.title}</div>
                    <div className="flex flex-wrap gap-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {r.agency}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        마감 {r.deadline}
                      </span>
                      <span>매칭 {r.analysis?.match_score}%</span>
                      <span>추정규모 ₩{r.analysis?.estimated_value?.toLocaleString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">해당 조건의 입찰이 없습니다.</p>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="국제 입찰 모니터링 (UNGM · World Bank · ADB)" className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          API / 스크래핑 / RSS 소스 수집 → 중복 제거 → 사용자 프로필 기반 관련성(60 초과) → 관련성·추정규모 정렬
        </p>
        <div className="mb-4">
          <label className="block text-xs font-medium text-muted-foreground mb-1">관심 키워드 (쉼표 구분)</label>
          <input
            type="text"
            value={intlKeywords}
            onChange={(e) => setIntlKeywords(e.target.value)}
            placeholder="IT, software, system, digital..."
            className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
          />
        </div>
        <button
          onClick={runInternationalTenders}
          disabled={intlLoading}
          className="flex items-center gap-2 rounded bg-pillar4 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <Globe className={`w-4 h-4 ${intlLoading ? "animate-pulse" : ""}`} />
          {intlLoading ? "수집 중…" : "국제 입찰 모니터링 실행"}
        </button>
        {intlError && (
          <p className="text-sm text-destructive mt-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {intlError}
          </p>
        )}
        {intlResult && (
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div className="text-sm text-foreground font-medium">
              관련 입찰 <strong>{intlResult.length}</strong>건 (관련성 60 초과)
            </div>
            {intlResult.length > 0 ? (
              <ul className="space-y-3">
                {intlResult.map((t, i) => (
                  <li key={t.id || i} className="rounded border border-border bg-background/50 p-3 text-sm">
                    <div className="font-medium text-foreground mb-1">{t.title}</div>
                    <div className="flex flex-wrap gap-3 text-muted-foreground">
                      <span className="rounded bg-pillar4/20 text-pillar4 px-1.5 py-0.5 text-xs">{t.source}</span>
                      <span>관련성 {t.relevance}%</span>
                      {t.estimated_value != null && <span>추정 $ {(t.estimated_value / 1e6).toFixed(2)}M</span>}
                      {t.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {t.deadline}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">관련성 60 초과 입찰이 없습니다.</p>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="입찰 자격 검토 (Check Qualification)" className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          입찰 문서에서 요건 추출 → 필수/우대 충족 여부 · 미충족 시 취득 가능성·소요기간 → 권고(DO NOT BID / MARGINAL / ELIGIBLE)
        </p>
        <div className="mb-4">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            입찰 문서 요건 (선택, 한 줄에 하나. 비우면 기본 요건으로 검토)
          </label>
          <textarea
            value={qualDoc}
            onChange={(e) => setQualDoc(e.target.value)}
            placeholder={"필수: ISO 9001 인증 보유\n필수: 과거 3년 이내 유사 사업 실적\n우대: ISO 27001 인증"}
            rows={4}
            className="rounded border border-border bg-background px-3 py-2 text-sm w-full font-mono"
          />
        </div>
        <button
          onClick={runCheckQualification}
          disabled={qualLoading}
          className="flex items-center gap-2 rounded bg-pillar4 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <FileCheck className={`w-4 h-4 ${qualLoading ? "animate-pulse" : ""}`} />
          {qualLoading ? "검토 중…" : "자격 검토 실행"}
        </button>
        {qualError && (
          <p className="text-sm text-destructive mt-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {qualError}
          </p>
        )}
        {qualResult && (
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div
              className={
                qualResult.recommendation?.decision === "DO NOT BID"
                  ? "text-destructive font-medium"
                  : qualResult.recommendation?.decision === "ELIGIBLE"
                  ? "text-green-600 dark:text-green-400 font-medium"
                  : "text-amber-500 font-medium"
              }
            >
              권고: {qualResult.recommendation?.decision}
              {qualResult.recommendation?.reason && ` — ${qualResult.recommendation.reason}`}
              {qualResult.recommendation?.score != null && ` (점수 ${qualResult.recommendation.score})`}
              {qualResult.recommendation?.competitive_edge != null && ` · 우대 충족 ${qualResult.recommendation.competitive_edge}건`}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded border border-border bg-background/50 p-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">필수 충족</div>
                <ul className="space-y-1">
                  {qualResult.checklist?.mandatory?.map((m, i) => (
                    <li key={i}>{m.requirement} — {m.status} {m.evidence && `(${m.evidence})`}</li>
                  ))}
                  {!qualResult.checklist?.mandatory?.length && <li className="text-muted-foreground">—</li>}
                </ul>
              </div>
              <div className="rounded border border-border bg-background/50 p-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">우대 충족</div>
                <ul className="space-y-1">
                  {qualResult.checklist?.preferred?.map((p, i) => (
                    <li key={i}>{p.requirement} — {p.status}</li>
                  ))}
                  {!qualResult.checklist?.preferred?.length && <li className="text-muted-foreground">—</li>}
                </ul>
              </div>
              <div className="rounded border border-border bg-background/50 p-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">미충족</div>
                <ul className="space-y-1">
                  {qualResult.checklist?.missing?.map((m, i) => (
                    <li key={i} className="text-destructive/90">{m.requirement} — {m.can_obtain}, {m.time_needed}</li>
                  ))}
                  {!qualResult.checklist?.missing?.length && <li className="text-muted-foreground">없음</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="최적 입찰가 산정 (Optimal Bid)" className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          원가 추정 → 유사 입찰 과거 낙찰가 → 마진 5~30% 시나리오별 승률·기대이익 → 최적 입찰가 · 리스크(원가초과/지급지연/범위 creep)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">사업 범위</label>
            <input
              type="text"
              value={bidScope}
              onChange={(e) => setBidScope(e.target.value)}
              placeholder="시스템 구축 및 유지보수"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">계약 기간</label>
            <input
              type="text"
              value={bidPeriod}
              onChange={(e) => setBidPeriod(e.target.value)}
              placeholder="12개월"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">수행 지역</label>
            <input
              type="text"
              value={bidLocation}
              onChange={(e) => setBidLocation(e.target.value)}
              placeholder="국내 / 해외"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">예산 상한 (원, 선택)</label>
            <input
              type="number"
              value={bidBudget}
              onChange={(e) => setBidBudget(e.target.value)}
              placeholder="비우면 과거 낙찰 평균×1.2"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">발주기관 (선택)</label>
            <input
              type="text"
              value={bidAgency}
              onChange={(e) => setBidAgency(e.target.value)}
              placeholder="지급 지연 리스크 평가용"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
        </div>
        <button
          onClick={runOptimalBid}
          disabled={bidLoading}
          className="flex items-center gap-2 rounded bg-pillar4 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <TrendingUp className={`w-4 h-4 ${bidLoading ? "animate-pulse" : ""}`} />
          {bidLoading ? "계산 중…" : "최적 입찰가 계산"}
        </button>
        {bidError && (
          <p className="text-sm text-destructive mt-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {bidError}
          </p>
        )}
        {bidResult && (
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="font-medium text-foreground">
                권장 입찰가: ₩{bidResult.recommended_bid?.toLocaleString()}
              </span>
              <span className="text-muted-foreground">승률(신뢰도) {(bidResult.confidence * 100)?.toFixed(0)}%</span>
              <span className="text-muted-foreground">원가 추정 ₩{bidResult.cost_estimate?.toLocaleString()}</span>
              <span className="text-muted-foreground">예산 상한 ₩{bidResult.budget_ceiling?.toLocaleString()}</span>
            </div>
            {bidResult.risk_analysis && (
              <div className="text-xs text-muted-foreground">
                리스크: 원가초과 {bidResult.risk_analysis.cost_overrun_risk} · 지급지연 {bidResult.risk_analysis.payment_delay_risk} · 범위 creep {bidResult.risk_analysis.scope_creep_risk}
              </div>
            )}
            {bidResult.all_scenarios?.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">시나리오별</div>
                <ul className="space-y-1 text-sm">
                  {bidResult.all_scenarios.map((s, i) => (
                    <li key={i} className="flex justify-between items-center rounded border border-border bg-background/50 px-3 py-2">
                      <span>마진 {s.markup}% · ₩{s.bid_amount?.toLocaleString()}</span>
                      <span>승률 {(s.win_probability * 100).toFixed(0)}% · 기대이익 ₩{s.expected_profit?.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="제안서 자동 생성 (Generate Proposal)" className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          템플릿 선택 → 회사소개/기술제안/이행계획(간트)/팀/예산 섹션 작성 → 조립 → 품질검사 → 제출 체크리스트
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">입찰 유형</label>
            <select
              value={propType}
              onChange={(e) => setPropType(e.target.value)}
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            >
              <option value="SI">SI/시스템</option>
              <option value="consulting">용역/컨설팅</option>
              <option value="standard">일반</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">사업 범위</label>
            <input
              type="text"
              value={propScope}
              onChange={(e) => setPropScope(e.target.value)}
              placeholder="전자정부 시스템 구축"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">계약 기간</label>
            <input
              type="text"
              value={propPeriod}
              onChange={(e) => setPropPeriod(e.target.value)}
              placeholder="12개월"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">필요 전문성 (쉼표 구분)</label>
            <input
              type="text"
              value={propExpertise}
              onChange={(e) => setPropExpertise(e.target.value)}
              placeholder="PM, 개발, QA"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">기술 요구사항 (선택)</label>
            <input
              type="text"
              value={propTech}
              onChange={(e) => setPropTech(e.target.value)}
              placeholder="기술 제안서 컨텍스트"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">제출 가이드라인 (선택)</label>
            <input
              type="text"
              value={propGuidelines}
              onChange={(e) => setPropGuidelines(e.target.value)}
              placeholder="품질검사 시 참고"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
        </div>
        <button
          onClick={runGenerateProposal}
          disabled={propLoading}
          className="flex items-center gap-2 rounded bg-pillar4 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <FileText className={`w-4 h-4 ${propLoading ? "animate-pulse" : ""}`} />
          {propLoading ? "생성 중…" : "제안서 생성"}
        </button>
        {propError && (
          <p className="text-sm text-destructive mt-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {propError}
          </p>
        )}
        {propResult && (
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div className="text-sm font-medium text-foreground">{propResult.document?.summary}</div>
            <div className="text-xs text-muted-foreground">
              템플릿: {propResult.document?.template} · 섹션: {propResult.document?.sections && Object.keys(propResult.document.sections).join(", ")}
            </div>
            {propResult.qc_report && (
              <div className="flex flex-wrap items-center gap-2">
                <span>품질검사: 점수 {propResult.qc_report.score} · {propResult.qc_report.passed ? "통과" : "이슈 있음"}</span>
                {propResult.qc_report.issues?.length > 0 && (
                  <ul className="text-xs text-amber-600 dark:text-amber-400">
                    {propResult.qc_report.issues.map((i, idx) => (
                      <li key={idx}>{i.section}: {i.message}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {propResult.checklist?.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">제출 체크리스트</div>
                <ul className="text-sm space-y-1">
                  {propResult.checklist.map((item, i) => (
                    <li key={i}>· {item}</li>
                  ))}
                </ul>
              </div>
            )}
            {propResult.file_formats && (
              <div className="text-xs text-muted-foreground">
                다운로드: DOCX · PDF (실제 변환 연동 시 제공)
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="참고" className="mb-6">
        <p className="text-sm text-muted-foreground">
          나라장터: <code className="rounded bg-muted px-1">G2B_API_KEY</code>로 공공데이터포털 BidPublicInfoService 호출 후 XML 파싱.
          국제: UNGM(스크래핑), World Bank(API), ADB(RSS) 실제 연동 시 해당 메서드로 수집합니다. 현재는 스텁 데이터로 동작합니다.
        </p>
      </SectionCard>
    </div>
  );
}
