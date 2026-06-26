import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Package, FolderHeart, Image, Users, FileBarChart, Settings, LogOut, ShieldCheck, Menu, X } from 'lucide-react';

export default function AdminLayout({ children }) {
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
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-400 p-6 space-y-8 flex-shrink-0">
        
        {/* Branding */}
        <div>
          <span className="text-xl font-black text-amber-500 tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={24} />
            <span>PAINEL <span className="text-white">ADMIN</span></span>
          </span>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">ServoSolda E-commerce</p>
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all uppercase tracking-wide ${isActive ? 'bg-amber-500 text-slate-900 shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info / user */}
        <div className="border-t border-slate-800 pt-6 space-y-3 text-xs">
          <div>
            <p className="font-semibold text-slate-300">{user.name}</p>
            <p className="text-slate-500">{user.email}</p>
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
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between shadow-md">
        <span className="text-sm font-black text-amber-500 tracking-wider">SERVO ADMIN</span>
        <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} className="p-1">
          {mobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 p-4 space-y-3 z-50 shadow-xl">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = window.location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => { navigate(item.path); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-amber-500 text-slate-900' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <Icon size={16} />
                <span>{item.name}</span>
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
