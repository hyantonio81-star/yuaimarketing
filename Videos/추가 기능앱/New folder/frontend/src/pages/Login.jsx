import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin, getHealth } from '../api/client';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);
  const { setToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth({ db_connected: false }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiLogin(username, password);
      setToken(data.access_token, data.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const dbConnected = health?.db_connected !== false;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
        {health && !health.db_connected && (
          <div className="mb-4 p-3 bg-amber-100 border border-amber-400 rounded-lg text-amber-800 text-sm">
            데이터베이스에 연결되지 않았습니다. 서버 설정을 확인하거나 관리자에게 문의하세요.
          </div>
        )}
        <h1 className="text-xl font-bold text-slate-800 mb-6">KPI 대시보드 로그인</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">로그인명</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-rose-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || (health && !dbConnected)}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </form>
        <p className="mt-4 text-slate-500 text-xs">
          {dbConnected ? 'J&J SRL: sga@jyj.com.do / jyjsrl26' : 'DB 연결 후 로그인 가능'}
        </p>
      </div>
    </div>
  );
}
