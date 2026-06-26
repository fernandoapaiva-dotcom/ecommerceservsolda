import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, RefreshCw } from 'lucide-react';

export default function AdminBanners() {
  const { token } = useAuth();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form Fields
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState('0');
  const [active, setActive] = useState(true);

  const fetchBanners = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/banners')
      .then(res => res.json())
      .then(data => setBanners(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/banners', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image,
          link,
          title,
          order: parseInt(order) || 0,
          active
        })
      });

      if (!res.ok) {
        throw new Error('Falha ao criar banner');
      }

      setImage('');
      setLink('');
      setTitle('');
      setOrder('0');
      setActive(true);
      fetchBanners();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este banner?')) return;
    setError('');

    try {
      const res = await fetch(`http://localhost:5000/api/banners/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Falha ao excluir banner');
      }

      fetchBanners();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-10">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase">Banners Rotativos</h1>
          <p className="text-slate-500 text-xs">Configure banners com títulos e links especiais para a página principal</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3.5 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Create Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-100 pb-2">Novo Banner</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-600">
              <div className="space-y-1">
                <label className="uppercase tracking-wider">Imagem de Fundo (URL)</label>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com..."
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="uppercase tracking-wider">Título Sobreposto (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Oferta Máquina MIG"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="uppercase tracking-wider">Link de Destino (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: /secao/maquinas"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="uppercase tracking-wider">Ordem de Exibição</label>
                <input
                  type="number"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="banner-active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500"
                />
                <label htmlFor="banner-active" className="cursor-pointer">Banner Ativo</label>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-900 font-bold py-2.5 rounded-xl transition-colors uppercase tracking-wider text-xs"
              >
                Criar Banner
              </button>
            </form>
          </div>

          {/* Banner list */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 font-bold text-slate-900 text-sm uppercase tracking-wider">
              Banners Ativos
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
                <RefreshCw size={20} className="animate-spin text-amber-500" />
                <span className="text-xs">Carregando banners...</span>
              </div>
            ) : banners.length > 0 ? (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map(banner => (
                  <div key={banner.id} className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm aspect-video bg-slate-900 group">
                    <img src={banner.image} alt={banner.title} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform" />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-4">
                      {banner.title && <p className="text-xs font-bold text-white leading-tight">{banner.title}</p>}
                      {banner.link && <p className="text-[10px] text-amber-500 mt-1">{banner.link}</p>}
                    </div>

                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="absolute top-2.5 right-2.5 bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl transition-colors shadow"
                      title="Deletar Banner"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                Nenhum banner cadastrado.
              </div>
            )}
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
