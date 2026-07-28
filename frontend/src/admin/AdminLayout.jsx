import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Package, FolderHeart, Image, Users, FileBarChart, Settings, LogOut, ShieldCheck, Menu, X } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';

export default function AdminLayout({ children }) {
  const { config } = useConfig();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Validate Admin Access
  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      navigate('/painel');
    }
  }, [user, navigate]);

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutGrid },
    { name: 'Seções (Categorias)', path: '/admin/secoes', icon: FolderHeart },
    { name: 'Produtos', path: '/admin/produtos', icon: Package },
    { name: 'Banners Carrossel', path: '/admin/banners', icon: Image },
    { name: 'Clientes Cadastrados', path: '/admin/clientes', icon: Users },
    { name: 'Orçamentos', path: '/admin/orcamentos', icon: FileBarChart },
    { name: 'Configurações Gerais', path: '/admin/config', icon: Settings },
  ];

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        Acesso restrito. Redirecionando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-adminSidebarBg text-adminSidebarText p-6 space-y-8 flex-shrink-0">
        
        {/* Branding */}
        <div className="flex flex-col gap-2">
          {config?.logo ? (
            <img
              src={`http://localhost:5000${config.logo}`}
              alt={config?.companyName || 'ServSolda'}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span className="text-white font-black text-lg">
              {config?.companyName || 'ServSolda'}
            </span>
          )}
          <p className="text-[10px] text-adminSidebarText opacity-50 uppercase font-bold tracking-widest mt-1">
            {config?.companyName || 'ServSolda'} E-commerce
          </p>
        </div>

        {/* Links list */}
        <nav className="space-y-1.5 flex-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = window.location.pathname === item.path;
            
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                  isActive 
                    ? 'bg-adminSidebarActiveBg text-white shadow-md' 
                    : 'text-adminSidebarText opacity-80 hover:opacity-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="leading-tight">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info / user */}
        <div className="border-t border-white/10 pt-6 space-y-3 text-xs">
          <div>
            <p className="font-semibold text-white">{user.name}</p>
            <p className="text-adminSidebarText opacity-60">{user.email}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2.5 rounded-xl font-bold transition-colors uppercase tracking-wider text-[10px]"
          >
            <LogOut size={14} />
            <span>Sair do Admin</span>
          </button>
        </div>
      </aside>

      {/* Mobile admin header menu */}
      <div className="md:hidden bg-adminSidebarBg text-white p-4 flex items-center justify-between shadow-md">
        <span className="text-sm font-black text-primary tracking-wider">
          {config?.companyName || 'ServSolda'} Admin
        </span>
        <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} className="p-1">
          {mobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="md:hidden bg-adminSidebarBg border-t border-white/10 p-4 space-y-3 z-50 shadow-xl">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = window.location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => { navigate(item.path); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                  isActive 
                    ? 'bg-adminSidebarActiveBg text-white shadow-md' 
                    : 'text-adminSidebarText opacity-80 hover:opacity-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="leading-tight">{item.name}</span>
              </button>
            );
          })}
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full py-2.5 bg-red-600/20 text-red-400 text-sm font-bold rounded-xl"
          >
            Sair
          </button>
        </div>
      )}

      {/* Main Admin Content Panels container */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>

    </div>
  );
}
