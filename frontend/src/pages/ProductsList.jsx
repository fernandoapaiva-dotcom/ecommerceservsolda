import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Search, Eye, RefreshCw, SlidersHorizontal } from 'lucide-react';

export default function ProductsList() {
  const { sectionId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('busca') || '');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Sync Search Query from URL SearchParams
  useEffect(() => {
    setSearchQuery(searchParams.get('busca') || '');
  }, [searchParams]);

  useEffect(() => {
    // Load sections
    fetch('http://localhost:5000/api/sections')
      .then(res => res.json())
      .then(data => setSections(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = 'http://localhost:5000/api/products?';
    
    if (sectionId) {
      url += `sectionId=${sectionId}&`;
    }
    
    const query = searchParams.get('busca');
    if (query) {
      url += `search=${encodeURIComponent(query)}&`;
    }
    
    if (minPrice) url += `minPrice=${minPrice}&`;
    if (maxPrice) url += `maxPrice=${maxPrice}&`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        // Sort products client-side
        const sorted = sortProducts(data, sortOrder);
        setProducts(sorted);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [sectionId, searchParams, sortOrder, minPrice, maxPrice]);

  const sortProducts = (list, order) => {
    const listCopy = [...list];
    if (order === 'name-asc') {
      return listCopy.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (order === 'name-desc') {
      return listCopy.sort((a, b) => b.name.localeCompare(a.name));
    }
    if (order === 'price-asc') {
      return listCopy.sort((a, b) => a.price - b.price);
    }
    if (order === 'price-desc') {
      return listCopy.sort((a, b) => b.price - a.price);
    }
    return listCopy;
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(searchQuery ? { busca: searchQuery } : {});
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setSortOrder('name-asc');
    setSearchParams({});
  };

  const activeSection = sections.find(s => s.id === sectionId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Title & Breadcrumbs */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
          {activeSection ? activeSection.name : 'Catálogo de Produtos'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {activeSection ? `Explorando itens na seção ${activeSection.name}` : 'Explore toda a nossa gama de equipamentos para soldagem'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-950 font-bold uppercase text-sm">
            <SlidersHorizontal size={18} className="text-amber-500" />
            <span>Filtros & Busca</span>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Palavra-chave</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: MIG-250..."
                className="w-full text-sm pl-3 pr-10 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute right-3 top-2.5 text-slate-400">
                <Search size={16} />
              </button>
            </div>
          </form>

          {/* Sort Order Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ordenar por</label>
            <select
              className="w-full text-sm py-2 px-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="name-asc">Nome (A - Z)</option>
              <option value="name-desc">Nome (Z - A)</option>
              <option value="price-asc">Menor Preço</option>
              <option value="price-desc">Maior Preço</option>
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Faixa de Preço (R$)</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Mín"
                className="w-1/2 text-sm px-3 py-2 border border-slate-200 rounded-xl"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input
                type="number"
                placeholder="Máx"
                className="w-1/2 text-sm px-3 py-2 border border-slate-200 rounded-xl"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={handleClearFilters}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Limpar Filtros
          </button>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
              <RefreshCw size={36} className="animate-spin text-amber-500" />
              <p className="text-sm font-semibold">Buscando catálogo no banco...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => {
                const images = JSON.parse(product.images || '[]');
                const mainImg = images[0] || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&auto=format&fit=crop&q=80';
                
                return (
                  <div key={product.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <div className="relative aspect-video bg-slate-100 overflow-hidden">
                        <img
                          src={mainImg}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {product.stock <= 0 && (
                          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase shadow">
                            Fora de Estoque
                          </div>
                        )}
                      </div>

                      <div className="p-5 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{product.section?.name}</p>
                        <h3 className="text-base font-bold text-slate-900 line-clamp-2 group-hover:text-amber-600 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs text-slate-400">SKU: {product.sku}</p>
                      </div>
                    </div>

                    <div className="p-5 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div>
                        <p className="text-[10px] text-slate-400">Valor Estimado</p>
                        <p className="text-base font-black text-slate-900">
                          {product.price > 0 ? `R$ ${product.price.toFixed(2)}` : 'Sob Consulta'}
                        </p>
                      </div>
                      <Link
                        to={`/produto/${product.sku}`}
                        className="bg-slate-950 hover:bg-amber-500 text-white hover:text-slate-900 p-2.5 rounded-xl transition-colors shadow-sm"
                      >
                        <Eye size={18} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4">
              <p className="text-lg text-slate-500 font-bold">Nenhum produto encontrado.</p>
              <p className="text-sm text-slate-400">Tente buscar por termos diferentes ou selecione outra categoria.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
