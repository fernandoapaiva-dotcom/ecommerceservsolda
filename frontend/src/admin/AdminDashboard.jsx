import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { useAuth } from '../context/AuthContext';
import { Package, Users, FileText, Activity, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuth();
  
  const [stats, setStats] = useState({
    products: 0,
    sections: 0,
    banners: 0,
    clients: 0,
    budgets: 0
  });
  
  const [syncLogs, setSyncLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [prodRes, secRes, banRes, clientRes, budgetRes, logsRes] = await Promise.all([
          fetch('http://localhost:5000/api/products'),
          fetch('http://localhost:5000/api/sections'),
          fetch('http://localhost:5000/api/banners'),
          fetch('http://localhost:5000/api/clients', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/budgets', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/erp/logs', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const [prods, secs, bans, clients, budgets, logs] = await Promise.all([
          prodRes.json(),
          secRes.json(),
          banRes.json(),
          clientRes.json(),
          budgetRes.json(),
          logsRes.json()
        ]);

        setStats({
          products: prods.length,
          sections: secs.length,
          banners: bans.length,
          clients: clients.length || 0,
          budgets: budgets.length || 0
        });

        setSyncLogs(logs.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [token]);

  return (
    <AdminLayout>
      <div className="space-y-10">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase">Dashboard Geral</h1>
          <p className="text-slate-500 text-xs">Informações gerais e logs do sistema ServSolda</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-accent rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <p className="text-xs text-neutral font-bold uppercase tracking-wider">Produtos</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.products}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs text-neutral font-bold uppercase tracking-wider">Clientes</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.clients}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-xs text-neutral font-bold uppercase tracking-wider">Orçamentos</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.budgets}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-xs text-neutral font-bold uppercase tracking-wider">Seções</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.sections}</p>
            </div>
          </div>

        </div>

        {/* ERP Integration Logs Monitor */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm uppercase tracking-wider">Logs Sincronização Softsystem ERP</span>
            <span className="text-xs text-neutral">Últimas 5 execuções</span>
          </div>

          {syncLogs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {syncLogs.map(log => (
                <div key={log.id} className="p-4 flex items-center justify-between text-xs gap-4 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-slate-700 font-semibold">{log.message}</span>
                  </div>
                  <span className="text-neutral whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-neutral flex flex-col items-center justify-center gap-2">
              <AlertCircle size={20} className="text-slate-300" />
              <span className="text-sm">Nenhum log de sincronização registrado ainda.</span>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
