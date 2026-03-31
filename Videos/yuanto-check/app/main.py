"""
Smart factory task management API.
- Execution: checklist compliance, evidence photos.
- Review/Strategy: department progress, improvement rate, executive reports.
- Security: RBAC, AI data anonymization, audit log.
"""
import io
import json
import logging
import os
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import List, Optional

import pandas as pd
from fastapi import BackgroundTasks, Depends, FastAPI, File, Form, Header, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware


# Re-add `app.ai_engine` and `app.report_generator` imports.
from app.ai_engine import YuantoAI, build_context_from_summary, USE_GEMINI
from app.report_generator import generate_monthly_report
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import or_, func
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError
from pydantic import BaseModel

from app.config import settings as app_settings
from app.database import get_db, init_sqlite_db
from app.models import (
    AuditLog,
    Checklist,
    CompanyEvent,
    DeptGoal,
    DeptImprovement,
    AISuggestion,
    CEOApproval,
    EmpleadoDelMes,
    ExecutionLog,
    IncentiveScore,
    MeetingRoom,
    NonconformityEvidence,
    NonconformityReport,
    Organization,
    OrdenTrabajo,
    OrdenTrabajoRepuesto,
    PersonalTask,
    PlantEquipment,
    Document,
    DocumentRevision,
    ReporteFalla,
    RoomReservation,
    SolicitudRepuesto,
    SupervisorNotification,
    SyncIdempotency,
    User,
    UserAppPreferences,
    UserCalendarEvent,
    UserNotificationSettings,
)
from app.security import (
    ALLOWED_ADMIN_USERS,
    ALLOWED_AI_COPILOT_REMINDERS,
    ALLOWED_DASHBOARD_EXCEL_REPORT,
    ALLOWED_DEPT_MODULE,
    ALLOWED_TASKS_SUBMIT,
    build_sanitized_context,
    context_hash,
    get_current_user,
    require_roles,
    verify_internal_api_key,
)
from app.services.progress import (
    calculate_dept_progress,
    calculate_improvement_rate,
    get_descendant_dept_ids,
)
from app.services.incentives import (
    get_annual_accumulation,
    get_monthly_ranking_raw,
    get_my_rank_and_resting,
    get_team_league,
    select_empleado_del_mes,
)
from app.services.idempotency import (
    IdempotencyConflictError,
    IdempotencyPendingError,
    finalize_idempotent_response,
    hash_request_payload,
    reserve_or_get_idempotent_response,
)

app = FastAPI(
    title="Yuanto Smart System",
    description="Aggregation by org chart, executive reporting, field evidence photos.",
    version="0.1.0",
)

UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

_allowed_origins: list = app_settings.get_allowed_origins()
if app_settings.app_env.strip().lower() in ("production", "prod") and not _allowed_origins:
    raise RuntimeError("ALLOWED_ORIGINS must be configured in production.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=_allowed_origins != ["*"],
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Idempotency-Key", "X-Internal-Key"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

from app.routers import admin_users as admin_users_router
from app.routers import auth as auth_router
from app.routers import checklists as checklists_router
from app.routers import kpi as kpi_router
from app.routers.kpi import build_summary_response
from app.routers import maintenance as maintenance_router
from app.routers import plant_equipment as plant_equipment_router
from app.routers import organizations as organizations_router
from app.routers import inventory as inventory_router
from app.routers import vehicles as vehicles_router
from app.routers import fleet_ops as fleet_ops_router
from app.routers import paper_rolls as paper_rolls_router
from app.routers import field_reports as field_reports_router
from app.routers import crm_mobile as crm_mobile_router
from app.routers import integrations as integrations_router
from app.routers import planchas_inventory as planchas_inventory_router
from app.routers import quality_defects as quality_defects_router
from app.routers import ctq_quality as ctq_quality_router
from app.routers import qc_line_entry as qc_line_entry_router
from app.routers import claim_analysis as claim_analysis_router
from app.routers import rca_reports as rca_reports_router
from app.routers import ctq_chapter3_checklist as ctq_ch3_router
from app.routers import msa_quality as msa_quality_router
from app.routers import chapter4_measurement as chapter4_measurement_router
from app.routers import inspection_events as inspection_events_router

app.include_router(auth_router.router)
app.include_router(admin_users_router.router)
app.include_router(organizations_router.router)
app.include_router(checklists_router.router)
app.include_router(kpi_router.router)
app.include_router(maintenance_router.router)
app.include_router(plant_equipment_router.router)
app.include_router(inventory_router.router)
app.include_router(planchas_inventory_router.router)
app.include_router(quality_defects_router.router)
app.include_router(ctq_quality_router.router)
app.include_router(qc_line_entry_router.router)
app.include_router(claim_analysis_router.router)
app.include_router(rca_reports_router.router)
app.include_router(ctq_ch3_router.router)
app.include_router(msa_quality_router.router)
app.include_router(chapter4_measurement_router.router)
app.include_router(inspection_events_router.router)
app.include_router(vehicles_router.router)
app.include_router(fleet_ops_router.router)
app.include_router(paper_rolls_router.router)
app.include_router(field_reports_router.router)
app.include_router(crm_mobile_router.router)
app.include_router(integrations_router.router)


@app.on_event("startup")
def _startup_sqlite_schema():
    """기존 yuanto.db에 모델 대비 누락된 테이블/컬럼 보정 (SQLite)."""
    log = logging.getLogger(__name__)
    try:
        init_sqlite_db()
    except Exception as e:
        log.warning("SQLite schema init skipped: %s", e)
    try:
        from app.database import SessionLocal
        from app.services.ctq_seed import ensure_ctq_seed
        from app.services.quality_extensions_seed import ensure_quality_extensions
        from app.services.msa_tools_seed import ensure_msa_tools_seed

        db = SessionLocal()
        try:
            a, b = ensure_ctq_seed(db)
            if a or b:
                log.info("CTQ seed: master_ctq=%s diccionario_defectos=%s", a, b)
            m2, d2 = ensure_quality_extensions(db)
            if m2 or d2:
                log.info("Quality extensions: master_ctq=%s diccionario=%s", m2, d2)
            n_msa = ensure_msa_tools_seed(db)
            if n_msa:
                log.info("MSA tools seed: added=%s", n_msa)
        finally:
            db.close()
    except Exception as e:
        log.warning("CTQ seed skipped: %s", e)


logger = logging.getLogger(__name__)

_IMPORT_MIME_ALLOW = frozenset(
    {
        "text/csv",
        "application/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/octet-stream",
        "text/plain",
        "",
    }
)


async def _read_upload_limited(upload: UploadFile) -> bytes:
    """Read upload body with max size from settings (MB)."""
    max_b = max(int(app_settings.max_upload_size_mb or 10), 1) * 1024 * 1024
    data = await upload.read(max_b + 1)
    if len(data) > max_b:
        raise HTTPException(
            status_code=413,
            detail=f"Archivo demasiado grande (máximo {app_settings.max_upload_size_mb} MB).",
        )
    return data


def _validate_import_upload(upload: UploadFile) -> None:
    """CSV/XLSX import: extension + loose Content-Type check."""
    fn = (upload.filename or "").lower()
    if not (fn.endswith(".csv") or fn.endswith(".xlsx")):
        raise HTTPException(status_code=400, detail="Solo CSV o XLSX.")
    ct = (upload.content_type or "").split(";")[0].strip().lower()
    if ct not in _IMPORT_MIME_ALLOW:
        raise HTTPException(
            status_code=400,
            detail="Tipo de archivo no permitido. Use CSV o Excel (.xlsx).",
        )


@app.exception_handler(Exception)
def global_exception_handler(request, exc):
    """Unhandled exceptions: log and return generic 500. Do not override HTTPException."""
    if isinstance(exc, HTTPException):
        raise exc
    logger.exception("Unhandled exception: %s", exc)
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": "Error del servidor. Intente de nuevo más tarde o contacte al administrador."},
    )


