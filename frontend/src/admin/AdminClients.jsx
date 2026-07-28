import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Search } from 'lucide-react';

export default function AdminClients() {
  const { token } = useAuth();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchClients = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/clients', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setClients(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.document && c.document.includes(search))
  );

  return (
    <AdminLayout>
      <div className="space-y-10">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase">Clientes Cadastrados</h1>
            <p className="text-slate-500 text-xs">Monitore os perfis, documentos e histórico comercial dos clientes</p>
          </div>
          
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar por nome, email, CPF..."
              className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={14} className="absolute left-3 top-3.5 text-neutral" />
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-neutral">
              <RefreshCw size={24} className="animate-spin text-primary" />
              <span className="text-sm font-semibold">Carregando lista de clientes...</span>
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Documento</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Telefone</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Cadastro</th>
                    <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider">Orçamentos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredClients.map(client => (
                    <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{client.name}</p>
                        <p className="text-[10px] text-neutral">{client.email}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-semibold">{client.document || 'Não informado'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">{client.phone || 'Não informado'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-accent">
                        {client._count?.orders || 0} cotação(ões)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-neutral">
              Nenhum cliente cadastrado correspondente à busca.
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
