/**
 * Market Intel report file generator.
 * Builds report data from options + segmented analysis + news, then outputs PDF/DOCX/Excel/JSON.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  MarketReportOutputOptions,
  ReportLanguage,
  GranularAnalysisRequest,
  SegmentedAnalysisResult,
  NewsSummaryItem,
  TopCompanyDetail,
} from "./marketIntel/types.js";
import { runMarketIntelSupervisor } from "./marketIntelAgents/index.js";
import { buildTopCompanyDetails } from "./marketIntelService.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** In-memory store: jobId -> { path, contentType, filename } for download route */
const reportFileStore = new Map<string, { path: string; contentType: string; filename: string }>();

export function getReportFileMeta(jobId: string): { path: string; contentType: string; filename: string } | null {
  return reportFileStore.get(jobId) ?? null;
}

/** Report content data passed to formatters */
export interface ReportData {
  title: string;
  generatedAt: string;
  orgId: string;
  countryCode: string;
  options: MarketReportOutputOptions;
  granularRequest: GranularAnalysisRequest | null;
  segmentedResult: SegmentedAnalysisResult | null;
  newsItems: NewsSummaryItem[];
  topCompanyDetails: TopCompanyDetail[];
  lang: ReportLanguage;
}

const TITLES: Record<ReportLanguage, string> = {
  ko: "시장 인텔 리포트",
  en: "Market Intel Report",
  es: "Informe de Inteligencia de Mercado",
};

const SECTION_LABELS: Record<ReportLanguage, { scopeNote: string; marketDominance: string; top10Buyers: string; relatedCompanies: string; top3Details: string; newsSummary: string }> = {
  ko: { scopeNote: "데이터 범위", marketDominance: "시장 장악 (주요 파트너국)", top10Buyers: "주요 바이어/업체 Top 10", relatedCompanies: "관련 업체 리스트 Top 10", top3Details: "1~3위 업체 상세 (1업체 1페이지)", newsSummary: "뉴스 요약" },
  en: { scopeNote: "Data scope", marketDominance: "Market dominance (top partners)", top10Buyers: "Top 10 buyers/companies", relatedCompanies: "Related companies Top 10", top3Details: "Top 3 company details (1 page each)", newsSummary: "News summary" },
  es: { scopeNote: "Alcance de datos", marketDominance: "Dominancia de mercado (principales socios)", top10Buyers: "Top 10 compradores/empresas", relatedCompanies: "Empresas relacionadas Top 10", top3Details: "Detalle 3 principales (1 página cada una)", newsSummary: "Resumen de noticias" },
};

/** Gather all data needed for the report (via Supervisor + Top 3 company details) */
export async function buildReportData(orgId: string, countryCode: string): Promise<ReportData> {
  const { request, segmentedResult, newsItems, options, lang } = await runMarketIntelSupervisor(orgId, countryCode);
  const granularRequest = request;
  const topCompanyDetails = segmentedResult ? await buildTopCompanyDetails(segmentedResult, lang) : [];
  const title = `${TITLES[lang]} · ${countryCode}`;
  const generatedAt = new Date().toLocaleString(lang === "es" ? "es-ES" : lang === "en" ? "en-US" : "ko-KR", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  });
  return {
    title,
    generatedAt,
    orgId,
    countryCode,
    options,
    granularRequest,
    segmentedResult,
    newsItems,
    topCompanyDetails,
    lang,
  };
}

/** Generate JSON buffer */
function toJsonBuffer(data: ReportData): Buffer {
  const out = {
    title: data.title,
    generatedAt: data.generatedAt,
    orgId: data.orgId,
    countryCode: data.countryCode,
    options: data.options,
    request: data.granularRequest,
    segmentedResult: data.segmentedResult,
    topCompanyDetails: data.topCompanyDetails,
    newsItems: data.newsItems,
  };
  return Buffer.from(JSON.stringify(out, null, 2), "utf-8");
}

export interface MarketReportJob {
  job_id: string;
  status: "pending" | "completed" | "failed";
  message: string;
  download_url?: string | null;
  format?: string;
}