@app.on_event("startup")
def startup():
    """Create tables when using SQLite (first run on PC server). Add new columns if missing."""
    from sqlalchemy import text
    from app.database import engine, get_sqlite_path_if_used
    if "sqlite" in str(engine.url):
        db_path = get_sqlite_path_if_used()
        if db_path:
            logger.info("SQLite DB path: %s", db_path)
        from app.database import Base
        from app import models  # noqa: F401
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Tables created or verified successfully.")
        except Exception as e:
            logger.exception("Table create_all failed: %s", e)
        for col, typ in [
            ("task_type", "VARCHAR(20) DEFAULT 'routine'"),
            ("layer", "VARCHAR(20)"),
            ("scheduled_time", "VARCHAR(10)"),
            ("requires_photo", "BOOLEAN DEFAULT 0"),
            ("assignee_id", "INTEGER"),
            ("requires_ppe", "BOOLEAN DEFAULT 0"),
            ("iso_clause", "VARCHAR(20)"),
            ("iso_standard", "VARCHAR(10)"),
        ]:
            try:
                with engine.connect() as c:
                    c.execute(text(f"ALTER TABLE checklists ADD COLUMN {col} {typ}"))
                    c.commit()
            except Exception as e:
                logger.debug("ALTER checklists %s (may already exist): %s", col, e)
        for col, typ in [
            ("evidence_path", "VARCHAR(500)"),
            ("audited_by", "INTEGER"),
            ("audited_at", "DATETIME"),
        ]:
            try:
                with engine.connect() as c:
                    c.execute(text(f"ALTER TABLE execution_logs ADD COLUMN {col} {typ}"))
                    c.commit()
            except Exception as e:
                logger.debug("ALTER execution_logs %s (may already exist): %s", col, e)
        for col, typ in [
            ("employee_id", "VARCHAR(50)"),
        ]:
            try:
                with engine.connect() as c:
                    c.execute(text(f"ALTER TABLE users ADD COLUMN {col} {typ}"))
                    c.commit()
            except Exception as e:
                logger.debug("ALTER users %s (may already exist): %s", col, e)
        # Nonconformity reports (ISO 8.7, 10.2)
        try:
            NonconformityReport.__table__.create(bind=engine, checkfirst=True)
        except Exception as e:
            logger.debug("Create nonconformity_reports (may exist): %s", e)
        # Mantenimiento: OT extended columns + orden_trabajo_repuesto
        for col, typ in [
            ("fecha_ot", "DATE"),
            ("prioridad", "VARCHAR(20) DEFAULT 'media'"),
            ("area_seccion", "VARCHAR(80)"),
            ("equipment_name", "VARCHAR(200)"),
            ("equipment_code", "VARCHAR(50)"),
            ("solicitante_id", "INTEGER"),
            ("descripcion_falla", "TEXT"),
            ("tipo_trabajo", "VARCHAR(30)"),
            ("lockout_tagout", "BOOLEAN DEFAULT 0"),
            ("descripcion_trabajo", "TEXT"),
            ("started_at", "DATETIME"),
            ("finished_at", "DATETIME"),
            ("epp_durante_trabajo", "BOOLEAN"),
            ("epp_validado", "VARCHAR(20)"),
            ("supervisor_id", "INTEGER"),
            ("photo_before_path", "VARCHAR(500)"),
            ("photo_after_path", "VARCHAR(500)"),
            ("root_cause_plan", "TEXT"),
        ]:
            try:
                with engine.connect() as c:
                    c.execute(text(f"ALTER TABLE orden_trabajo ADD COLUMN {col} {typ}"))
                    c.commit()
            except Exception as e:
                logger.debug("ALTER orden_trabajo %s (may already exist): %s", col, e)
        try:
            OrdenTrabajoRepuesto.__table__.create(bind=engine, checkfirst=True)
        except Exception as e:
            logger.debug("Create orden_trabajo_repuesto (may exist): %s", e)
        # Calendario: eventos de la empresa
        try:
            CompanyEvent.__table__.create(bind=engine, checkfirst=True)
        except Exception as e:
            logger.debug("Create company_events (may exist): %s", e)
        for col, typ in [
            ("status", "VARCHAR(20) DEFAULT 'programado'"),
            ("original_event_date", "DATE"),
            ("cancellation_note", "TEXT"),
        ]:
            try:
                with engine.connect() as c:
                    c.execute(text(f"ALTER TABLE company_events ADD COLUMN {col} {typ}"))
                    c.commit()
            except Exception as e:
                logger.debug("ALTER company_events %s (may already exist): %s", col, e)
        # Reservas: salas de reuniones
        try:
            MeetingRoom.__table__.create(bind=engine, checkfirst=True)
        except Exception as e:
            logger.debug("Create meeting_rooms (may exist): %s", e)
        try:
            RoomReservation.__table__.create(bind=engine, checkfirst=True)
        except Exception as e:
            logger.debug("Create room_reservations (may exist): %s", e)
        for col, typ in [
            ("title", "VARCHAR(200)"),
            ("period_type", "VARCHAR(20)"),
            ("perspective", "VARCHAR(30)"),
            ("description", "TEXT"),
            ("current_value_manual", "FLOAT"),
            ("updated_at", "DATETIME"),
        ]:
            try:
                with engine.connect() as c:
                    c.execute(text(f"ALTER TABLE dept_goals ADD COLUMN {col} {typ}"))
                    c.commit()
            except Exception as e:
                logger.debug("ALTER dept_goals %s (may already exist): %s", col, e)
        try:
            DeptImprovement.__table__.create(bind=engine, checkfirst=True)
        except Exception as e:
            logger.debug("Create dept_improvements (may exist): %s", e)
        try:
            UserNotificationSettings.__table__.create(bind=engine, checkfirst=True)
        except Exception as e:
            logger.debug("Create user_notification_settings (may exist): %s", e)
        try:
            SupervisorNotification.__table__.create(bind=engine, checkfirst=True)
        except Exception as e:
            logger.debug("Create supervisor_notifications (may exist): %s", e)
        try:
            UserCalendarEvent.__table__.create(bind=engine, checkfirst=True)
        except Exception as e:
            logger.debug("Create user_calendar_events (may exist): %s", e)
        try:
            PlantEquipment.__table__.create(bind=engine, checkfirst=True)
        except Exception as e:
            logger.debug("Create plant_equipment (may exist): %s", e)
        # Índices de rendimiento (DB existente: IF NOT EXISTS)
        _sqlite_perf_indexes = [
            "CREATE INDEX IF NOT EXISTS ix_organizations_parent_id ON organizations (parent_id)",
            "CREATE INDEX IF NOT EXISTS ix_checklists_dept_id ON checklists (dept_id)",
            "CREATE INDEX IF NOT EXISTS ix_checklists_assignee_id ON checklists (assignee_id)",
            "CREATE INDEX IF NOT EXISTS ix_checklists_frequency ON checklists (frequency)",
            "CREATE INDEX IF NOT EXISTS ix_execution_logs_task_date ON execution_logs (task_id, execution_date)",
            "CREATE INDEX IF NOT EXISTS ix_execution_logs_user_date ON execution_logs (user_id, execution_date)",
            "CREATE INDEX IF NOT EXISTS ix_users_dept_id ON users (dept_id)",
            "CREATE INDEX IF NOT EXISTS ix_users_role ON users (role)",
        ]
        try:
            with engine.begin() as conn:
                for ddl in _sqlite_perf_indexes:
                    conn.execute(text(ddl))
        except Exception as e:
            logger.debug("SQLite performance indexes: %s", e)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/v1/sync/metrics")
def sync_metrics(
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    total = db.query(func.count(SyncIdempotency.id)).scalar() or 0
    completed = (
        db.query(func.count(SyncIdempotency.id))
        .filter(SyncIdempotency.status == "completed")
        .scalar()
        or 0
    )
    pending = (
        db.query(func.count(SyncIdempotency.id))
        .filter(SyncIdempotency.status == "pending")
        .scalar()
        or 0
    )
    return {
        "idempotency": {
            "total": int(total),
            "completed": int(completed),
            "pending": int(pending),
        },
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "serverVersion": "v1",
    }


@app.post("/api/v1/tasks/complete")
async def complete_task(
    task_id: int = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: Optional[object] = Depends(require_roles(ALLOWED_TASKS_SUBMIT)),
):
    """Task completion + field evidence photo upload. RBAC: staff, leader, manager, director, ceo."""
    user_id = getattr(current_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    saved_path = None
    if file and file.filename:
        ext = Path(file.filename).suffix or ".jpg"
        safe_name = f"{user_id}_{task_id}_{uuid.uuid4().hex[:8]}{ext}"
        file_path = UPLOAD_DIR / safe_name
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(8192):
                buffer.write(chunk)
        saved_path = f"/static/uploads/{safe_name}"
    return {
        "message": "Registro exitoso",
        "path": saved_path,
        "task_id": task_id,
        "user_id": user_id,
    }


@app.post("/api/v1/submit-task")
async def submit_task(
    task_id: int = Form(...),
    file: Optional[UploadFile] = File(None),
    idempotency_key: Optional[str] = Form(None),
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
    db: Session = Depends(get_db),
    current_user: Optional[object] = Depends(require_roles(ALLOWED_TASKS_SUBMIT)),
):
    """Staff task submit + photo upload. RBAC: staff, leader, manager, director, ceo."""
    user_id = getattr(current_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    idem_key = (idempotency_key or x_idempotency_key or "").strip() or None
    request_hash = hash_request_payload({
        "task_id": task_id,
        "file_name": getattr(file, "filename", None),
    })
    try:
        existing = reserve_or_get_idempotent_response(
            db,
            idempotency_key=idem_key,
            endpoint="/api/v1/submit-task",
            user_id=user_id,
            request_hash=request_hash,
        )
    except IdempotencyConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except IdempotencyPendingError as exc:
        raise HTTPException(status_code=425, detail=str(exc))
    if existing:
        return {**existing, "accepted": True, "serverVersion": "v1", "duplicated": True}
    saved_path = None
    if file and file.filename:
        ext = Path(file.filename).suffix or ".jpg"
        safe_name = f"{user_id}_{task_id}_{uuid.uuid4().hex[:8]}{ext}"
        file_path = UPLOAD_DIR / safe_name
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(8192):
                buffer.write(chunk)
        saved_path = f"/static/uploads/{safe_name}"
    response = {
        "status": "Exitoso",
        "path": saved_path,
        "accepted": True,
        "syncedAt": datetime.utcnow().isoformat() + "Z",
        "serverVersion": "v1",
    }
    finalize_idempotent_response(
        db,
        idempotency_key=idem_key,
        endpoint="/api/v1/submit-task",
        user_id=getattr(current_user, "id", None),
        response=response,
    )
    return response


def _build_qse_summary(db: Session, target_date: date) -> dict:
    """QSE 트라이앵글: 품질(9001), 환경(14001), 안전(522-06) 별 이행률."""
    pillars = ("9001", "14001", "522-06")
    result = {"date": target_date.isoformat(), "quality": {}, "environment": {}, "safety": {}}
    for std in pillars:
        total = db.query(Checklist).filter(
            Checklist.frequency == "daily",
            Checklist.iso_standard == std,
        ).count()
        if total == 0:
            result["quality" if std == "9001" else "environment" if std == "14001" else "safety"] = {
                "pct": 0, "done": 0, "total": 0, "label": "QMS" if std == "9001" else "EMS" if std == "14001" else "SST",
            }
            continue
        done = db.query(ExecutionLog).join(Checklist, ExecutionLog.task_id == Checklist.id).filter(
            Checklist.iso_standard == std,
            Checklist.frequency == "daily",
            ExecutionLog.execution_date == target_date,
            ExecutionLog.status.is_(True),
        ).count()
        pct = round((done / total * 100), 2) if total else 0
        key = "quality" if std == "9001" else "environment" if std == "14001" else "safety"
        result[key] = {"pct": pct, "done": done, "total": total, "label": "QMS" if std == "9001" else "EMS" if std == "14001" else "SST"}
    return result


def _build_labor_report(db: Session, target_date: date) -> dict:
    """노동청(522-06) 대응: Comité 기록, SST 이행, EPP 완료 목록."""
    sst_tasks = db.query(Checklist).filter(Checklist.iso_standard == "522-06", Checklist.frequency == "daily").all()
    task_ids_sst = [t.id for t in sst_tasks]
    sst_task_map = {t.id: t for t in sst_tasks}
    completions = []
    if task_ids_sst:
        logs = db.query(ExecutionLog).filter(
            ExecutionLog.task_id.in_(task_ids_sst),
            ExecutionLog.execution_date == target_date,
            ExecutionLog.status.is_(True),
        ).all()
        user_ids = {log.user_id for log in logs}
        user_map = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}
        for log in logs:
            task = sst_task_map.get(log.task_id)
            user = user_map.get(log.user_id)
            completions.append({
                "task_name": task.task_name if task else "-",
                "iso_clause": getattr(task, "iso_clause", None),
                "user_name": user.name if user else str(log.user_id),
                "execution_date": log.execution_date.isoformat() if log.execution_date else None,
                "evidence_path": getattr(log, "evidence_path", None),
                "audited": getattr(log, "audited_by", None) is not None,
            })
    epp_tasks = db.query(Checklist).filter(Checklist.requires_ppe.is_(True), Checklist.frequency == "daily").all()
    epp_ids = [t.id for t in epp_tasks]
    epp_task_map = {t.id: t for t in epp_tasks}
    epp_completions = []
    if epp_ids:
        epp_logs = db.query(ExecutionLog).filter(
            ExecutionLog.task_id.in_(epp_ids),
            ExecutionLog.execution_date == target_date,
            ExecutionLog.status.is_(True),
        ).all()
        epp_user_ids = {log.user_id for log in epp_logs}
        epp_user_map = {u.id: u for u in db.query(User).filter(User.id.in_(epp_user_ids)).all()} if epp_user_ids else {}
        for log in epp_logs:
            task = epp_task_map.get(log.task_id)
            user = epp_user_map.get(log.user_id)
            epp_completions.append({
                "task_name": task.task_name if task else "-",
                "user_name": user.name if user else str(log.user_id),
                "evidence_path": getattr(log, "evidence_path", None),
            })
    comite_tasks = []
    try:
        comite_tasks = db.query(Checklist).filter(Checklist.frequency == "daily").filter(
            or_(
                Checklist.task_name.ilike("%comité%"),
                Checklist.task_name.ilike("%comite%"),
                ((Checklist.iso_standard == "522-06") & (Checklist.layer == "admin")),
            )
        ).all()
    except Exception:
        comite_tasks = [t for t in sst_tasks if (t.layer == "admin") or ("comite" in (t.task_name or "").lower()) or ("comité" in (t.task_name or "").lower())]
    comite_task_map = {t.id: t for t in comite_tasks}
    comite_completions = []
    if comite_tasks:
        cids = [t.id for t in comite_tasks]
        clogs = db.query(ExecutionLog).filter(ExecutionLog.task_id.in_(cids), ExecutionLog.execution_date == target_date, ExecutionLog.status.is_(True)).all()
        comite_user_ids = {log.user_id for log in clogs}
        comite_user_map = {u.id: u for u in db.query(User).filter(User.id.in_(comite_user_ids)).all()} if comite_user_ids else {}
        for log in clogs:
            task = comite_task_map.get(log.task_id)
            user = comite_user_map.get(log.user_id)
            comite_completions.append({
                "task_name": task.task_name if task else "-",
                "user_name": user.name if user else str(log.user_id),
                "execution_date": log.execution_date.isoformat() if log.execution_date else None,
            })
    return {
        "date": target_date.isoformat(),
        "regulation": "Reglamento 522-06 (Ministerio de Trabajo)",
        "sst_completions": completions,
        "epp_completions": epp_completions,
        "comite_completions": comite_completions,
        "summary": {
            "sst_tasks_total": len(task_ids_sst),
            "sst_done_today": len(completions),
            "epp_done_today": len(epp_completions),
            "comite_done_today": len(comite_completions),
        },
    }


@app.get("/api/v1/qse/summary")
def get_qse_summary(
    target_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_AI_COPILOT_REMINDERS)),
):
    """QSE 트라이앵글: 품질(Indigo), 환경(Emerald), 안전(Rose) 실시간 지표. RBAC: ceo, director, manager."""
    target_date = target_date or date.today()
    return _build_qse_summary(db, target_date)


