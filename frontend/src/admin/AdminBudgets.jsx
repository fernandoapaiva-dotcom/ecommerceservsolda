import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Search, Download, Eye } from 'lucide-react';

export default function AdminBudgets() {
  const { token } = useAuth();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search parameters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchBudgets = () => {
    setLoading(true);
    let url = 'http://localhost:5000/api/budgets?';
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBudgets(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBudgets();
  }, [startDate, endDate]);

  const filteredBudgets = budgets.filter(b => 
    b.budgetNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.user.name.toLowerCase().includes(search.toLowerCase()) ||
    b.user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-10">
        
        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase">Histórico de Orçamentos</h1>
            <p className="text-slate-500 text-xs">Exiba e faça o download dos arquivos em PDF de todas as cotações geradas no site</p>
          </div>
        </div>

        {/* Filters Box */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1 w-full">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Buscar por Número ou Cliente</label>
            <input
              type="text"
              placeholder="Ex: ORC-20260625..."
              className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-1 w-full md:w-44">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data Inicial</label>
            <input
              type="date"
              className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-1 w-full md:w-44">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data Final</label>
            <input
              type="date"
              className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Budgets list */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-neutral">
              <RefreshCw size={24} className="animate-spin text-primary" />
              <span className="text-sm font-semibold">Carregando histórico...</span>
            </div>
          ) : filteredBudgets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Orçamento</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Contato</th>
                    <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider">Valor Total</th>
                    <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredBudgets.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        {new Date(b.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">{b.budgetNumber}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{b.user.name}</p>
                        <p className="text-[10px] text-neutral">{b.user.document || 'Sem documento'}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <p>{b.user.email}</p>
                        <p className="text-[10px] text-neutral">{b.user.phone || 'Sem fone'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-black text-slate-900">
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
                            <Download size={14} />
                          </a>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-neutral">
              Nenhum orçamento encontrado com os filtros selecionados.
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
