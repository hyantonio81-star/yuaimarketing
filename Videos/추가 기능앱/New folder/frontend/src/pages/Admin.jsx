import React, { useState, useEffect } from 'react';
import {
  getAdminDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getPipeline,
  updatePipelineOrder,
} from '../api/client';

const TABS = [{ id: 'org', label: 'Organización' }, { id: 'pipeline', label: 'Pipeline' }];

export default function Admin() {
  const [tab, setTab] = useState('org');
  const [departments, setDepartments] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, pipe] = await Promise.all([getAdminDepartments(), getPipeline()]);
      setDepartments(data.departments || []);
      setPipeline(pipe.departments || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createDepartment({ dept_name: newName.trim() });
      setNewName('');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (deptId, body) => {
    setSaving(true);
    try {
      await updateDepartment(deptId, body);
      setEditing(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (deptId) => {
    if (!window.confirm('¿Eliminar este departamento?')) return;
    setSaving(true);
    try {
      await deleteDepartment(deptId);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const movePipeline = (index, delta) => {
    const next = [...pipeline];
    const j = index + delta;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setPipeline(next);
  };

  const savePipeline = async () => {
    setSaving(true);
    try {
      await updatePipelineOrder(pipeline.map((d) => d.dept_id));
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && departments.length === 0) {
    return (
      <div className="p-8 flex justify-center">
        <p className="text-slate-500">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Administración – Organigrama y Pipeline</h1>
      {error && (
        <div className="mb-4 p-3 bg-rose-100 text-rose-800 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-2 border-b border-slate-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 font-medium rounded-t-lg ${
              tab === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'org' && (
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nuevo departamento"
              className="border border-slate-300 rounded-lg px-3 py-2 flex-1"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !newName.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Añadir
            </button>
          </div>
          <ul className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {departments.length === 0 && (
              <li className="p-4 text-slate-500 text-sm">
                No hay departamentos. Añade uno o ejecuta el seed (seed_departments.sql / python -m scripts.seed_departments).
              </li>
            )}
            {departments.map((d) => (
              <li key={d.dept_id} className="p-4 flex items-center justify-between gap-4">
                {editing === d.dept_id ? (
                  <input
                    type="text"
                    defaultValue={d.dept_name}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(d.dept_id, { dept_name: e.target.value });
                      if (e.key === 'Escape') setEditing(null);
                    }}
                    onBlur={(e) => {
                      if (e.target.value.trim() !== d.dept_name) handleUpdate(d.dept_id, { dept_name: e.target.value.trim() });
                      else setEditing(null);
                    }}
                    autoFocus
                    className="border border-slate-300 rounded px-2 py-1 flex-1"
                  />
                ) : (
                  <>
                    <span className="font-medium text-slate-800">{d.dept_name}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(d.dept_id)}
                        className="text-indigo-600 text-sm hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(d.dept_id)}
                        className="text-rose-600 text-sm hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'pipeline' && (
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            Orden de aparición en el dashboard. Usa subir/bajar y guarda.
          </p>
          <ul className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {pipeline.length === 0 && (
              <li className="p-4 text-slate-500 text-sm">No hay departamentos. Configura la pestaña Organización o ejecuta el seed.</li>
            )}
            {pipeline.map((d, i) => (
              <li key={d.dept_id} className="p-4 flex items-center justify-between gap-2">
                <span className="text-slate-500 w-8">{i + 1}.</span>
                <span className="font-medium text-slate-800 flex-1">{d.dept_name}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => movePipeline(i, -1)}
                    disabled={i === 0}
                    className="px-2 py-1 bg-slate-200 rounded text-sm disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => movePipeline(i, 1)}
                    disabled={i === pipeline.length - 1}
                    className="px-2 py-1 bg-slate-200 rounded text-sm disabled:opacity-40"
                  >
                    ↓
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={savePipeline}
            disabled={saving || pipeline.length === 0}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar orden'}
          </button>
        </div>
      )}
    </div>
  );
}
