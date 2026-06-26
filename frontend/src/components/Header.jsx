import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, LogOut, Phone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';

export default function Header() {
  const { getItemCount } = useCart();
  const { user, logout } = useAuth();
  const { config } = useConfig();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sections, setSections] = useState([]);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Load active sections
  useEffect(() => {
    fetch('http://localhost:5000/api/sections')
      .then(res => res.json())
      .then(data => {
        setSections(data.filter(s => s.active));
      })
      .catch(err => console.error(err));
  }, []);

  // Search Autocomplete / Suggestions
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      fetch(`http://localhost:5000/api/products?search=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          setSuggestions(data.slice(0, 5));
        })
        .catch(err => console.error(err));
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/produtos?busca=${encodeURIComponent(searchQuery)}`);
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (sku) => {
    navigate(`/produto/${sku}`);
    setSearchQuery('');
    setSuggestions([]);
  };

  // Close menus on path change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              {config?.logo ? (
                <img 
                  src={`http://localhost:5000${config.logo}`} 
                  alt={config?.companyName || 'ServoSolda'} 
                  className="h-12 w-auto object-contain" 
                />
              ) : (
                <span className="text-2xl font-black tracking-wider text-amber-500 flex items-center">
                  SERVO<span className="text-white">SOLDA</span>
                </span>
              )}
            </Link>
          </div>

          {/* Search bar with Autocomplete */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                placeholder="Buscar máquinas, tochas, consumíveis..."
                className="w-full bg-slate-800 text-white pl-4 pr-10 py-2.5 rounded-full border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute right-3 top-2.5 text-slate-400 hover:text-amber-500">
                <Search size={18} />
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                {suggestions.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSuggestionClick(item.sku)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-700 border-b border-slate-700 last:border-0 text-sm flex items-center justify-between"
                  >
                    <span>{item.name}</span>
                    <span className="text-xs text-amber-500 font-semibold">{item.sku}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart & Profile Controls */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/carrinho" className="relative p-2 text-slate-300 hover:text-amber-500 transition-colors">
              <ShoppingCart size={24} />
              {getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {getItemCount()}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                <Link to={user.role === 'ADMIN' ? '/admin' : '/painel'} className="flex items-center gap-1.5 text-slate-300 hover:text-amber-500 transition-colors">
                  <User size={20} />
                  <span className="text-sm font-medium">{user.name.split(' ')[0]}</span>
                </Link>
                <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Sair">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 px-5 py-2.5 rounded-full font-semibold text-sm transition-colors">
                <User size={16} />
                <span>Entrar / Cadastrar</span>
              </Link>
            )}
          </div>

          {/* Mobile hamburger menu button */}
          <div className="md:hidden flex items-center gap-4">
            <Link to="/carrinho" className="relative p-2 text-slate-300 hover:text-amber-500">
              <ShoppingCart size={22} />
              {getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {getItemCount()}
                </span>
              )}
            </Link>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-amber-500 focus:outline-none"
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>

        </div>
      </div>

      {/* Dynamic Sub-navigation Menu (Sections list) */}
      <nav className="hidden md:block bg-slate-800 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 h-10 text-xs font-semibold tracking-wider uppercase">
            <Link to="/" className="text-slate-300 hover:text-amber-500 py-2">Home</Link>
            {sections.map(section => (
              <Link
                key={section.id}
                to={`/secao/${section.id}`}
                className="text-slate-300 hover:text-amber-500 py-2 transition-colors"
              >
                {section.name}
              </Link>
            ))}
            <Link to="/produtos" className="text-slate-300 hover:text-amber-500 py-2">Todos Produtos</Link>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer (tested on 375px viewport) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 pt-4 pb-6 space-y-4 shadow-xl">
          {/* Mobile Search input */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full bg-slate-800 text-white pl-4 pr-10 py-2 rounded-full border border-slate-700 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-3 top-2 text-slate-400">
              <Search size={16} />
            </button>
          </form>

          {/* Section list */}
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase border-b border-slate-800 pb-1">Seções</p>
            <Link to="/" className="block py-2 text-slate-300 hover:text-amber-500 font-medium">Home</Link>
            {sections.map(section => (
              <Link
                key={section.id}
                to={`/secao/${section.id}`}
                className="block py-2 text-slate-300 hover:text-amber-500 font-medium"
              >
                {section.name}
              </Link>
            ))}
            <Link to="/produtos" className="block py-2 text-slate-300 hover:text-amber-500 font-medium">Todos Produtos</Link>
          </div>

          {/* Account profile options */}
          <div className="border-t border-slate-800 pt-4 space-y-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-slate-300 mb-2">
                  <User size={18} className="text-amber-500" />
                  <span className="font-semibold">{user.name}</span>
                </div>
                <Link to={user.role === 'ADMIN' ? '/admin' : '/painel'} className="block py-2 bg-slate-800 rounded-lg text-center text-slate-300">
                  Minha Área
                </Link>
                <button onClick={logout} className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-center font-medium">
                  Sair da Conta
                </button>
              </>
            ) : (
              <Link to="/login" className="block w-full py-2.5 bg-amber-500 text-slate-900 text-center font-bold rounded-lg">
                Entrar / Cadastrar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
