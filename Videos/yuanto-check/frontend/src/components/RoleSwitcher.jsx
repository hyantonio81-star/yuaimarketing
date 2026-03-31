import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roles = [
  { value: 'staff', label: 'Staff' },
  { value: 'leader', label: 'Leader' },
  { value: 'manager', label: 'Manager' },
  { value: 'director', label: 'Director' },
  { value: 'ceo', label: 'CEO' },
];

export default function RoleSwitcher() {
  const roleSwitcherEnabled = Boolean(import.meta.env.DEV && String(import.meta.env.VITE_ENABLE_ROLE_SWITCHER || '').toLowerCase() === 'true');
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!roleSwitcherEnabled) return null;

  const handleChange = (role) => {
    if (!user) return;
    setUser({ ...user, role, id: user.id ?? 1, dept_id: user.dept_id ?? null });
    setOpen(false);
    const isStaffOrLeader = role === 'staff' || role === 'leader';
    navigate(isStaffOrLeader ? '/mobile' : '/dashboard');
  };

  return (
    <div className="fixed top-2 right-2 z-50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="bg-slate-700 text-white text-xs px-3 py-1.5 rounded-lg shadow"
      >
        {user && (user.role || 'staff').toString().toUpperCase()} (cambiar rol)
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[180px]">
          {roles.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => handleChange(r.value)}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${
                (user?.role || 'staff') === r.value ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'
              }`}
            >
              {r.label}
            </button>
          ))}
          <a
            href="/login"
            className="block w-full text-left px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 border-t border-slate-100"
          >
            Pantalla de acceso
          </a>
        </div>
      )}
    </div>
  );
}
