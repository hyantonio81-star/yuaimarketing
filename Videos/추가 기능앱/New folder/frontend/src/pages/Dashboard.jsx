import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getDashboard } from '../api/client';

const gradeStyle = (grade) => {
  switch (grade) {
    case 'S':
      return 'bg-emerald-100 text-emerald-800';
    case 'A':
      return 'bg-indigo-100 text-indigo-800';
    case 'B':
      return 'bg-amber-100 text-amber-800';
    case 'C':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">대시보드 로딩 중…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-8">
        <p className="text-rose-600">오류: {error}. 백엔드(port 8000)가 실행 중인지 확인하세요.</p>
      </div>
    );
  }

  const { summary, departments: deptData, ai_insight } = data;
  const chartData = deptData.map((d) => ({ name: d.name, rate: d.rate }));

  return (
    <div className="p-6 bg-slate-100 min-h-screen font-sans">
      <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Yuanto Smart Factory KPI Dashboard
        </h1>
        <span className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          2026년 2월 리포트
        </span>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-500">
          <h2 className="text-lg font-bold text-indigo-700 mb-2">
            AI 부서별 성과 진단
          </h2>
          <p className="text-slate-600 leading-relaxed">
            {ai_insight || (
              <>전사 평균 이행률은 <strong>{summary?.avg_rate}%</strong>로 전월 대비 소폭 상승했습니다.</>
            )}
          </p>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-xl text-white flex flex-col justify-center items-center shadow-lg">
          <p className="text-sm opacity-90">전사 통합 이행률</p>
          <p className="text-4xl font-bold mt-1">{summary?.avg_rate ?? 0}%</p>
          <p className="text-xs mt-2 opacity-90">
            전월 대비 {summary?.trend_vs_prev ?? '+' + '0'}% 상승 ▲
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-bold mb-4 text-slate-800">부서별 실시간 이행률 (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px' }}
                  formatter={(value) => [`${value}%`, '이행률']}
                />
                <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-bold mb-4 text-slate-800">부서 성과 등급표</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-200">
                <th className="pb-2">부서</th>
                <th className="pb-2">이행률</th>
                <th className="pb-2">등급</th>
                <th className="pb-2">추세</th>
              </tr>
            </thead>
            <tbody>
              {deptData.map((d) => (
                <tr
                  key={d.name}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition"
                >
                  <td className="py-3 font-medium text-slate-800">{d.name}</td>
                  <td className="py-3 text-slate-600">{d.rate}%</td>
                  <td className="py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-bold ${gradeStyle(
                        d.grade
                      )}`}
                    >
                      {d.grade}
                    </span>
                  </td>
                  <td
                    className={`py-3 font-medium ${
                      String(d.trend).startsWith('+')
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {d.trend}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
