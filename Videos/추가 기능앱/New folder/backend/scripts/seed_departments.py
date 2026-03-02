# -*- coding: utf-8 -*-
"""
18개 팀 부서 등록. (PostgreSQL 연결 필요)
  python -m scripts.seed_departments
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DEPS = [
    ("Corrugadora", 1),
    ("Produccion", 2),
    ("Inspeccion de Calidad", 3),
    ("Sistema Gestion de Calidad", 4),
    ("Diseno y Desarrollo", 5),
    ("Materia Prima", 6),
    ("Transporte", 7),
    ("Despacho", 8),
    ("Almacen PT", 9),
    ("Mantenimiento Mecanico", 10),
    ("Caldera", 11),
    ("Limpieza", 12),
    ("Seguridad", 13),
    ("RRHH", 14),
    ("Compras", 15),
    ("Planificacion", 16),
    ("Repuesto", 17),
    ("Submaterial", 18),
]


async def main():
    from app.config import DATABASE_URL
    import asyncpg

    if not DATABASE_URL:
        print("DATABASE_URL not set. Set it in .env")
        return
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        for name, order in DEPS:
            existing = await conn.fetchval("SELECT dept_id FROM departments WHERE dept_name = $1", name)
            if existing:
                await conn.execute("UPDATE departments SET sort_order = $1 WHERE dept_id = $2", order, existing)
            else:
                await conn.execute(
                    "INSERT INTO departments (dept_name, parent_id, sort_order) VALUES ($1, NULL, $2)",
                    name,
                    order,
                )
        print(f"Departments seeded: {len(DEPS)} teams.")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
