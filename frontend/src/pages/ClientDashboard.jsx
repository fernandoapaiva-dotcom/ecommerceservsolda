import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, FileText, Download, CheckCircle } from 'lucide-react';

export default function ClientDashboard() {
  const { user, token, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=painel');
      return;
    }
    if (user.role === 'ADMIN') {
      navigate('/admin');
    }
  }, [user, navigate]);

  const [budgets, setBudgets] = useState([]);
  const [loadingBudgets, setLoadingBudgets] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  // Profile forms fields
  const [name, setName] = useState(user?.name || '');
  const [document, setDocument] = useState(user?.document || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch client budgets
  useEffect(() => {
    if (token) {
      fetch('http://localhost:5000/api/budgets/my-budgets', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => setBudgets(data))
        .catch(err => console.error(err))
        .finally(() => setLoadingBudgets(false));
    }
  }, [token]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, document, phone, address })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar alterações.');
      }

      updateUserProfile(data.user);
      setSuccessMsg('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.1),transparent)]"></div>
        <div className="relative space-y-2">
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Painel de Controle</p>
          <h1 className="text-3xl font-black tracking-tight leading-none uppercase">Área do Cliente</h1>
          <p className="text-slate-400 text-sm mt-1">Bem-vindo, {user?.name}! Gerencie seus dados cadastrais e veja o histórico de orçamentos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="space-y-2 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm h-fit">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold uppercase transition-colors ${activeTab === 'orders' ? 'bg-primary/50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            Histórico de Orçamentos
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold uppercase transition-colors ${activeTab === 'profile' ? 'bg-primary/50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            Dados Cadastrais
          </button>
        </div>

        {/* Contents Grid */}
        <div className="lg:col-span-3">
          
          {/* Historical Orders */}
          {activeTab === 'orders' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 font-bold text-slate-900 text-base">
                Meus Orçamentos Gerados
              </div>

              {loadingBudgets ? (
                <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                  <RefreshCw size={24} className="animate-spin text-primary" />
                  <span className="text-sm font-semibold">Carregando cotações...</span>
                </div>
              ) : budgets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Data</th>
                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Orçamento</th>
                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Itens</th>
                        <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Total</th>
                        <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {budgets.map(b => {
                        const itemsList = JSON.parse(b.items || '[]');
                        const itemsCount = itemsList.reduce((acc, i) => acc + i.qty, 0);
                        
                        return (
                          <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                              {new Date(b.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                              {b.budgetNumber}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {itemsCount} produto(s)
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900">
                              R$ {b.total.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {b.pdfPath ? (
                                <a
                                  href={`http://localhost:5000${b.pdfPath}`}
                                  download
                                  className="inline-flex p-2 bg-primary/10 hover:bg-primary/20 text-accent rounded-xl transition-all"
                                  title="Baixar PDF"
                                >
                                  <Download size={16} />
                                </a>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <p className="font-bold text-slate-600">Nenhum orçamento gerado ainda.</p>
                  <p className="text-xs">Quando você finalizar cotações no carrinho, elas aparecerão listadas aqui.</p>
                </div>
              )}
            </div>
          )}

          {/* Profile fields update form */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3 font-bold text-slate-900 text-base">
                Atualizar Cadastro
              </div>

              {successMsg && (
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Completo / Razão Social</label>
                    <input
                      type="text"
                      required
                      className="w-full text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  {/* Document */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Documento (CPF / CNPJ)</label>
                    <input
                      type="text"
                      className="w-full text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      value={document}
                      onChange={(e) => setDocument(e.target.value)}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefone</label>
                    <input
                      type="text"
                      className="w-full text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Endereço Completo</label>
                    <input
                      type="text"
                      className="w-full text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-slate-900 hover:bg-primary/50 text-white hover:text-slate-900 font-bold px-6 py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider"
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