@app.get("/api/v1/qse/labor-report")
def get_qse_labor_report(
    target_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_DASHBOARD_EXCEL_REPORT)),
):
    """노동청 대응 리포트: 522-06 Comité·SST·EPP 기록. RBAC: ceo, director."""
    target_date = target_date or date.today()
    return _build_labor_report(db, target_date)


def _filter_summary_for_copilot(summary: dict, current_user: object, db: Session) -> dict:
    """
    AI Copilot context: only data allowed by role (Manager: own dept, CEO/Director: plant-wide).
    """
    role = (getattr(current_user, "role", None) or "").lower()
    dept_id = getattr(current_user, "dept_id", None)
    if role in ("ceo", "director") or not dept_id:
        return summary
    allowed_ids = set(get_descendant_dept_ids(db, dept_id))
    rankings = [r for r in summary.get("dept_rankings") or [] if r.get("dept_id") in allowed_ids]
    if not rankings:
        return {
            **summary,
            "dept_rankings": [],
            "total_factory_progress": 0,
            "improvement_from_last_month": 0,
            "top_performing_dept": None,
            "critical_dept": None,
            "ai_insight": "No hay datos en el ámbito de su departamento.",
        }
    avg_prog = sum(r.get("progress") or 0 for r in rankings) / len(rankings)
    avg_imp = sum(r.get("improvement") or 0 for r in rankings) / len(rankings)
    top = rankings[0]
    critical = rankings[-1]
    return {
        **summary,
        "dept_rankings": rankings,
        "total_factory_progress": round(avg_prog, 2),
        "improvement_from_last_month": round(avg_imp, 2),
        "top_performing_dept": f"{top.get('dept_name')} ({top.get('progress')}%)",
        "critical_dept": f"{critical.get('dept_name')} ({critical.get('progress')}%)" if critical.get("progress", 100) < 70 else None,
        "ai_insight": f"Contexto limitado a su departamento ({len(rankings)} unidades).",
    }


class CopilotQuery(BaseModel):
    query: str


@app.get("/api/v1/ai/copilot/status")
def copilot_status(
    current_user: object = Depends(require_roles(ALLOWED_AI_COPILOT_REMINDERS)),
):
    """
    Returns whether Gemini API is configured (no key value exposed). RBAC: ceo, director, manager, leader.
    """
    return {"configured": bool(USE_GEMINI)}


@app.post("/api/v1/ai/copilot")
def ask_copilot(
    request: Request,
    body: CopilotQuery,
    target_date: Optional[date] = Query(None, description="Target date (default: today)"),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_AI_COPILOT_REMINDERS)),
):
    """
    Yuanto Copilot: plant KPI via Gemini. RBAC: ceo, director, manager, leader.
    Manager: only own dept data. Data anonymized, audit logged.
    """
    target_date = target_date or date.today()
    try:
        summary = build_summary_response(db, target_date)
        summary = _filter_summary_for_copilot(summary, current_user, db)
        context_raw = build_context_from_summary(summary)
        context_sanitized = build_sanitized_context(context_raw)
        ai = YuantoAI(db_context=context_sanitized)
        reply = ai.get_management_advice(body.query)
    except Exception as e:
        logger.exception("Copilot request failed: %s", e)
        return {
            "reply": (
                "No se pudo procesar la consulta. Compruebe que GEMINI_API_KEY esté en .env y que el dashboard tenga datos. "
                "(Copilot 처리 중 오류가 발생했습니다. .env의 GEMINI_API_KEY와 대시보드 데이터를 확인하세요.)"
            )
        }

    # Audit logging
    try:
        log = AuditLog(
            kind="ai_copilot",
            user_id=getattr(current_user, "id", None),
            role=getattr(current_user, "role", None),
            action="copilot_query",
            resource="management/summary",
            query_summary=(body.query[:200] + "…") if len(body.query) > 200 else body.query,
            response_summary=(reply[:500] + "…") if len(reply) > 500 else reply,
            context_hash=context_hash(context_sanitized),
            ip_address=request.client.host if request.client else None,
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()

    return {"reply": reply}


@app.get("/api/v1/ai/reminders")
def get_ai_reminders(
    target_date: Optional[date] = Query(None, description="Target date (default: today)"),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_AI_COPILOT_REMINDERS)),
):
    """
    Reminder: depts with progress < 70% + goals with status "behind". RBAC: ceo, director, manager.
    """
    from calendar import monthrange
    target_date = target_date or date.today()
    summary = build_summary_response(db, target_date)
    reminders = []
    for r in summary.get("dept_rankings") or []:
        progress = r.get("progress") or r.get("rate") or 0
        if progress < 70:
            name = r.get("dept_name") or r.get("name") or "Departamento"
            msg_es = (
                f"El departamento '{name}' tiene una tasa de ejecución del {progress}% hoy. "
                "Se recomienda verificar con el equipo."
            )
            msg_ko = f"Depto '{name}' tiene hoy {progress}% de cumplimiento. Revisar equipo."
            reminders.append({
                "type": "dept_low_progress",
                "dept_id": r.get("dept_id"),
                "dept_name": name,
                "progress": progress,
                "message_es": msg_es,
                "message_ko": msg_ko,
            })
    # Goal-level reminders: goals for this month that are "behind"
    y, m = target_date.year, target_date.month
    goals = db.query(DeptGoal).filter(DeptGoal.year == y, DeptGoal.month == m).all()
    for g in goals:
        _, last_day = monthrange(y, m)
        ref_date = date(y, m, min(target_date.day, last_day))
        current_value = None
        if g.goal_type == "progress_pct":
            prog = calculate_dept_progress(db, g.dept_id, ref_date)
            current_value = prog["progress"]
        elif g.goal_type == "improvement_pp":
            imp = calculate_improvement_rate(db, g.dept_id, ref_date)
            current_value = imp["improvement_rate"]
        if current_value is None:
            continue
        target = g.target_value
        if g.goal_type == "progress_pct":
            achievement_pct = (current_value / target * 100) if target > 0 else 100.0
        else:
            achievement_pct = min(100.0, (current_value / target * 100)) if target > 0 else (100.0 if current_value >= 0 else 0.0)
        if achievement_pct >= 70:
            continue
        org = db.get(Organization, g.dept_id)
        name = org.name if org else "Departamento"
        reminders.append({
            "type": "goal_behind",
            "goal_id": g.id,
            "dept_id": g.dept_id,
            "dept_name": name,
            "goal_type": g.goal_type,
            "target_value": target,
            "current_value": round(current_value, 2),
            "achievement_pct": round(achievement_pct, 2),
            "message_es": f"Meta {g.goal_type} de '{name}': {current_value:.1f} vs objetivo {target}. Cumplimiento {achievement_pct:.0f}%.",
            "message_ko": f"목표 미달: {name} ({g.goal_type}) 현재 {current_value:.1f} / 목표 {target}.",
        })
    return {"date": target_date.isoformat(), "reminders": reminders}


# Organizations, admin/departments, dept module: app.routers.organizations
# Checklists (admin/dept import-export, smart): app.routers.checklists
# Auth (/status, /auth/*), KPI·dashboard·export·goals: app.routers.auth, app.routers.kpi
# Repuestos + mantenimiento OT: app.routers.maintenance

# ---------- ISO 9001 문서관리 (Maestro de documento, Manual, Procedimientos, Reporte) ----------
DOC_TYPES = ["manual", "procedimiento", "reporte", "registro"]
DOC_STATUSES = ["draft", "review", "approved", "obsolete"]
UPLOAD_DOCS_DIR = Path("static/uploads/docs")
UPLOAD_DOCS_DIR.mkdir(parents=True, exist_ok=True)


class DocumentBody(BaseModel):
    code: Optional[str] = None
    title: str
    doc_type: str  # manual | procedimiento | reporte | registro
    version: Optional[str] = "1"
    revision_date: Optional[date] = None
    status: Optional[str] = "draft"
    dept_id: Optional[int] = None
    assignee_id: Optional[int] = None
    description: Optional[str] = None
    review_due_date: Optional[date] = None  # 다음 정기 검토 예정일


class DocumentUpdateBody(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    doc_type: Optional[str] = None
    version: Optional[str] = None
    revision_date: Optional[date] = None
    status: Optional[str] = None
    dept_id: Optional[int] = None
    assignee_id: Optional[int] = None
    description: Optional[str] = None
    review_due_date: Optional[date] = None


def _doc_allowed_dept_ids(db: Session, user: object) -> Optional[list]:
    """CEO/Director: None (all). Manager/Leader: own dept(s). Others: empty."""
    role = (getattr(user, "role", None) or "").lower()
    dept_id = getattr(user, "dept_id", None)
    if role in ("ceo", "director"):
        return None
    if role == "manager" and dept_id is not None:
        return get_descendant_dept_ids(db, dept_id)
    if role == "leader" and dept_id is not None:
        return [dept_id]
    return []


def _append_document_revision(db: Session, doc: Document, user_id: Optional[int], change_comment: Optional[str] = None) -> None:
    """ISO 7.5.3: 기록 변경 이력 (누가, 언제, 어떤 버전)."""
    rev = DocumentRevision(
        document_id=doc.id,
        version=doc.version or "1",
        title=doc.title,
        file_path=doc.file_path,
        changed_by_id=user_id,
        status=doc.status,
        change_comment=(change_comment or "")[:500] if change_comment else None,
    )
    db.add(rev)


@app.get("/api/v1/documents")
def list_documents(
    dept_id: Optional[int] = Query(None),
    doc_type: Optional[str] = Query(None, description="manual | procedimiento | reporte | registro"),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_DEPT_MODULE)),
):
    """문서 목록. CEO/Director 전사, Manager/Leader 자기 부서(및 하위)만."""
    allowed = _doc_allowed_dept_ids(db, current_user)
    q = db.query(Document).order_by(Document.updated_at.desc())
    if allowed is not None:
        if not allowed:
            return []
        q = q.filter((Document.dept_id.is_(None)) | (Document.dept_id.in_(allowed)))
    if dept_id is not None:
        if allowed is not None and dept_id not in allowed:
            raise HTTPException(status_code=403, detail="No puede filtrar por ese departamento.")
        q = q.filter(Document.dept_id == dept_id)
    if doc_type:
        q = q.filter(Document.doc_type == doc_type)
    if status:
        q = q.filter(Document.status == status)
    rows = q.all()
    return [
        {
            "id": r.id,
            "code": r.code,
            "title": r.title,
            "doc_type": r.doc_type,
            "version": r.version,
            "revision_date": r.revision_date.isoformat() if r.revision_date else None,
            "status": r.status,
            "dept_id": r.dept_id,
            "assignee_id": r.assignee_id,
            "file_path": r.file_path,
            "description": r.description,
            "approved_by_id": getattr(r, "approved_by_id", None),
            "approved_at": r.approved_at.isoformat() if getattr(r, "approved_at", None) else None,
            "review_due_date": r.review_due_date.isoformat() if getattr(r, "review_due_date", None) else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }
        for r in rows
    ]