/** Generate PDF buffer (다국어 섹션 + Top 10 + 1~3위 업체 1페이지 상세) */
async function toPdfBuffer(data: ReportData): Promise<Buffer> {
  const PDFDocument = (await import("pdfkit")).default;
  const labels = SECTION_LABELS[data.lang] ?? SECTION_LABELS.ko;
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text(data.title, { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`${data.lang === "ko" ? "생성일" : data.lang === "es" ? "Generado" : "Generated"}: ${data.generatedAt}`, { align: "center" });
    doc.moveDown(2);

    if (data.granularRequest?.item) {
      const hs = data.granularRequest.hs_code?.trim();
      const scopeText = hs && /^\d{4}(\d{2})?$/.test(hs) ? `HS ${hs}` : (data.lang === "ko" ? "전품목(TOTAL)" : "All products (TOTAL)");
      doc.fontSize(12).text(`${data.granularRequest.item} · ${data.granularRequest.country_code} · ${labels.scopeNote}: ${scopeText}`);
      doc.moveDown();
    }

    if (data.segmentedResult?.market_dominance?.length) {
      doc.fontSize(12).text(labels.marketDominance, { underline: true });
      doc.moveDown(0.5);
      for (const md of data.segmentedResult.market_dominance) {
        doc.fontSize(10).text(`${md.research_type_label ?? md.research_type}: ${md.metric}`);
        for (const p of md.top_players ?? []) {
          doc.text(`  · ${p.name}: ${p.share_or_value}`, { indent: 20 });
        }
        doc.moveDown(0.5);
      }
      doc.moveDown();
    }

    if (data.segmentedResult?.related_companies?.length) {
      doc.fontSize(12).text(labels.relatedCompanies, { underline: true });
      doc.moveDown(0.5);
      for (const c of data.segmentedResult.related_companies) {
        doc.fontSize(10).text(`· ${c.company_name} (${c.country_code}) · ${c.products_or_hs}`);
        doc.text(`  ${c.reason}`, { indent: 20 });
      }
      doc.moveDown(2);
    }

    if (data.topCompanyDetails?.length) {
      for (const co of data.topCompanyDetails) {
        doc.addPage();
        doc.fontSize(14).text(`${data.lang === "ko" ? "업체 상세" : data.lang === "es" ? "Detalle empresa" : "Company detail"} #${co.rank}: ${co.company_name}`, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`${data.lang === "ko" ? "국가" : "Country"}: ${co.country_code}`);
        doc.text(`${data.lang === "ko" ? "품목/HS" : "Products/HS"}: ${co.products_or_hs}`);
        if (co.company_type) doc.text(`${data.lang === "ko" ? "업체 유형" : "Type"}: ${co.company_type}`);
        if (co.contact?.url) doc.text(`URL: ${co.contact.url}`);
        if (co.contact?.company_number) doc.text(`Company No.: ${co.contact.company_number}`);
        if (co.contact?.incorporation_date) doc.text(`${data.lang === "ko" ? "설립일" : "Incorporation"}: ${co.contact.incorporation_date}`);
        doc.moveDown(0.3);
        if (co.trade_note) { doc.text(co.trade_note, { indent: 15 }); doc.moveDown(0.3); }
        if (co.product_preference_region) { doc.text(co.product_preference_region, { indent: 15 }); doc.moveDown(0.3); }
        doc.text(`${data.lang === "ko" ? "추천 이유" : "Reason"}: ${co.reason}`);
        doc.moveDown(1);
      }
    }

    if (data.newsItems?.length) {
      doc.addPage();
      doc.fontSize(12).text(labels.newsSummary, { underline: true });
      doc.moveDown(0.5);
      for (const n of data.newsItems.slice(0, 10)) {
        doc.fontSize(10).text(`· ${n.title}`, { continued: false });
        doc.text(n.summary?.slice(0, 200) ?? "", { indent: 20 });
        doc.moveDown(0.3);
      }
    }

    doc.end();
  });
}

