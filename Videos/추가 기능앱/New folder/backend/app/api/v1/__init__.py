# -*- coding: utf-8 -*-
from .admin import router as admin_router
from .auth_router import router as auth_router
from .kpi import router as kpi_router
from .tasks import router as tasks_router

__all__ = ["admin_router", "auth_router", "kpi_router", "tasks_router"]
