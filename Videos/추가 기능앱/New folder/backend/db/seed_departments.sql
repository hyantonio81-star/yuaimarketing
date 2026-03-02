-- 18개 팀/부서 등록 (조직도·파이프라인 기본 데이터)
-- schema_factory.sql 실행 후 실행하세요.

-- 한 번만 실행 (중복 실행 시 dept_name 중복 오류 가능)
INSERT INTO departments (dept_name, parent_id, sort_order) VALUES
  ('Corrugadora', NULL, 1),
  ('Produccion', NULL, 2),
  ('Inspeccion de Calidad', NULL, 3),
  ('Sistema Gestion de Calidad', NULL, 4),
  ('Diseno y Desarrollo', NULL, 5),
  ('Materia Prima', NULL, 6),
  ('Transporte', NULL, 7),
  ('Despacho', NULL, 8),
  ('Almacen PT', NULL, 9),
  ('Mantenimiento Mecanico', NULL, 10),
  ('Caldera', NULL, 11),
  ('Limpieza', NULL, 12),
  ('Seguridad', NULL, 13),
  ('RRHH', NULL, 14),
  ('Compras', NULL, 15),
  ('Planificacion', NULL, 16),
  ('Repuesto', NULL, 17),
  ('Submaterial', NULL, 18);