/** Generate DOCX buffer (다국어 + Top 10 + 1~3위 업체 1페이지 상세) */
async function toDocxBuffer(data: ReportData): Promise<Buffer> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    HeadingLevel,
    AlignmentType,
    PageBreak,
  } = await import("docx");

  const labels = SECTION_LABELS[data.lang] ?? SECTION_LABELS.ko;
  type DocElement = InstanceType<typeof Paragraph> | InstanceType<typeof Table>;
  const children: DocElement[] = [
    new Paragraph({
      text: data.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `${data.lang === "ko" ? "생성일" : data.lang === "es" ? "Generado" : "Generated"}: ${data.generatedAt}`, size: 22 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  ];

  if (data.granularRequest?.item) {
    const hs = data.granularRequest.hs_code?.trim();
    const scopeText = hs && /^\d{4}(\d{2})?$/.test(hs) ? `HS ${hs}` : (data.lang === "ko" ? "전품목(TOTAL)" : "All products (TOTAL)");
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${data.granularRequest.item} · ${data.granularRequest.country_code}`, bold: true }),
          new TextRun({ text: `  ${labels.scopeNote}: ${scopeText}` }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  if (data.segmentedResult?.market_dominance?.length) {
    children.push(
      new Paragraph({ text: labels.marketDominance, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 } })
    );
    for (const md of data.segmentedResult.market_dominance) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${md.research_type_label ?? md.research_type}: ${md.metric}`, bold: true })],
          spacing: { after: 100 },
        })
      );
      const rows = (md.top_players ?? []).map(
        (p) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun(p.name)] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun(p.share_or_value)] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun(p.description ?? "")] })] }),
            ],
          })
      );
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun("Name")] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun("Share")] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun("Description")] })] }),
              ],
            }),
            ...rows,
          ],
        })
      );
    }
  }

  if (data.segmentedResult?.related_companies?.length) {
    children.push(
      new Paragraph({ text: labels.relatedCompanies, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 } })
    );
    const companyRows = data.segmentedResult.related_companies.map(
      (c) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun(c.company_name)] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun(c.country_code)] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun(c.products_or_hs)] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun(c.reason)] })] }),
          ],
        })
    );
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun("Company")] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun("Country")] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun("Products/HS")] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun("Reason")] })] }),
            ],
          }),
          ...companyRows,
        ],
      })
    );
  }

  if (data.topCompanyDetails?.length) {
    children.push(
      new Paragraph({ text: labels.top3Details, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 } })
    );
    for (const co of data.topCompanyDetails) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `#${co.rank} ${co.company_name}`, bold: true, size: 28 })],
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        })
      );
      children.push(new Paragraph({ children: [new TextRun(`${data.lang === "ko" ? "국가" : "Country"}: ${co.country_code}`)], spacing: { after: 80 } }));
      children.push(new Paragraph({ children: [new TextRun(`${data.lang === "ko" ? "품목/HS" : "Products/HS"}: ${co.products_or_hs}`)], spacing: { after: 80 } }));
      if (co.company_type) children.push(new Paragraph({ children: [new TextRun(`${data.lang === "ko" ? "업체 유형" : "Type"}: ${co.company_type}`)], spacing: { after: 80 } }));
      if (co.contact?.url) children.push(new Paragraph({ children: [new TextRun(`URL: ${co.contact.url}`)], spacing: { after: 80 } }));
      if (co.contact?.company_number) children.push(new Paragraph({ children: [new TextRun(`Company No.: ${co.contact.company_number}`)], spacing: { after: 80 } }));
      if (co.contact?.incorporation_date) children.push(new Paragraph({ children: [new TextRun(`${data.lang === "ko" ? "설립일" : "Incorporation"}: ${co.contact.incorporation_date}`)], spacing: { after: 80 } }));
      if (co.trade_note) children.push(new Paragraph({ children: [new TextRun(co.trade_note)], spacing: { after: 120 } }));
      if (co.product_preference_region) children.push(new Paragraph({ children: [new TextRun(co.product_preference_region)], spacing: { after: 120 } }));
      children.push(new Paragraph({ children: [new TextRun(`${data.lang === "ko" ? "추천 이유" : "Reason"}: ${co.reason}`)], spacing: { after: 200 } }));
    }
  }

  if (data.newsItems?.length) {
    children.push(
      new Paragraph({ text: labels.newsSummary, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 } })
    );
    for (const n of data.newsItems.slice(0, 15)) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: n.title, bold: true }), new TextRun({ text: ` (${n.source})`, italics: true })],
          spacing: { after: 80 },
        }),
        new Paragraph({ children: [new TextRun(n.summary?.slice(0, 500) ?? "")], spacing: { after: 200 } })
      );
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

