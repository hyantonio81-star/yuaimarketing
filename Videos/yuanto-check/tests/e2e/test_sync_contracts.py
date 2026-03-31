from pathlib import Path
from datetime import datetime, timedelta
import json

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.models import InspectionEvent, SyncIdempotency, User
from app.routers.auth import (
    LoginBody,
    auth_login,
    LOGIN_BUCKET,
    LOCKOUT_UNTIL,
    MAX_ATTEMPTS_PER_WINDOW,
)
from app.routers.inspection_events import InspectionEventUpsertBody, upsert_inspection_event
from app.services.idempotency import (
    IdempotencyConflictError,
    IdempotencyPendingError,
    finalize_idempotent_response,
    hash_request_payload,
    reserve_or_get_idempotent_response,
)


class DummyUser:
    def __init__(self, user_id=1):
        self.id = user_id


def make_db_session():
    engine = create_engine("sqlite:///:memory:")
    SyncIdempotency.__table__.create(bind=engine)
    InspectionEvent.__table__.create(bind=engine)
    User.__table__.create(bind=engine)
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return Session()


def test_hash_request_payload_is_deterministic():
    payload = {"b": 2, "a": 1, "nested": {"k": "v"}}
    h1 = hash_request_payload(payload)
    h2 = hash_request_payload({"nested": {"k": "v"}, "a": 1, "b": 2})
    assert h1 == h2


def test_hash_request_payload_changes_when_payload_changes():
    h1 = hash_request_payload({"inspectionId": "A", "version": 1})
    h2 = hash_request_payload({"inspectionId": "A", "version": 2})
    assert h1 != h2


def test_kpi_gate_doc_contains_required_targets():
    doc = Path("docs/OFFLINE_SYNC_VALIDATION.md").read_text(encoding="utf-8")
    required = [
        "sync_success_rate >= 99%",
        "duplicate_creation_rate == 0",
        "P95 sync latency <= 45s",
        "GO",
        "NO-GO",
    ]
    for token in required:
        assert token in doc


def test_idempotency_conflict_and_pending_flow():
    db = make_db_session()
    key = "k-1"
    endpoint = "/api/v1/test"
    reserve_or_get_idempotent_response(
        db,
        idempotency_key=key,
        endpoint=endpoint,
        user_id=1,
        request_hash=hash_request_payload({"a": 1}),
    )
    with pytest.raises(IdempotencyPendingError):
        reserve_or_get_idempotent_response(
            db,
            idempotency_key=key,
            endpoint=endpoint,
            user_id=1,
            request_hash=hash_request_payload({"a": 1}),
        )
    with pytest.raises(IdempotencyConflictError):
        reserve_or_get_idempotent_response(
            db,
            idempotency_key=key,
            endpoint=endpoint,
            user_id=1,
            request_hash=hash_request_payload({"a": 2}),
        )
    finalize_idempotent_response(
        db,
        idempotency_key=key,
        endpoint=endpoint,
        user_id=1,
        response={"accepted": True},
    )
    existing = reserve_or_get_idempotent_response(
        db,
        idempotency_key=key,
        endpoint=endpoint,
        user_id=1,
        request_hash=hash_request_payload({"a": 1}),
    )
    assert existing == {"accepted": True}


def test_idempotency_pending_expired_can_be_recovered():
    db = make_db_session()
    key = "k-recover"
    endpoint = "/api/v1/test"
    reserve_or_get_idempotent_response(
        db,
        idempotency_key=key,
        endpoint=endpoint,
        user_id=1,
        request_hash=hash_request_payload({"a": 1}),
    )
    row = (
        db.query(SyncIdempotency)
        .filter(
            SyncIdempotency.user_id == 1,
            SyncIdempotency.endpoint == endpoint,
            SyncIdempotency.idempotency_key == key,
        )
        .first()
    )
    row.pending_expires_at = datetime.utcnow() - timedelta(minutes=5)
    db.commit()
    recovered = reserve_or_get_idempotent_response(
        db,
        idempotency_key=key,
        endpoint=endpoint,
        user_id=1,
        request_hash=hash_request_payload({"a": 1}),
    )
    assert recovered is None


def test_inspection_event_stale_ignored_policy():
    db = make_db_session()
    user = DummyUser(77)
    accepted = upsert_inspection_event(
        body=InspectionEventUpsertBody(
            inspectionId="INS-1",
            sourceModule="maq",
            eventType="tab/informe",
            timestamp="2026-01-01T10:00:00Z",
            version=5,
            payload={"x": 1},
        ),
        x_idempotency_key=None,
        db=db,
        current_user=user,
    )
    assert accepted.get("accepted") is True
    assert accepted.get("syncOutcome") == "accepted"
    stale = upsert_inspection_event(
        body=InspectionEventUpsertBody(
            inspectionId="INS-1",
            sourceModule="maq",
            eventType="tab/informe",
            timestamp="2026-01-01T09:00:00Z",
            version=4,
            payload={"x": 0},
        ),
        x_idempotency_key=None,
        db=db,
        current_user=user,
    )
    assert stale.get("syncOutcome") == "conflict"
    assert stale.get("conflictCode") == "stale_ignored"


def test_inspection_event_idempotent_duplicate_outcome():
    db = make_db_session()
    user = DummyUser(77)
    body = InspectionEventUpsertBody(
        inspectionId="INS-DUP",
        sourceModule="caja",
        eventType="action/scan_confirm",
        timestamp="2026-01-01T10:00:00Z",
        version=1,
        payload={"x": 1},
    )
    first = upsert_inspection_event(
        body=body,
        x_idempotency_key="dup-k",
        db=db,
        current_user=user,
    )
    second = upsert_inspection_event(
        body=body,
        x_idempotency_key="dup-k",
        db=db,
        current_user=user,
    )
    assert first.get("syncOutcome") == "accepted"
    assert second.get("syncOutcome") == "duplicated"


def test_auth_login_rate_limit_blocks_bruteforce():
    db = make_db_session()
    LOGIN_BUCKET.clear()
    LOCKOUT_UNTIL.clear()
    body = LoginBody(email="unknown@example.com", password="wrong")

    for _ in range(MAX_ATTEMPTS_PER_WINDOW):
        with pytest.raises(HTTPException) as exc:
            auth_login(body=body, db=db)
        assert exc.value.status_code == 401

    with pytest.raises(HTTPException) as exc2:
        auth_login(body=body, db=db)
    assert exc2.value.status_code == 429


def test_mobile_security_and_pwa_contracts_present():
    app_src = Path("frontend/src/App.jsx").read_text(encoding="utf-8")
    assert '"/mobile/inspeccion-maq"' in app_src
    assert '"/mobile/inspeccion-caja"' in app_src

    manifest = json.loads(Path("frontend/public/manifest.json").read_text(encoding="utf-8"))
    icons = [icon.get("src") for icon in manifest.get("icons", [])]
    assert "/icon-192.png" in icons
    assert "/icon-512.png" in icons

    for icon_file in ("frontend/public/icon-192.png", "frontend/public/icon-512.png", "frontend/public/apple-touch-icon-180.png"):
        assert Path(icon_file).exists(), f"missing pwa icon: {icon_file}"