@app.post("/api/v1/documents")
def create_document(
    body: DocumentBody,
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_DEPT_MODULE)),
):
    """문서 등록. dept_id는 허용된 부서만."""
    allowed = _doc_allowed_dept_ids(db, current_user)
    dept_id = body.dept_id
    if allowed is not None:
        if dept_id is None:
            dept_id = getattr(current_user, "dept_id", None)
        if dept_id is not None and dept_id not in allowed:
            raise HTTPException(status_code=400, detail="Departamento no permitido.")
    if not (body.title and body.title.strip()):
        raise HTTPException(status_code=400, detail="El título es obligatorio.")
    if body.doc_type not in DOC_TYPES:
        raise HTTPException(status_code=400, detail=f"doc_type debe ser uno de: {DOC_TYPES}")
    doc = Document(
        code=(body.code or "").strip() or None,
        title=body.title.strip(),
        doc_type=body.doc_type,
        version=(body.version or "1")[:20],
        revision_date=body.revision_date,
        status=(body.status or "draft")[:20],
        dept_id=dept_id,
        assignee_id=body.assignee_id,
        description=(body.description or "").strip() or None,
        review_due_date=getattr(body, "review_due_date", None),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    _append_document_revision(db, doc, getattr(current_user, "id", None), "Creación inicial")
    db.commit()
    return {"id": doc.id, "title": doc.title, "message": "Documento creado."}


@app.get("/api/v1/documents/{doc_id}")
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_DEPT_MODULE)),
):
    """문서 상세."""
    allowed = _doc_allowed_dept_ids(db, current_user)
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    if allowed is not None and doc.dept_id is not None and doc.dept_id not in allowed:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    return {
        "id": doc.id,
        "code": doc.code,
        "title": doc.title,
        "doc_type": doc.doc_type,
        "version": doc.version,
        "revision_date": doc.revision_date.isoformat() if doc.revision_date else None,
        "status": doc.status,
        "dept_id": doc.dept_id,
        "assignee_id": doc.assignee_id,
        "file_path": doc.file_path,
        "description": doc.description,
        "approved_by_id": getattr(doc, "approved_by_id", None),
        "approved_at": doc.approved_at.isoformat() if getattr(doc, "approved_at", None) else None,
        "review_due_date": doc.review_due_date.isoformat() if getattr(doc, "review_due_date", None) else None,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
    }


@app.patch("/api/v1/documents/{doc_id}")
def update_document(
    doc_id: int,
    body: DocumentUpdateBody,
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_DEPT_MODULE)),
):
    """문서 수정."""
    allowed = _doc_allowed_dept_ids(db, current_user)
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    if allowed is not None and doc.dept_id is not None and doc.dept_id not in allowed:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    if body.code is not None:
        doc.code = (body.code or "").strip() or None
    if body.title is not None:
        doc.title = body.title.strip()
    if body.doc_type is not None and body.doc_type in DOC_TYPES:
        doc.doc_type = body.doc_type
    if body.version is not None:
        doc.version = (body.version or "1")[:20]
    if body.revision_date is not None:
        doc.revision_date = body.revision_date
    if body.status is not None and body.status in DOC_STATUSES:
        doc.status = body.status
    if body.dept_id is not None:
        if allowed is not None and body.dept_id not in allowed:
            raise HTTPException(status_code=400, detail="Departamento no permitido.")
        doc.dept_id = body.dept_id
    if body.assignee_id is not None:
        doc.assignee_id = body.assignee_id
    if body.description is not None:
        doc.description = (body.description or "").strip() or None
    if body.review_due_date is not None:
        doc.review_due_date = body.review_due_date
    _append_document_revision(db, doc, getattr(current_user, "id", None), "Actualización")
    db.commit()
    db.refresh(doc)
    return {"id": doc.id, "message": "Actualizado."}


@app.delete("/api/v1/documents/{doc_id}")
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_DEPT_MODULE)),
):
    """문서 삭제."""
    allowed = _doc_allowed_dept_ids(db, current_user)
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    if allowed is not None and doc.dept_id is not None and doc.dept_id not in allowed:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    db.delete(doc)
    db.commit()
    return {"message": "Eliminado."}


@app.post("/api/v1/documents/{doc_id}/upload")
async def upload_document_file(
    doc_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_DEPT_MODULE)),
):
    """문서 파일 첨부. PDF, DOC, XLS 등."""
    allowed = _doc_allowed_dept_ids(db, current_user)
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    if allowed is not None and doc.dept_id is not None and doc.dept_id not in allowed:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    if not file.filename:
        raise HTTPException(status_code=400, detail="Seleccione un archivo.")
    ext = Path(file.filename).suffix.lower()
    allowed_ext = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".odt", ".ods"}
    if ext not in allowed_ext:
        raise HTTPException(status_code=400, detail=f"Extensión no permitida. Use: {allowed_ext}")
    safe_name = f"doc_{doc_id}_{uuid.uuid4().hex[:8]}{ext}"
    path = UPLOAD_DOCS_DIR / safe_name
    content = await file.read()
    path.write_bytes(content)
    doc.file_path = f"/static/uploads/docs/{safe_name}"
    db.commit()
    db.refresh(doc)
    _append_document_revision(db, doc, getattr(current_user, "id", None), "Archivo subido")
    db.commit()
    return {"id": doc.id, "file_path": doc.file_path, "message": "Archivo subido."}


@app.get("/api/v1/documents/{doc_id}/revisions")
def list_document_revisions(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_DEPT_MODULE)),
):
    """문서 버전 이력 (ISO 7.5.3)."""
    allowed = _doc_allowed_dept_ids(db, current_user)
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    if allowed is not None and doc.dept_id is not None and doc.dept_id not in allowed:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    revs = db.query(DocumentRevision).filter(DocumentRevision.document_id == doc_id).order_by(DocumentRevision.changed_at.desc()).all()
    return [
        {"id": r.id, "document_id": r.document_id, "version": r.version, "title": r.title, "file_path": r.file_path,
         "changed_by_id": r.changed_by_id, "changed_at": r.changed_at.isoformat() if r.changed_at else None,
         "change_comment": r.change_comment, "status": r.status}
        for r in revs
    ]


@app.post("/api/v1/documents/{doc_id}/submit-review")
def document_submit_review(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_DEPT_MODULE)),
):
    """작성 → 검토 단계로 전환 (Flujo de aprobación)."""
    allowed = _doc_allowed_dept_ids(db, current_user)
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    if allowed is not None and doc.dept_id is not None and doc.dept_id not in allowed:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    if doc.status != "draft":
        raise HTTPException(status_code=400, detail="Solo documentos en borrador pueden enviarse a revisión.")
    doc.status = "review"
    _append_document_revision(db, doc, getattr(current_user, "id", None), "Enviado a revisión")
    db.commit()
    db.refresh(doc)
    return {"id": doc.id, "status": doc.status, "message": "Enviado a revisión."}


@app.post("/api/v1/documents/{doc_id}/approve")
def document_approve(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_DEPT_MODULE)),
):
    """검토 → 승인 (승인자·일시 기록)."""
    allowed = _doc_allowed_dept_ids(db, current_user)
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    if allowed is not None and doc.dept_id is not None and doc.dept_id not in allowed:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    if doc.status != "review":
        raise HTTPException(status_code=400, detail="Solo documentos en revisión pueden aprobarse.")
    doc.status = "approved"
    doc.approved_by_id = getattr(current_user, "id", None)
    doc.approved_at = datetime.utcnow()
    _append_document_revision(db, doc, getattr(current_user, "id", None), "Aprobado")
    db.commit()
    db.refresh(doc)
    return {"id": doc.id, "status": doc.status, "approved_at": doc.approved_at.isoformat(), "message": "Aprobado."}


@app.get("/api/v1/documents/review-alerts")
def document_review_alerts(
    days: int = Query(60, ge=1, le=365, description="Días antes del vencimiento"),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_DEPT_MODULE)),
):
    """검토 예정일이 가까운 문서 목록 (Alertas de revisión)."""
    from datetime import timedelta
    allowed = _doc_allowed_dept_ids(db, current_user)
    q = db.query(Document).filter(
        Document.review_due_date.isnot(None),
        Document.review_due_date <= date.today() + timedelta(days=days),
        Document.status != "obsolete",
    ).order_by(Document.review_due_date.asc())
    if allowed is not None:
        if not allowed:
            return []
        q = q.filter((Document.dept_id.is_(None)) | (Document.dept_id.in_(allowed)))
    rows = q.limit(100).all()
    return [
        {"id": r.id, "code": r.code, "title": r.title, "doc_type": r.doc_type, "version": r.version,
         "review_due_date": r.review_due_date.isoformat() if r.review_due_date else None,
         "assignee_id": r.assignee_id, "status": r.status}
        for r in rows
    ]


class DocumentAISearchBody(BaseModel):
    query: str


@app.post("/api/v1/documents/ai-search")
def document_ai_search(
    body: DocumentAISearchBody,
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_DEPT_MODULE)),
):
    """AI 기반 스마트 검색: 제목·코드·설명에서 키워드 검색."""
    allowed = _doc_allowed_dept_ids(db, current_user)
    q = db.query(Document).filter(Document.status != "obsolete")
    if allowed is not None:
        if not allowed:
            return {"results": [], "message": "Sin acceso a documentos."}
        q = q.filter((Document.dept_id.is_(None)) | (Document.dept_id.in_(allowed)))
    kw = (body.query or "").strip()
    if kw:
        term = f"%{kw}%"
        q = q.filter(or_(Document.title.ilike(term), Document.code.ilike(term), Document.description.ilike(term)))
    rows = q.order_by(Document.updated_at.desc()).limit(50).all()
    results = [{"id": r.id, "code": r.code, "title": r.title, "doc_type": r.doc_type, "version": r.version, "status": r.status, "file_path": r.file_path} for r in rows]
    return {"results": results, "query": kw or "(todos)"}


# ---------- 개인 대시보드: 개인 업무 + 리마인더 ----------
class PersonalTaskBody(BaseModel):
    title: str
    due_date: Optional[date] = None
    reminder_at: Optional[datetime] = None
    note: Optional[str] = None


class PersonalTaskUpdateBody(BaseModel):
    title: Optional[str] = None
    due_date: Optional[date] = None
    reminder_at: Optional[datetime] = None
    completed: Optional[bool] = None  # True=완료, False=미완료
    note: Optional[str] = None


