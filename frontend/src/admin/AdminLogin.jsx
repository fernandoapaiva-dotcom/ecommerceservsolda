import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, RefreshCw } from 'lucide-react';

export default function AdminLogin() {
  const { user, login, token } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in as Admin
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/painel');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao efetuar login administrativo.');
      }

      if (data.user.role !== 'ADMIN') {
        throw new Error('Acesso recusado. Esta área é restrita a administradores.');
      }

      login(data.token, data.user);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700/60 rounded-3xl p-8 shadow-2xl space-y-6">
        
        {/* Header branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-amber-500/10 text-amber-500 rounded-2xl mb-2">
            <ShieldCheck size={36} />
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider">Acesso Administrativo</h1>
          <p className="text-xs text-slate-400">ServoSolda E-commerce Manager</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 border border-red-500/25 rounded-xl p-3.5 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">E-mail Corporativo</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="nome@servsolda.com.br"
                className="w-full text-sm pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Senha Secreta</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full text-sm pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 text-slate-900 hover:bg-amber-600 font-bold text-xs uppercase py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Entrar no Sistema</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white text-xs underline">
            Voltar para o site
          </button>
        </div>

      </div>
    </div>
  );
}