/** Generate Excel buffer */
async function toExcelBuffer(data: ReportData): Promise<Buffer> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "YuantO Ai Market Intel";
  wb.created = new Date();

  const wsSummary = wb.addWorksheet("Summary", { views: [{ state: "frozen", ySplit: 1 }] });
  wsSummary.columns = [
    { header: "Field", width: 18 },
    { header: "Value", width: 50 },
  ];
  wsSummary.addRow(["Title", data.title]);
  wsSummary.addRow(["Generated", data.generatedAt]);
  wsSummary.addRow(["Country", data.countryCode]);
  if (data.granularRequest?.item) {
    wsSummary.addRow(["Item", data.granularRequest.item]);
    wsSummary.addRow(["HS Code", data.granularRequest.hs_code || "—"]);
  }
  wsSummary.getRow(1).font = { bold: true };

  if (data.segmentedResult?.market_dominance?.length) {
    const wsDominance = wb.addWorksheet("Market dominance", { views: [{ state: "frozen", ySplit: 1 }] });
    wsDominance.columns = [
      { header: "Research type", width: 18 },
      { header: "Metric", width: 28 },
      { header: "Player", width: 24 },
      { header: "Share/Value", width: 14 },
      { header: "Description", width: 40 },
    ];
    wsDominance.getRow(1).font = { bold: true };
    for (const md of data.segmentedResult.market_dominance) {
      for (const p of md.top_players ?? []) {
        wsDominance.addRow([md.research_type_label ?? md.research_type, md.metric, p.name, p.share_or_value, p.description ?? ""]);
      }
    }
  }

  if (data.segmentedResult?.related_companies?.length) {
    const wsCompanies = wb.addWorksheet("Related companies Top10", { views: [{ state: "frozen", ySplit: 1 }] });
    wsCompanies.columns = [
      { header: "Company", width: 28 },
      { header: "Country", width: 10 },
      { header: "Products/HS", width: 20 },
      { header: "Reason", width: 40 },
    ];
    wsCompanies.getRow(1).font = { bold: true };
    for (const c of data.segmentedResult.related_companies) {
      wsCompanies.addRow([c.company_name, c.country_code, c.products_or_hs, c.reason]);
    }
  }

  if (data.topCompanyDetails?.length) {
    const wsTop3 = wb.addWorksheet("Top3 company details", { views: [{ state: "frozen", ySplit: 1 }] });
    wsTop3.columns = [
      { header: "Rank", width: 6 },
      { header: "Company", width: 28 },
      { header: "Country", width: 10 },
      { header: "Products/HS", width: 18 },
      { header: "Type", width: 18 },
      { header: "URL", width: 40 },
      { header: "Company No.", width: 14 },
      { header: "Incorporation", width: 12 },
      { header: "Trade note", width: 50 },
      { header: "Preference/Region", width: 50 },
      { header: "Reason", width: 40 },
    ];
    wsTop3.getRow(1).font = { bold: true };
    for (const co of data.topCompanyDetails) {
      wsTop3.addRow([
        co.rank,
        co.company_name,
        co.country_code,
        co.products_or_hs,
        co.company_type ?? "",
        co.contact?.url ?? "",
        co.contact?.company_number ?? "",
        co.contact?.incorporation_date ?? "",
        co.trade_note ?? "",
        co.product_preference_region ?? "",
        co.reason,
      ]);
    }
  }

  if (data.newsItems?.length) {
    const wsNews = wb.addWorksheet("News", { views: [{ state: "frozen", ySplit: 1 }] });
    wsNews.columns = [
      { header: "Title", width: 50 },
      { header: "Summary", width: 60 },
      { header: "Source", width: 18 },
      { header: "Date", width: 12 },
    ];
    wsNews.getRow(1).font = { bold: true };
    for (const n of data.newsItems) {
      wsNews.addRow([n.title, n.summary ?? "", n.source, n.date ?? ""]);
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  word: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  json: "application/json",
};

const EXT: Record<string, string> = {
  pdf: "pdf",
  word: "docx",
  docx: "docx",
  excel: "xlsx",
  json: "json",
};

/** Generate report buffer by format */
export async function generateReportBuffer(data: ReportData, format: string): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const f = format?.toLowerCase() ?? "pdf";
  const ext = EXT[f] ?? "pdf";
  const contentType = MIME[f] ?? MIME.pdf;
  let buffer: Buffer;
  if (f === "json") buffer = toJsonBuffer(data);
  else if (f === "pdf") buffer = await toPdfBuffer(data);
  else if (f === "word" || f === "docx") buffer = await toDocxBuffer(data);
  else if (f === "excel") buffer = await toExcelBuffer(data);
  else buffer = await toPdfBuffer(data);
  return { buffer, contentType, ext };
}

const REPORTS_DIR = join(__dirname, "..", "reports");

/** Save report to disk and register for download; returns download path segment */
async function saveReport(jobId: string, buffer: Buffer, format: string, ext: string, contentType: string): Promise<string> {
  await mkdir(REPORTS_DIR, { recursive: true });
  const filename = `${jobId}.${ext}`;
  const path = join(REPORTS_DIR, filename);
  await writeFile(path, buffer);
  reportFileStore.set(jobId, { path, contentType, filename });
  return `/api/market-intel/reports/${jobId}/download`;
}

/** Generate report and return job with download_url */
export async function generateMarketReportAsync(orgId: string, countryCode: string): Promise<MarketReportJob> {
  const job_id = `mr_${orgId}_${countryCode}_${Date.now()}`;
  try {
    const data = await buildReportData(orgId, countryCode);
    const options = data.options;
    const format = options.format ?? "pdf";
    const { buffer, contentType, ext } = await generateReportBuffer(data, format);
    const downloadPath = await saveReport(job_id, buffer, format, ext, contentType);
    const baseUrl = process.env.API_BASE_URL ?? "";
    const download_url = baseUrl ? `${baseUrl.replace(/\/$/, "")}${downloadPath}` : downloadPath;
    return {
      job_id,
      status: "completed",
      message: "Report generated successfully. Use the link below to download.",
      download_url,
      format: options.format,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Report generation failed";
    return {
      job_id,
      status: "failed",
      message,
      download_url: null,
      format: undefined,
    };
  }
}
