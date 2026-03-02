# -*- coding: utf-8 -*-
"""
AI 보안: 프롬프트 인젝션 방지, 입력 정제(Sanitization), 출력 검증(Validation).
LLM 호출 전/후에 적용. 마스터플랜 2.4 반영.
"""

import logging
import re
from typing import List, Optional

logger = logging.getLogger(__name__)


class AISecurityError(Exception):
    """AI 보안 검사 실패 시 (의심스러운 입력/출력)."""
    pass


# 프롬프트 인젝션 의심 패턴 (대소문자 무시)
FORBIDDEN_PATTERNS = [
    r"ignore\s+(previous|above|all)\s+(instructions?|prompts?|rules?)",
    r"system\s*prompt",
    r"you\s+are\s+now",
    r"admin\s+mode",
    r"jailbreak",
    r"override\s+(safety|instructions)",
    r"<\s*script",
    r"javascript\s*:",
]

# SQL 인젝션 의심 패턴
SQL_PATTERNS = [
    r";\s*(drop|delete|update|insert|alter)\s+",
    r"(\s|^)(union|select|exec|execute)\s+",
    r"'\s*;\s*--",
]


def sanitize_input(user_input: str, max_length: int = 1000) -> str:
    """
    LLM/AI에 넘기기 전 사용자 입력 정제.
    - 길이 제한
    - 금지 패턴 차단 (프롬프트 인젝션)
    - SQL 패턴 차단
    - HTML/스크립트 태그 제거
    - 연속 특수문자 제한
    """
    if not isinstance(user_input, str):
        raise AISecurityError("Input must be a string")
    text = user_input.strip()
    if len(text) > max_length:
        logger.warning("ai_security: input too long, truncated")
        text = text[:max_length]
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            logger.warning("ai_security: forbidden pattern detected in input")
            raise AISecurityError("Suspicious input detected")
    for pattern in SQL_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            logger.warning("ai_security: sql-like pattern in input")
            raise AISecurityError("Invalid input format")
    text = re.sub(r"<script[^>]*>.*?</script>", "", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"([!@#$%^&*()_+=\[\]{};':\"\\|,.<>?/-])\\1{3,}", r"\1\1\1", text)
    return text.strip()


def validate_output(
    output: str,
    tenant_id: Optional[str] = None,
    other_tenant_names: Optional[List[str]] = None,
    redact_pii: bool = True,
) -> str:
    """
    AI 생성 출력 검증.
    - 다른 tenant/조직명 유출 방지 (other_tenant_names에 있으면 에러 메시지로 대체)
    - PII 패턴 마스킹 (선택)
    - 스크립트/위험 문자열 제거
    """
    if not isinstance(output, str):
        return "Error: AI output validation failed. Please try again."
    result = output
    other_tenants = list(other_tenant_names or [])
    if tenant_id:
        other_tenants = [n for n in other_tenants if str(n) != str(tenant_id)]
    for name in other_tenants:
        if name and name.lower() in result.lower():
            logger.warning("ai_security: possible data leakage in output, tenant name found")
            return "Error: AI output validation failed. Please try again."
    if redact_pii:
        result = re.sub(r"\b\d{3}-\d{2}-\d{4}\b", "[SSN_REDACTED]", result)
        result = re.sub(
            r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b",
            "[CARD_REDACTED]",
            result,
        )
        result = re.sub(
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
            "[EMAIL_REDACTED]",
            result,
        )
    if "<script" in result.lower() or "javascript:" in result.lower():
        logger.warning("ai_security: script/xss in output, removed")
        result = re.sub(
            r"<script[^>]*>.*?</script>",
            "[CODE_REMOVED]",
            result,
            flags=re.IGNORECASE | re.DOTALL,
        )
    return result
