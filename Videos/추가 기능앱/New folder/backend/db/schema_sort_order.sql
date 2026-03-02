-- departments 표시 순서(파이프라인)용
ALTER TABLE departments ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_departments_sort ON departments(sort_order);
