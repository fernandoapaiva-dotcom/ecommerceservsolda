import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Phone, MapPin, FileText } from 'lucide-react';
const Chrome = (props) => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>;

export default function AuthPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? 'login' : 'register';
    const body = isLogin 
      ? { email, password } 
      : { email, password, name, document, phone, address };

    try {
      const res = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro na autenticação');
      }

      login(data.token, data.user);
      
      // Redirect to correct destination (e.g. checkout if initiated from checkout)
      if (redirect === 'checkout') {
        navigate('/checkout');
      } else if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/painel');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMockLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Simulate OAuth response from Google Backend pipeline Integration
      const mockGooglePayload = {
        email: email || 'cliente.google@servsolda.com.br',
        name: name || 'Cliente Google OAuth Test',
        googleToken: 'mock-google-oauth-token-val-2026'
      };

      const res = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mockGooglePayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro Google Authentication');
      }

      login(data.token, data.user);
      
      if (redirect === 'checkout') {
        navigate('/checkout');
      } else {
        navigate('/painel');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
        
        {/* Toggle tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setIsLogin(true)}
            className={`w-1/2 pb-3 font-bold text-sm transition-all uppercase tracking-wider ${isLogin ? 'border-b-2 border-primary text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Entrar
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`w-1/2 pb-3 font-bold text-sm transition-all uppercase tracking-wider ${!isLogin ? 'border-b-2 border-primary text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Criar Conta
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3.5 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLogin && (
            <>
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Completo / Razão Social</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="João da Silva LTDA"
                    className="w-full text-sm pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                </div>
              </div>

              {/* Document */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Documento (CPF / CNPJ)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="12.345.678/0001-90"
                    className="w-full text-sm pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                  />
                  <FileText size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefone de Contato</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="(54) 99999-9999"
                    className="w-full text-sm pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Endereço Completo</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rua das Inversoras, 456 - Caxias do Sul - RS"
                    className="w-full text-sm pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="vendas@empresa.com"
                className="w-full text-sm pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Senha</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full text-sm pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-primary/50 text-white hover:text-slate-900 font-bold py-3 rounded-xl transition-all shadow-md mt-4 text-sm uppercase tracking-wider"
          >
            {loading ? 'Processando...' : isLogin ? 'Acessar Conta' : 'Criar minha Conta'}
          </button>
        </form>

        {/* Google OAuth trigger component simulator */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase">ou</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoogleMockLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-wider border border-slate-200"
          >
            <Chrome size={16} className="text-primary" />
            <span>Entrar com Google</span>
          </button>
          
          <div className="text-[10px] text-slate-400 text-center leading-relaxed">
            * O botão do Google OAuth está em modo de homologação. O Client ID e Secret podem ser inseridos no arquivo .env do backend. Para testar a autenticação Google agora, basta clicar no botão acima.
          </div>
        </div>

      </div>
    </div>
  );
}
