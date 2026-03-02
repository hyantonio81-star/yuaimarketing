import React, { useState, useEffect } from 'react';
import { getMyTasks, updateTaskExecute } from '../api/client';

export default function MobileChecklist() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTasks = () => {
    getMyTasks()
      .then((res) => setTasks(res.tasks || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const toggleTask = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const nextDone = !task.done;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: nextDone } : t))
    );
    updateTaskExecute(id, nextDone).catch(() => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: !nextDone } : t))
      );
    });
  };

  const doneCount = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const progress = total ? Math.round((doneCount / total) * 100) : 0;

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-4 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">업무 목록 로딩 중…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-md mx-auto p-4">
        <p className="text-rose-600">오류: {error}. 백엔드를 확인하세요.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-slate-50 min-h-screen">
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">나의 오늘 업무</h2>
        <div className="mt-4 bg-slate-200 h-4 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-right text-sm mt-2 text-slate-500">
          진행률 {progress}%
        </p>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => toggleTask(task.id)}
            className={`w-full p-5 rounded-xl flex justify-between items-center transition text-left ${
              task.done
                ? 'bg-emerald-50 border-2 border-emerald-500'
                : 'bg-white border-2 border-transparent shadow-sm hover:border-slate-200'
            }`}
          >
            <span
              className={
                task.done
                  ? 'text-emerald-800 font-medium line-through'
                  : 'text-slate-700'
              }
            >
              {task.name}
            </span>
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                task.done
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-slate-300'
              }`}
            >
              {task.done && (
                <span className="text-white text-lg font-bold leading-none">
                  ✓
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