@app.get("/api/v1/me/personal-tasks")
def list_personal_tasks(
    target_date: Optional[date] = Query(None, description="Filter by due_date (default: all)"),
    completed: Optional[bool] = Query(None, description="True=완료만, False=미완료만"),
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """개인 업무 목록. 본인(user_id) 것만."""
    user_id = getattr(current_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    q = db.query(PersonalTask).filter(PersonalTask.user_id == user_id)
    if target_date is not None:
        q = q.filter(PersonalTask.due_date == target_date)
    if completed is True:
        q = q.filter(PersonalTask.completed_at.is_(True))
    elif completed is False:
        q = q.filter(PersonalTask.completed_at.is_(None))
    rows = q.order_by(PersonalTask.due_date.asc(), PersonalTask.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "due_date": r.due_date.isoformat() if r.due_date else None,
            "reminder_at": r.reminder_at.isoformat() if r.reminder_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "note": r.note,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@app.post("/api/v1/me/personal-tasks")
def create_personal_task(
    body: PersonalTaskBody,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """개인 업무 추가."""
    user_id = getattr(current_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    if not (body.title and body.title.strip()):
        raise HTTPException(status_code=400, detail="El título es obligatorio.")
    t = PersonalTask(
        user_id=user_id,
        title=body.title.strip(),
        due_date=body.due_date,
        reminder_at=body.reminder_at,
        note=(body.note or "").strip() or None,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return {
        "id": t.id,
        "title": t.title,
        "due_date": t.due_date.isoformat() if t.due_date else None,
        "reminder_at": t.reminder_at.isoformat() if t.reminder_at else None,
        "note": t.note,
        "message": "Tarea personal creada.",
    }


@app.patch("/api/v1/me/personal-tasks/{task_id}")
def update_personal_task(
    task_id: int,
    body: PersonalTaskUpdateBody,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """개인 업무 수정/완료 처리."""
    user_id = getattr(current_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    t = db.get(PersonalTask, task_id)
    if not t or t.user_id != user_id:
        raise HTTPException(status_code=404, detail="Tarea no encontrada.")
    if body.title is not None:
        t.title = body.title.strip()
    if body.due_date is not None:
        t.due_date = body.due_date
    if body.reminder_at is not None:
        t.reminder_at = body.reminder_at
    if body.note is not None:
        t.note = (body.note or "").strip() or None
    if body.completed is not None:
        t.completed_at = datetime.utcnow() if body.completed else None
    db.commit()
    db.refresh(t)
    return {"id": t.id, "message": "Actualizado."}


@app.delete("/api/v1/me/personal-tasks/{task_id}")
def delete_personal_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """개인 업무 삭제."""
    user_id = getattr(current_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    t = db.get(PersonalTask, task_id)
    if not t or t.user_id != user_id:
        raise HTTPException(status_code=404, detail="Tarea no encontrada.")
    db.delete(t)
    db.commit()
    return {"message": "Eliminado."}


@app.get("/api/v1/me/reminders")
def get_my_reminders(
    target_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """
    개인 대시보드용 리마인더: (1) 오늘 기한/알림인 개인 업무 (2) 직원일 경우 부서 오늘 진행률 요약.
    """
    user_id = getattr(current_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    target = target_date or date.today()
    reminders = []

    # (1) 개인 업무: 오늘 기한 또는 reminder_at이 오늘 이전인 미완료
    today_end = datetime.combine(target, datetime.max.time())
    q = (
        db.query(PersonalTask)
        .filter(PersonalTask.user_id == user_id, PersonalTask.completed_at.is_(None))
    )
    for pt in q.all():
        if pt.due_date and pt.due_date == target:
            reminders.append({
                "type": "personal_due",
                "task_id": pt.id,
                "title": pt.title,
                "message_es": f"Vence hoy: {pt.title}",
                "message_ko": f"오늘 기한: {pt.title}",
            })
        elif pt.reminder_at and pt.reminder_at <= today_end:
            reminders.append({
                "type": "personal_reminder",
                "task_id": pt.id,
                "title": pt.title,
                "message_es": f"Recordatorio: {pt.title}",
                "message_ko": f"리마인더: {pt.title}",
            })

    # (2) 직원/리더/매니저: 부서 오늘 진행률 70% 미만이면 요약 1건
    role = (getattr(current_user, "role", None) or "staff").lower()
    dept_id = getattr(current_user, "dept_id", None)
    if dept_id and role in ("staff", "leader", "manager"):
        from app.services.progress import calculate_dept_progress
        prog = calculate_dept_progress(db, dept_id, target)
        pct = prog.get("progress") or 0
        if pct < 70 and prog.get("total_tasks", 0) > 0:
            reminders.append({
                "type": "dept_progress",
                "dept_id": dept_id,
                "progress": round(pct, 2),
                "total_tasks": prog.get("total_tasks", 0),
                "done_count": prog.get("done_count", 0),
                "message_es": f"Tu departamento lleva hoy {pct:.0f}% de cumplimiento. Recomendado revisar tareas.",
                "message_ko": f"부서 오늘 이행률 {pct:.0f}%. 업무 확인을 권장합니다.",
            })

    return {"date": target.isoformat(), "reminders": reminders}


# ---------- 유저별 알림 설정 ----------
class NotificationSettingsUpdateBody(BaseModel):
    reminder_enabled: Optional[bool] = None
    reminder_advance_minutes: Optional[int] = None
    escalate_after_hours: Optional[int] = None
    channel_in_app: Optional[bool] = None
    channel_email: Optional[bool] = None
    quiet_hours_start: Optional[int] = None
    quiet_hours_end: Optional[int] = None
    daily_digest_time: Optional[int] = None


def _get_or_create_notification_settings(db: Session, user_id: int):
    row = db.query(UserNotificationSettings).filter(UserNotificationSettings.user_id == user_id).first()
    if row:
        return row
    row = UserNotificationSettings(user_id=user_id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.get("/api/v1/me/notification-settings")
def get_my_notification_settings(
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """Get current user's notification/alarm settings."""
    user_id = getattr(current_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    row = _get_or_create_notification_settings(db, user_id)
    return {
        "reminder_enabled": row.reminder_enabled,
        "reminder_advance_minutes": row.reminder_advance_minutes,
        "escalate_after_hours": row.escalate_after_hours,
        "channel_in_app": row.channel_in_app,
        "channel_email": row.channel_email,
        "quiet_hours_start": row.quiet_hours_start,
        "quiet_hours_end": row.quiet_hours_end,
        "daily_digest_time": row.daily_digest_time,
    }


@app.patch("/api/v1/me/notification-settings")
def update_my_notification_settings(
    body: NotificationSettingsUpdateBody,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """Update current user's notification settings."""
    user_id = getattr(current_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    row = _get_or_create_notification_settings(db, user_id)
    if body.reminder_enabled is not None:
        row.reminder_enabled = body.reminder_enabled
    if body.reminder_advance_minutes is not None:
        row.reminder_advance_minutes = max(0, min(1440, body.reminder_advance_minutes))
    if body.escalate_after_hours is not None:
        row.escalate_after_hours = max(0, min(720, body.escalate_after_hours))
    if body.channel_in_app is not None:
        row.channel_in_app = body.channel_in_app
    if body.channel_email is not None:
        row.channel_email = body.channel_email
    if body.quiet_hours_start is not None:
        row.quiet_hours_start = body.quiet_hours_start if 0 <= body.quiet_hours_start <= 23 else None
    if body.quiet_hours_end is not None:
        row.quiet_hours_end = body.quiet_hours_end if 0 <= body.quiet_hours_end <= 23 else None
    if body.daily_digest_time is not None:
        row.daily_digest_time = body.daily_digest_time if 0 <= body.daily_digest_time <= 23 else None
    db.commit()
    db.refresh(row)
    return {
        "reminder_enabled": row.reminder_enabled,
        "reminder_advance_minutes": row.reminder_advance_minutes,
        "escalate_after_hours": row.escalate_after_hours,
        "channel_in_app": row.channel_in_app,
        "channel_email": row.channel_email,
        "quiet_hours_start": row.quiet_hours_start,
        "quiet_hours_end": row.quiet_hours_end,
        "daily_digest_time": row.daily_digest_time,
    }


# ---------- 모바일/AI 개인 설정 (JSON) ----------
_DEFAULT_APP_PREFS = {
    "language": "es",
    "field_ai_photo_enabled": True,
    "field_ai_voice_enabled": False,
    "location_context_enabled": False,
    "predictive_nudges_enabled": False,
    "schedule_agent_enabled": False,
    "notify_multimodal": True,
    "notify_location": True,
    "notify_predictive": True,
    "notify_schedule": True,
    "driving_summary_only": False,
    "geofence_radius_km": 0.5,
    "location_sample_interval_sec": 120,
    "voice_max_seconds": 120,
    "gemini_share_photos": True,
    "gemini_share_voice": True,
}


def _merge_app_prefs(stored: Optional[str]) -> dict:
    out = dict(_DEFAULT_APP_PREFS)
    if not stored or not str(stored).strip():
        return out
    try:
        data = json.loads(stored)
        if isinstance(data, dict):
            for k, v in data.items():
                out[k] = v
    except json.JSONDecodeError:
        pass
    return out


def _get_or_create_app_preferences(db: Session, user_id: int) -> UserAppPreferences:
    row = db.query(UserAppPreferences).filter(UserAppPreferences.user_id == user_id).first()
    if row:
        return row
    row = UserAppPreferences(user_id=user_id, preferences_json=json.dumps(_DEFAULT_APP_PREFS))
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


class AppPreferencesUpdateBody(BaseModel):
    """Partial update: solo claves enviadas se fusionan en el JSON."""
    preferences: dict


@app.get("/api/v1/me/app-preferences")
def get_my_app_preferences(
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    user_id = getattr(current_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    row = _get_or_create_app_preferences(db, user_id)
    return {"preferences": _merge_app_prefs(row.preferences_json)}


@app.patch("/api/v1/me/app-preferences")
def update_my_app_preferences(
    body: AppPreferencesUpdateBody,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    user_id = getattr(current_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    row = _get_or_create_app_preferences(db, user_id)
    merged = _merge_app_prefs(row.preferences_json)
    if body.preferences:
        for k, v in body.preferences.items():
            merged[k] = v
    row.preferences_json = json.dumps(merged)
    db.commit()
    db.refresh(row)
    return {"preferences": _merge_app_prefs(row.preferences_json)}


@app.get("/api/v1/me/preferences")
def get_my_preferences_alias(
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """Alias del plan móvil CRM: mismo JSON que /me/app-preferences."""
    return get_my_app_preferences(db=db, current_user=current_user)


@app.patch("/api/v1/me/preferences")
def patch_my_preferences_alias(
    body: AppPreferencesUpdateBody,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    return update_my_app_preferences(body=body, db=db, current_user=current_user)


# ---------- 직상사 알림 (알람 후 미조치 시) ----------
@app.get("/api/v1/me/supervisor-notifications")
def list_my_supervisor_notifications(
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """List notifications for current user as supervisor (team members' unhandled reminders)."""
    supervisor_id = getattr(current_user, "id", None)
    if not supervisor_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    q = db.query(SupervisorNotification).filter(SupervisorNotification.supervisor_user_id == supervisor_id)
    if unread_only:
        q = q.filter(SupervisorNotification.read_at.is_(None))
    q = q.order_by(SupervisorNotification.escalated_at.desc())
    rows = q.limit(100).all()
    subject_ids = list({r.subject_user_id for r in rows})
    users_map = {}
    if subject_ids:
        for u in db.query(User).filter(User.id.in_(subject_ids)).all():
            users_map[u.id] = u.name
    return [
        {
            "id": r.id,
            "subject_user_id": r.subject_user_id,
            "subject_user_name": users_map.get(r.subject_user_id, "-"),
            "task_type": r.task_type,
            "task_id": r.task_id,
            "title": r.title,
            "due_or_reminder_at": r.due_or_reminder_at.isoformat() if r.due_or_reminder_at else None,
            "escalated_at": r.escalated_at.isoformat() if r.escalated_at else None,
            "read_at": r.read_at.isoformat() if r.read_at else None,
            "message": r.message,
        }
        for r in rows
    ]


@app.patch("/api/v1/me/supervisor-notifications/{notif_id}/read")
def mark_supervisor_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """Mark a supervisor notification as read."""
    supervisor_id = getattr(current_user, "id", None)
    if not supervisor_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    r = db.query(SupervisorNotification).filter(
        SupervisorNotification.id == notif_id,
        SupervisorNotification.supervisor_user_id == supervisor_id,
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Notificación no encontrada.")
    r.read_at = datetime.utcnow()
    db.commit()
    return {"id": r.id, "read_at": r.read_at.isoformat()}


# ---------- 전사 캘린더 (company_events) ----------
_COMPANY_CALENDAR_EDIT_ROLES = frozenset({"ceo", "director", "manager"})


def _can_edit_company_calendar(user: object) -> bool:
    role = (getattr(user, "role", None) or "staff").lower()
    return role in _COMPANY_CALENDAR_EDIT_ROLES


class CompanyEventBody(BaseModel):
    title: str
    event_date: date
    description: Optional[str] = None
    status: Optional[str] = "programado"
    cancellation_note: Optional[str] = None


class CompanyEventUpdateBody(BaseModel):
    title: Optional[str] = None
    event_date: Optional[date] = None
    description: Optional[str] = None
    status: Optional[str] = None
    cancellation_note: Optional[str] = None
    original_event_date: Optional[date] = None


@app.get("/api/v1/calendar/events")
def list_company_calendar_events(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """List company-wide calendar events (month filter). Any authenticated user."""
    if getattr(current_user, "id", None) is None:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    q = db.query(CompanyEvent).order_by(CompanyEvent.event_date.asc())
    if year is not None and month is not None:
        from calendar import monthrange

        _, last = monthrange(year, month)
        start = date(year, month, 1)
        end = date(year, month, last)
        q = q.filter(CompanyEvent.event_date >= start, CompanyEvent.event_date <= end)
    events = q.all()
    return [
        {
            "id": e.id,
            "title": e.title,
            "event_date": e.event_date.isoformat() if e.event_date else None,
            "description": e.description,
            "status": e.status or "programado",
            "original_event_date": e.original_event_date.isoformat() if e.original_event_date else None,
            "cancellation_note": e.cancellation_note,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in events
    ]


@app.post("/api/v1/calendar/events")
def create_company_calendar_event(
    body: CompanyEventBody,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """Create company event. CEO, Director, Manager only."""
    if not _can_edit_company_calendar(current_user):
        raise HTTPException(status_code=403, detail="Solo Manager, Director y CEO pueden registrar eventos.")
    uid = getattr(current_user, "id", None)
    st = (body.status or "programado").strip().lower()[:20]
    if st not in (
        "programado",
        "en_progreso",
        "completado",
        "reprogramado",
        "cancelado",
    ):
        st = "programado"
    ev = CompanyEvent(
        title=body.title.strip()[:255],
        event_date=body.event_date,
        description=body.description,
        status=st,
        cancellation_note=body.cancellation_note,
        created_by_id=uid,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return {
        "id": ev.id,
        "title": ev.title,
        "event_date": ev.event_date.isoformat(),
        "description": ev.description,
        "status": ev.status,
        "original_event_date": ev.original_event_date.isoformat() if ev.original_event_date else None,
        "cancellation_note": ev.cancellation_note,
    }


@app.patch("/api/v1/calendar/events/{event_id}")
def update_company_calendar_event(
    event_id: int,
    body: CompanyEventUpdateBody,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """Update company event. CEO, Director, Manager only."""
    if not _can_edit_company_calendar(current_user):
        raise HTTPException(status_code=403, detail="Solo Manager, Director y CEO pueden registrar eventos.")
    ev = db.get(CompanyEvent, event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Evento no encontrado.")
    if body.title is not None:
        ev.title = body.title.strip()[:255]
    old_date = ev.event_date
    if body.event_date is not None:
        ev.event_date = body.event_date
    if body.description is not None:
        ev.description = body.description
    if body.status is not None:
        st = body.status.strip().lower()[:20]
        if st in (
            "programado",
            "en_progreso",
            "completado",
            "reprogramado",
            "cancelado",
        ):
            ev.status = st
    if body.cancellation_note is not None:
        ev.cancellation_note = body.cancellation_note
    if body.original_event_date is not None:
        ev.original_event_date = body.original_event_date
    elif (
        body.event_date is not None
        and old_date is not None
        and body.event_date != old_date
        and (body.status == "reprogramado" or ev.status == "reprogramado")
    ):
        ev.original_event_date = old_date
    db.commit()
    db.refresh(ev)
    return {
        "id": ev.id,
        "title": ev.title,
        "event_date": ev.event_date.isoformat(),
        "description": ev.description,
        "status": ev.status,
        "original_event_date": ev.original_event_date.isoformat() if ev.original_event_date else None,
        "cancellation_note": ev.cancellation_note,
    }


@app.delete("/api/v1/calendar/events/{event_id}")
def delete_company_calendar_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """Delete company event. CEO, Director, Manager only."""
    if not _can_edit_company_calendar(current_user):
        raise HTTPException(status_code=403, detail="Solo Manager, Director y CEO pueden registrar eventos.")
    ev = db.get(CompanyEvent, event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Evento no encontrado.")
    db.delete(ev)
    db.commit()
    return {"message": "Eliminado."}


# ---------- 유저별 개인 캘린더 ----------
class UserCalendarEventBody(BaseModel):
    title: str
    event_date: date
    start_time: Optional[int] = None  # 0-1439
    end_time: Optional[int] = None
    all_day: Optional[bool] = True
    reminder_minutes: Optional[int] = None
    recurrence: Optional[str] = None  # none | daily | weekly | monthly
    description: Optional[str] = None


class UserCalendarEventUpdateBody(BaseModel):
    title: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[int] = None
    end_time: Optional[int] = None
    all_day: Optional[bool] = None
    reminder_minutes: Optional[int] = None
    recurrence: Optional[str] = None
    description: Optional[str] = None
    completed_at: Optional[datetime] = None


@app.get("/api/v1/me/calendar/events")
def list_my_calendar_events(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """List current user's personal calendar events."""
    user_id = getattr(current_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    q = db.query(UserCalendarEvent).filter(UserCalendarEvent.user_id == user_id).order_by(UserCalendarEvent.event_date.asc())
    if year is not None and month is not None:
        from calendar import monthrange
        _, last = monthrange(year, month)
        start = date(year, month, 1)
        end = date(year, month, last)
        q = q.filter(UserCalendarEvent.event_date >= start, UserCalendarEvent.event_date <= end)
    elif start_date is not None:
        q = q.filter(UserCalendarEvent.event_date >= start_date)
    if end_date is not None:
        q = q.filter(UserCalendarEvent.event_date <= end_date)
    events = q.all()
    return [
        {
            "id": e.id,
            "title": e.title,
            "event_date": e.event_date.isoformat() if e.event_date else None,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "all_day": e.all_day,
            "reminder_minutes": e.reminder_minutes,
            "recurrence": e.recurrence,
            "description": e.description,
            "completed_at": e.completed_at.isoformat() if e.completed_at else None,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in events
    ]


@app.post("/api/v1/me/calendar/events")
def create_my_calendar_event(
    body: UserCalendarEventBody,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """Create personal calendar event."""
    user_id = getattr(current_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    ev = UserCalendarEvent(
        user_id=user_id,
        title=body.title.strip(),
        event_date=body.event_date,
        start_time=body.start_time,
        end_time=body.end_time,
        all_day=body.all_day if body.all_day is not None else True,
        reminder_minutes=body.reminder_minutes,
        recurrence=body.recurrence if body.recurrence in ("none", "daily", "weekly", "monthly") else None,
        description=body.description,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return {
        "id": ev.id,
        "title": ev.title,
        "event_date": ev.event_date.isoformat(),
        "start_time": ev.start_time,
        "end_time": ev.end_time,
        "all_day": ev.all_day,
        "reminder_minutes": ev.reminder_minutes,
        "recurrence": ev.recurrence,
        "description": ev.description,
        "created_at": ev.created_at.isoformat() if ev.created_at else None,
    }


@app.patch("/api/v1/me/calendar/events/{event_id}")
def update_my_calendar_event(
    event_id: int,
    body: UserCalendarEventUpdateBody,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """Update personal calendar event."""
    user_id = getattr(current_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    ev = db.query(UserCalendarEvent).filter(
        UserCalendarEvent.id == event_id,
        UserCalendarEvent.user_id == user_id,
    ).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evento no encontrado.")
    if body.title is not None:
        ev.title = body.title.strip()
    if body.event_date is not None:
        ev.event_date = body.event_date
    if body.start_time is not None:
        ev.start_time = body.start_time
    if body.end_time is not None:
        ev.end_time = body.end_time
    if body.all_day is not None:
        ev.all_day = body.all_day
    if body.reminder_minutes is not None:
        ev.reminder_minutes = body.reminder_minutes
    if body.recurrence is not None and body.recurrence in ("none", "daily", "weekly", "monthly"):
        ev.recurrence = body.recurrence
    if body.description is not None:
        ev.description = body.description
    if body.completed_at is not None:
        ev.completed_at = body.completed_at
    db.commit()
    db.refresh(ev)
    return {
        "id": ev.id,
        "title": ev.title,
        "event_date": ev.event_date.isoformat(),
        "start_time": ev.start_time,
        "end_time": ev.end_time,
        "all_day": ev.all_day,
        "reminder_minutes": ev.reminder_minutes,
        "recurrence": ev.recurrence,
        "description": ev.description,
        "completed_at": ev.completed_at.isoformat() if ev.completed_at else None,
    }


@app.delete("/api/v1/me/calendar/events/{event_id}")
def delete_my_calendar_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """Delete personal calendar event."""
    user_id = getattr(current_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    ev = db.query(UserCalendarEvent).filter(
        UserCalendarEvent.id == event_id,
        UserCalendarEvent.user_id == user_id,
    ).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evento no encontrado.")
    db.delete(ev)
    db.commit()
    return {"message": "Eliminado."}


# ---------- 에스컬레이션: 알람 지남 + 미조치 → 직상사 알림 생성 ----------
def run_escalation_job(db: Session) -> int:
    """Find personal tasks and personal calendar events past reminder with no action; create supervisor notifications."""
    count = 0
    now = datetime.utcnow()
    # (1) Personal tasks: reminder_at passed, not completed, user has escalate_after_hours > 0
    pt_q = (
        db.query(PersonalTask)
        .filter(
            PersonalTask.completed_at.is_(None),
            PersonalTask.reminder_at.isnot(None),
            PersonalTask.reminder_at <= now,
        )
    )
    for pt in pt_q.all():
        settings = db.query(UserNotificationSettings).filter(UserNotificationSettings.user_id == pt.user_id).first()
        if not settings or settings.escalate_after_hours <= 0:
            continue
        threshold = now - timedelta(hours=settings.escalate_after_hours)
        if pt.reminder_at > threshold:
            continue
        # Already escalated?
        exists = db.query(SupervisorNotification).filter(
            SupervisorNotification.task_type == "personal_task",
            SupervisorNotification.task_id == pt.id,
        ).first()
        if exists:
            continue
        # Get supervisor: user's dept manager_id
        user = db.get(User, pt.user_id)
        if not user or not user.dept_id:
            continue
        org = db.get(Organization, user.dept_id)
        if not org or not org.manager_id:
            continue
        if org.manager_id == pt.user_id:
            continue
        msg = f"Alerta: {user.name} no ha actuado tras el recordatorio de la tarea «{pt.title}» (recordatorio: {pt.reminder_at})."
        sn = SupervisorNotification(
            supervisor_user_id=org.manager_id,
            subject_user_id=pt.user_id,
            task_type="personal_task",
            task_id=pt.id,
            title=pt.title,
            due_or_reminder_at=pt.reminder_at,
            message=msg,
        )
        db.add(sn)
        count += 1
    # (2) Personal calendar: event_date in the past, reminder_minutes was set, not completed
    today = now.date()
    cal_q = (
        db.query(UserCalendarEvent)
        .filter(
            UserCalendarEvent.event_date <= today,
            UserCalendarEvent.completed_at.is_(None),
            UserCalendarEvent.reminder_minutes.isnot(None),
        )
    )
    for ev in cal_q.all():
        settings = db.query(UserNotificationSettings).filter(UserNotificationSettings.user_id == ev.user_id).first()
        if not settings or settings.escalate_after_hours <= 0:
            continue
        if ev.start_time is not None:
            reminder_dt = datetime.combine(ev.event_date, datetime.min.time()) + timedelta(minutes=ev.start_time - (ev.reminder_minutes or 0))
        else:
            reminder_dt = datetime.combine(ev.event_date, datetime.min.time()) - timedelta(minutes=ev.reminder_minutes or 0)
        if reminder_dt > now:
            continue
        threshold = now - timedelta(hours=settings.escalate_after_hours)
        if reminder_dt > threshold:
            continue
        exists = db.query(SupervisorNotification).filter(
            SupervisorNotification.task_type == "personal_calendar",
            SupervisorNotification.task_id == ev.id,
        ).first()
        if exists:
            continue
        user = db.get(User, ev.user_id)
        if not user or not user.dept_id:
            continue
        org = db.get(Organization, user.dept_id)
        if not org or not org.manager_id or org.manager_id == ev.user_id:
            continue
        msg = f"Alerta: {user.name} no ha actuado tras el recordatorio del evento «{ev.title}» (fecha: {ev.event_date})."
        sn = SupervisorNotification(
            supervisor_user_id=org.manager_id,
            subject_user_id=ev.user_id,
            task_type="personal_calendar",
            task_id=ev.id,
            title=ev.title,
            due_or_reminder_at=reminder_dt,
            message=msg,
        )
        db.add(sn)
        count += 1
    db.commit()
    return count


@app.post("/api/v1/internal/escalate-reminders")
def trigger_escalation(
    request: Request,
    db: Session = Depends(get_db),
):
    """Trigger escalation job (call from cron every hour).
    Auth: X-Internal-Key header (if INTERNAL_API_KEY env set) or localhost-only.
    """
    verify_internal_api_key(request)
    n = run_escalation_job(db)
    return {"escalated": n}


# ---------- ISO 9001 품질·부적합 관리 (Quality / NC Report) ----------
class NonconformityCreate(BaseModel):
    task_id: Optional[int] = None
    execution_id: Optional[int] = None
    description: str
    dept_id: Optional[int] = None


class NonconformityUpdate(BaseModel):
    status: Optional[str] = None  # open | in_progress | closed
    closure_note: Optional[str] = None


@app.get("/api/v1/quality/nonconformities")
def list_nonconformities(
    status: Optional[str] = Query(None, description="open | in_progress | closed"),
    dept_id: Optional[int] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_AI_COPILOT_REMINDERS + ["leader"])),
):
    """부적합 보고서 목록. RBAC: ceo, director, manager, leader."""
    q = (
        db.query(NonconformityReport)
        .options(selectinload(NonconformityReport.evidence_items))
        .order_by(NonconformityReport.created_at.desc())
    )
    if status:
        q = q.filter(NonconformityReport.status == status)
    if dept_id is not None:
        q = q.filter(NonconformityReport.dept_id == dept_id)
    role = (getattr(current_user, "role", None) or "").lower()
    user_dept = getattr(current_user, "dept_id", None)
    if role == "leader" and user_dept is not None:
        q = q.filter(NonconformityReport.dept_id == user_dept)
    elif role == "manager" and user_dept is not None:
        dept_ids = get_descendant_dept_ids(db, user_dept)
        q = q.filter((NonconformityReport.dept_id.is_(None)) | (NonconformityReport.dept_id.in_(dept_ids)))
    rows = q.limit(limit).all()
    out = []
    for r in rows:
        ev_paths = [e.evidence_path for e in (r.evidence_items or [])]
        if not ev_paths and r.evidence_path:
            ev_paths = [r.evidence_path]
        out.append(
            {
                "id": r.id,
                "task_id": r.task_id,
                "execution_id": r.execution_id,
                "user_id": r.user_id,
                "dept_id": r.dept_id,
                "description": r.description,
                "status": r.status,
                "evidence_path": r.evidence_path,
                "evidence_paths": ev_paths,
                "defect_category": getattr(r, "defect_category", None),
                "quantity": getattr(r, "quantity", None),
                "quantity_unit": getattr(r, "quantity_unit", None),
                "production_line": getattr(r, "production_line", None),
                "related_scan_id": getattr(r, "related_scan_id", None),
                "duplicate_of_id": getattr(r, "duplicate_of_id", None),
                "consent_ml_export": getattr(r, "consent_ml_export", None),
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "closed_at": r.closed_at.isoformat() if r.closed_at else None,
                "closure_note": r.closure_note,
            }
        )
    return out


@app.post("/api/v1/quality/nonconformities")
async def create_nonconformity(
    task_id: Optional[int] = Form(None),
    execution_id: Optional[int] = Form(None),
    description: str = Form(...),
    dept_id: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """부적합 보고서(NC Report) 생성. 현장에서 불합격·이상 발견 시 호출. ISO 8.7, 10.2 대응."""
    user_id = getattr(current_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    if not (description and description.strip()):
        raise HTTPException(status_code=400, detail="Descripción requerida.")
    evidence_path = None
    if file and file.filename:
        ext = Path(file.filename).suffix or ".jpg"
        safe_name = f"nc_{user_id}_{uuid.uuid4().hex[:8]}{ext}"
        file_path = UPLOAD_DIR / safe_name
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(8192):
                buffer.write(chunk)
        evidence_path = f"/static/uploads/{safe_name}"
    nc = NonconformityReport(
        task_id=task_id,
        execution_id=execution_id,
        user_id=user_id,
        dept_id=dept_id or getattr(current_user, "dept_id", None),
        description=description.strip(),
        status="open",
        evidence_path=evidence_path,
    )
    db.add(nc)
    db.commit()
    db.refresh(nc)
    return {"id": nc.id, "message": "NC Report creado.", "status": nc.status}


@app.patch("/api/v1/quality/nonconformities/{nc_id}")
def update_nonconformity(
    nc_id: int,
    body: NonconformityUpdate,
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_AI_COPILOT_REMINDERS + ["leader"])),
):
    """NC 상태 변경 (open → in_progress → closed)."""
    nc = db.get(NonconformityReport, nc_id)
    if not nc:
        raise HTTPException(status_code=404, detail="NC no encontrado.")
    if body.status is not None:
        nc.status = body.status[:20]
        if body.status == "closed":
            nc.closed_at = datetime.utcnow()
            nc.closed_by = getattr(current_user, "id", None)
            nc.closure_note = body.closure_note or nc.closure_note
    if body.closure_note is not None:
        nc.closure_note = body.closure_note
    db.commit()
    return {"id": nc.id, "status": nc.status, "message": "Actualizado."}


@app.get("/api/v1/quality/iso-scan")
def get_iso_scan(
    target_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(["ceo", "director"])),
):
    """ISO 조항별 필수 기록 누락 스캔. AI 감사: iso_clause가 있는 체크리스트 중 해당 일자에 완료 건이 없는 부서/조항을 제안. Admin/CEO용."""
    target = target_date or date.today()
    # 체크리스트 중 iso_clause가 설정된 항목만
    clauses = db.query(Checklist.iso_clause).filter(Checklist.iso_clause.isnot(None), Checklist.iso_clause != "").distinct().all()
    clauses = [c[0] for c in clauses if c[0]]
    out = []
    for clause in clauses:
        tasks = db.query(Checklist).filter(Checklist.iso_clause == clause).all()
        for t in tasks:
            dept_id = t.dept_id
            if dept_id is None:
                continue
            # 해당 부서에서 해당 일자에 이 task에 대한 완료 로그가 있는지
            count = db.query(ExecutionLog).filter(
                ExecutionLog.task_id == t.id,
                ExecutionLog.execution_date == target,
                ExecutionLog.status.is_(True),
            ).count()
            if count == 0:
                org = db.get(Organization, dept_id)
                out.append({
                    "iso_clause": clause,
                    "task_id": t.id,
                    "task_name": t.task_name,
                    "dept_id": dept_id,
                    "dept_name": org.name if org else "-",
                    "date": target.isoformat(),
                    "message_ko": f"ISO {clause} 대응 업무 '{t.task_name}' ({org.name if org else dept_id}) — {target} 완료 건 없음.",
                    "message_es": f"ISO {clause}: sin evidencia de '{t.task_name}' en {org.name if org else dept_id} para {target}.",
                })
    return {"date": target.isoformat(), "missing_evidence": out[:50]}


@app.get("/api/v1/ai/daily-insight")
def get_daily_insight(
    target_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_AI_COPILOT_REMINDERS)),
):
    """CEO/관리자: 오늘의 3대 이슈 (AI 요약). 전사 이행률·미달 부서·리마인드 통합."""
    target = target_date or date.today()
    summary = build_summary_response(db, target)
    reminders = []
    for r in summary.get("dept_rankings") or []:
        progress = r.get("progress") or r.get("rate") or 0
        if progress < 70:
            reminders.append({
                "dept_name": r.get("dept_name") or r.get("name"),
                "issue": "low_progress",
                "message_es": f"부서 {r.get('dept_name')} 이행률 {progress}%.",
                "message_ko": f"이행률 미달: {r.get('dept_name')} {progress}%",
            })
    critical = summary.get("critical_dept") or (reminders[-1]["dept_name"] if reminders else None)
    issues = []
    if summary.get("total_factory_progress") is not None:
        issues.append({
            "title_es": "전사 이행률",
            "title_ko": "전사 이행률",
            "value": f"{summary['total_factory_progress']}%",
            "status": "ok" if summary["total_factory_progress"] >= 70 else "attention",
        })
    if critical:
        issues.append({
            "title_es": "부서 주의",
            "title_ko": "주의 부서",
            "value": critical,
            "status": "attention",
        })
    if reminders:
        issues.append({
            "title_es": "리마인드",
            "title_ko": "중도 알림",
            "value": f"{len(reminders)}건",
            "status": "attention",
        })
    while len(issues) < 3:
        issues.append({"title_es": "-", "title_ko": "-", "value": "-", "status": "ok"})
    return {"date": target.isoformat(), "issues": issues[:3], "reminders": reminders[:5]}


@app.get("/api/v1/ceo/approval-status")
def ceo_approval_status(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(["ceo"])),
):
    """이달 인센티브 승인 여부."""
    from calendar import monthrange
    t = date.today()
    y = year or t.year
    m = month or t.month
    rec = db.query(CEOApproval).filter(CEOApproval.year == y, CEOApproval.month == m).first()
    return {"year": y, "month": m, "approved": rec is not None, "approved_at": rec.approved_at.isoformat() if rec and rec.approved_at else None}


@app.post("/api/v1/ceo/approve-incentives")
def ceo_approve_incentives(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    note: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(["ceo"])),
):
    """이달의 인센티브 대상자 승인 (사장님 전략 체크리스트 최종 항목)."""
    t = date.today()
    y = year or t.year
    m = month or t.month
    existing = db.query(CEOApproval).filter(CEOApproval.year == y, CEOApproval.month == m).first()
    if existing:
        existing.approved_by = getattr(current_user, "id", None)
        existing.approved_at = datetime.utcnow()
        existing.note = note
    else:
        rec = CEOApproval(year=y, month=m, approved_by=getattr(current_user, "id"), note=note)
        db.add(rec)
    db.commit()
    return {"message": "인센티브 승인 완료.", "year": y, "month": m}


# ---------- AI Suggestions (리마인드·가이드·체크리스트 제안, 부서장 수락) ----------

class AISuggestionBody(BaseModel):
    dept_id: int
    goal_id: Optional[int] = None
    suggestion_type: str  # remind | guideline | checklist_proposal
    title: Optional[str] = None
    content: Optional[str] = None


@app.get("/api/v1/ai/suggestions")
def list_ai_suggestions(
    dept_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_AI_COPILOT_REMINDERS)),
):
    """List AI suggestions for manager review. RBAC: ceo, director, manager."""
    q = db.query(AISuggestion).order_by(AISuggestion.created_at.desc())
    if dept_id is not None:
        q = q.filter(AISuggestion.dept_id == dept_id)
    if status is not None:
        q = q.filter(AISuggestion.status == status)
    rows = q.limit(100).all()
    return [
        {
            "id": r.id,
            "dept_id": r.dept_id,
            "goal_id": r.goal_id,
            "suggestion_type": r.suggestion_type,
            "title": r.title,
            "content": r.content,
            "status": r.status,
            "accepted_at": r.accepted_at.isoformat() if r.accepted_at else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@app.post("/api/v1/ai/suggestions")
def create_ai_suggestion(
    body: AISuggestionBody,
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_AI_COPILOT_REMINDERS)),
):
    """Create AI suggestion (remind, guideline, or checklist proposal)."""
    if body.suggestion_type not in ("remind", "guideline", "checklist_proposal"):
        raise HTTPException(status_code=400, detail="suggestion_type debe ser remind, guideline o checklist_proposal.")
    s = AISuggestion(
        dept_id=body.dept_id,
        goal_id=body.goal_id,
        suggestion_type=body.suggestion_type,
        title=body.title,
        content=body.content,
        status="pending",
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return {"id": s.id, "message": "Sugerencia creada."}


@app.post("/api/v1/ai/suggestions/{suggestion_id}/accept")
def accept_ai_suggestion(
    suggestion_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_AI_COPILOT_REMINDERS)),
):
    """Accept suggestion. If checklist_proposal, create Checklist items for the department."""
    import json
    s = db.get(AISuggestion, suggestion_id)
    if not s:
        raise HTTPException(status_code=404, detail="Sugerencia no encontrada.")
    if s.status != "pending":
        raise HTTPException(status_code=400, detail="Ya fue procesada.")
    s.status = "accepted"
    s.accepted_at = datetime.utcnow()
    if s.suggestion_type == "checklist_proposal" and s.content:
        try:
            items = json.loads(s.content)
            if isinstance(items, list):
                for it in items:
                    task_name = it.get("task_name") or it.get("title") or "Tarea sugerida"
                    c = Checklist(
                        dept_id=s.dept_id,
                        task_name=task_name[:255],
                        category=it.get("category"),
                        weight=float(it.get("weight", 1)),
                        frequency=it.get("frequency") or "daily",
                        assignee_id=it.get("assignee_id"),
                    )
                    db.add(c)
        except (json.JSONDecodeError, TypeError):
            pass
    db.commit()
    return {"id": s.id, "message": "Sugerencia aceptada."}


@app.post("/api/v1/ai/suggestions/{suggestion_id}/reject")
def reject_ai_suggestion(
    suggestion_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_AI_COPILOT_REMINDERS)),
):
    """Reject suggestion."""
    s = db.get(AISuggestion, suggestion_id)
    if not s:
        raise HTTPException(status_code=404, detail="Sugerencia no encontrada.")
    if s.status != "pending":
        raise HTTPException(status_code=400, detail="Ya fue procesada.")
    s.status = "rejected"
    db.commit()
    return {"id": s.id, "message": "Sugerencia rechazada."}


@app.get("/api/v1/ai/workload-suggestions")
def get_workload_suggestions(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    target_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_AI_COPILOT_REMINDERS)),
):
    """
    업무량 적은 직원: 부서별 이행 건수 기준으로 평균 이하 직원 식별, 업무 토스·가이드 제안.
    Returns per-dept list of users with completion count and below_avg flag.
    """
    from sqlalchemy import func, select
    t = target_date or date.today()
    y = year or t.year
    m = month or t.month
    first_day = date(y, m, 1)
    from calendar import monthrange
    _, last_day = monthrange(y, m)
    last_date = date(y, m, last_day)
    if t < first_day or t > last_date:
        end_date = last_date
    else:
        end_date = t

    dept_ids = [o.id for o in db.query(Organization).all()]
    result = []
    for dept_id in dept_ids:
        dept_user_ids = [u.id for u in db.query(User).filter(User.dept_id == dept_id, User.is_active.is_(True)).all()]
        if not dept_user_ids:
            continue
        # 체크리스트가 이 부서에 속한 task만 (직접 dept_id 또는 하위 부서)
        child_ids = get_descendant_dept_ids(db, dept_id)
        # 해당 부서군 체크리스트의 task_id
        task_ids_subq = select(Checklist.id).where(Checklist.dept_id.in_(child_ids))
        task_ids = list(db.scalars(task_ids_subq))
        if not task_ids:
            continue
        # 기간 내 완료 건수 per user
        completed = (
            db.query(ExecutionLog.user_id, func.count(ExecutionLog.id).label("cnt"))
            .filter(
                ExecutionLog.task_id.in_(task_ids),
                ExecutionLog.execution_date >= first_day,
                ExecutionLog.execution_date <= end_date,
                ExecutionLog.status.is_(True),
            )
            .group_by(ExecutionLog.user_id)
            .all()
        )
        user_counts = {uid: c for uid, c in completed}
        total_done = sum(user_counts.get(uid, 0) for uid in dept_user_ids)
        avg = total_done / len(dept_user_ids) if dept_user_ids else 0
        low_threshold = avg * 0.7 if avg > 0 else 0
        org = db.get(Organization, dept_id)
        dept_name = org.name if org else "-"
        for uid in dept_user_ids:
            cnt = user_counts.get(uid, 0)
            below_avg = avg > 0 and cnt < low_threshold
            u = db.get(User, uid)
            result.append({
                "dept_id": dept_id,
                "dept_name": dept_name,
                "user_id": uid,
                "user_name": u.name if u else "-",
                "completed_count": cnt,
                "dept_avg": round(avg, 2),
                "below_avg": below_avg,
                "message_es": f"Empleado {u.name if u else uid} tiene {cnt} tareas completadas (promedio depto {avg:.1f}). Se sugiere asignar más tareas o guía." if below_avg else None,
            })
    return {"year": y, "month": m, "period_end": end_date.isoformat(), "suggestions": result}


# ---------- Incentives · Empleado del Mes ----------

def _today_year_month():
    t = date.today()
    return t.year, t.month


@app.get("/api/v1/incentives/ranking")
def incentives_ranking(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_DASHBOARD_EXCEL_REPORT)),
):
    """Monthly point ranking (diligence, image, cooperation). CEO/Director."""
    y, m = year or _today_year_month()[0], month or _today_year_month()[1]
    return get_monthly_ranking_raw(db, y, m, limit=limit)


@app.get("/api/v1/incentives/hall-of-fame")
def hall_of_fame(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_DASHBOARD_EXCEL_REPORT)),
):
    """Empleado del Mes top 10. Uses stored history if any, else selection logic."""
    y, m = year or _today_year_month()[0], month or _today_year_month()[1]
    saved = db.query(EmpleadoDelMes).filter(EmpleadoDelMes.year == y, EmpleadoDelMes.month == m).order_by(EmpleadoDelMes.rank).all()
    if saved:
        users = {u.id: u.name for u in db.query(User).filter(User.id.in_([r.user_id for r in saved])).all()}
        return {
            "year": y, "month": m,
            "empleados": [{"rank": r.rank, "user_id": r.user_id, "name": users.get(r.user_id) or "-"} for r in saved],
            "source": "saved",
        }
    computed = select_empleado_del_mes(db, y, m, top_n=10)
    return {"year": y, "month": m, "empleados": computed, "source": "computed"}


@app.get("/api/v1/incentives/annual")
def incentives_annual(
    year: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_DASHBOARD_EXCEL_REPORT)),
):
    """Annual accumulated points (bonus reference)."""
    y = year or _today_year_month()[0]
    return get_annual_accumulation(db, y, limit=limit)


@app.get("/api/v1/incentives/team-league")
def incentives_team_league(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_DASHBOARD_EXCEL_REPORT)),
):
    """Department average points (team league)."""
    y, m = year or _today_year_month()[0], month or _today_year_month()[1]
    return get_team_league(db, y, m)


@app.get("/api/v1/incentives/me")
def incentives_me(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    """My rank, points, Resting/annual cap reasons. Staff."""
    uid = getattr(current_user, "id", None)
    if not uid:
        raise HTTPException(status_code=401, detail="Usuario no identificado.")
    y, m = year or _today_year_month()[0], month or _today_year_month()[1]
    return get_my_rank_and_resting(db, uid, y, m)


class IncentivePointsBody(BaseModel):
    user_id: int
    year: int
    month: int
    diligence_pts: Optional[float] = 0
    image_quality_pts: Optional[float] = 0
    cooperation_pts: Optional[float] = 0


@app.post("/api/v1/incentives/points")
def upsert_incentive_points(
    body: IncentivePointsBody,
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_ADMIN_USERS)),
):
    """Upsert monthly points. CEO/Director. Source for annual accumulation."""
    rec = db.query(IncentiveScore).filter(
        IncentiveScore.user_id == body.user_id,
        IncentiveScore.year == body.year,
        IncentiveScore.month == body.month,
    ).first()
    if rec:
        rec.diligence_pts = body.diligence_pts or 0
        rec.image_quality_pts = body.image_quality_pts or 0
        rec.cooperation_pts = body.cooperation_pts or 0
    else:
        rec = IncentiveScore(
            user_id=body.user_id,
            year=body.year,
            month=body.month,
            diligence_pts=body.diligence_pts or 0,
            image_quality_pts=body.image_quality_pts or 0,
            cooperation_pts=body.cooperation_pts or 0,
        )
        db.add(rec)
    db.commit()
    return {"message": "Puntos actualizados."}


class CalculateEmpleadoBody(BaseModel):
    year: int
    month: int


@app.post("/api/v1/incentives/calculate-empleado")
def calculate_empleado_del_mes(
    body: CalculateEmpleadoBody,
    db: Session = Depends(get_db),
    current_user: object = Depends(require_roles(ALLOWED_ADMIN_USERS)),
):
    """Select and save Empleado del Mes top 10 (Resting + annual cap applied). CEO/Director."""
    selected = select_empleado_del_mes(db, body.year, body.month, top_n=10)
    existing = db.query(EmpleadoDelMes).filter(
        EmpleadoDelMes.year == body.year,
        EmpleadoDelMes.month == body.month,
    ).all()
    for e in existing:
        db.delete(e)
    for s in selected:
        db.add(EmpleadoDelMes(user_id=s["user_id"], year=body.year, month=body.month, rank=s["rank"]))
    db.commit()
    return {"year": body.year, "month": body.month, "empleados": selected, "message": "Empleado del Mes guardado."}
