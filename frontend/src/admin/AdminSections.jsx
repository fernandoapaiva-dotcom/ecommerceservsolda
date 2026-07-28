import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, ArrowUp, ArrowDown, RefreshCw, Check } from 'lucide-react';

export default function AdminSections() {
  const { token } = useAuth();
  
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create / Edit Form States
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [icon, setIcon] = useState('');
  const [active, setActive] = useState(true);
  const [parentId, setParentId] = useState('');

  const fetchSections = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/sections')
      .then(res => res.json())
      .then(data => setSections(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    navigateSectionIfRequired();
  }, []);

  const navigateSectionIfRequired = () => {
    fetchSections();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const body = { name, image, icon, active, parentId: parentId || null };
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId 
      ? `http://localhost:5000/api/sections/${editingId}` 
      : 'http://localhost:5000/api/sections';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar seção');
      }

      // Reset Form
      setName('');
      setImage('');
      setIcon('');
      setActive(true);
      setParentId('');
      setEditingId(null);
      fetchSections();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditClick = (section) => {
    setEditingId(section.id);
    setName(section.name);
    setImage(section.image || '');
    setIcon(section.icon || '');
    setActive(section.active);
    setParentId(section.parentId || '');
  };

  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    fetch('http://localhost:5000/api/uploads', {
      method: 'POST',
      body: formData
    })
    .then(r => r.json())
    .then(data => setIcon(data.url))
    .catch(err => console.error("Error uploading section icon:", err));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta seção?')) return;
    setError('');

    try {
      const res = await fetch(`http://localhost:5000/api/sections/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao excluir seção');
      }

      fetchSections();
    } catch (err) {
      setError(err.message);
    }
  };

  const buildTree = (list) => {
    const map = {};
    const roots = [];
    list.forEach(item => {
      map[item.id] = { ...item, children: [] };
    });
    list.forEach(item => {
      if (item.parentId && map[item.parentId]) {
        map[item.parentId].children.push(map[item.id]);
      } else {
        roots.push(map[item.id]);
      }
    });
    return roots;
  };

  const getFlattenedTree = (roots, depth = 0) => {
    let result = [];
    roots.forEach(node => {
      result.push({ ...node, depth });
      if (node.children && node.children.length > 0) {
        result.push(...getFlattenedTree(node.children, depth + 1));
      }
    });
    return result;
  };

  const treeRoots = buildTree(sections);
  const flatSections = getFlattenedTree(treeRoots);

  // Reorder Sections via buttons (Drag and drop reorder logic simplified with direct Order triggers)
  const moveSection = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= flatSections.length) return;

    const items = [...flatSections];
    const temp = items[index].order;
    
    // Swap Order attributes
    items[index].order = items[newIndex].order;
    items[newIndex].order = temp;

    // Call API Reorder
    try {
      const res = await fetch('http://localhost:5000/api/sections/reorder', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orders: [
            { id: items[index].id, order: items[index].order },
            { id: items[newIndex].id, order: items[newIndex].order }
          ]
        })
      });

      if (res.ok) {
        fetchSections();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-10">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase">Gerenciamento de Seções</h1>
          <p className="text-slate-500 text-xs">Adicione, edite ou altere a ordem das categorias exibidas no menu principal</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3.5 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Create Section Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-100 pb-2">
              {editingId ? 'Editar Seção' : 'Nova Seção'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome da Categoria</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Máquinas de Solda"
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria Superior (Pai)</label>
                <select
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                >
                  <option value="">Nenhuma (Categoria Principal)</option>
                  {sections
                    .filter(s => s.id !== editingId)
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))
                  }
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Imagem de Capa (URL)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com..."
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ícone da Seção (Upload)</label>
                <input
                  type="file"
                  accept="image/png, image/svg+xml, image/jpeg"
                  className="w-full text-xs px-3.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer"
                  onChange={handleIconUpload}
                />
                {icon && <span className="text-[10px] text-neutral block truncate">Salvo em: {icon}</span>}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="section-active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <label htmlFor="section-active" className="text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer">
                  Categoria Ativa no Site
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-primary/50 text-white hover:text-slate-900 font-bold py-2.5 rounded-xl text-xs transition-colors uppercase tracking-wider"
                >
                  {editingId ? 'Atualizar' : 'Criar Seção'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setName('');
                      setImage('');
                      setIcon('');
                      setActive(true);
                      setParentId('');
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Sections List */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 font-bold text-slate-900 text-sm uppercase tracking-wider">
              Categorias Cadastradas
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-neutral">
                <RefreshCw size={20} className="animate-spin text-primary" />
                <span className="text-xs font-semibold">Carregando seções...</span>
              </div>
            ) : flatSections.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {flatSections.map((section, idx) => (
                  <div key={section.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors" style={{ paddingLeft: `${16 + section.depth * 24}px` }}>
                    <div className="flex items-center gap-3">
                      {section.image && (
                        <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                          <img src={section.image} alt={section.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      {section.icon && (
                        <div className="w-8 h-8 bg-slate-50 rounded-lg overflow-hidden border border-slate-200 p-1 flex items-center justify-center">
                          <img src={`http://localhost:5000${section.icon}`} alt="" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 flex items-center">
                          {section.depth > 0 && <span className="text-slate-400 font-mono mr-1.5">└─ </span>}
                          {section.name}
                        </p>
                        <p className="text-[10px] text-neutral mt-0.5">Ordem: {section.order}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Active Status Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${section.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {section.active ? 'Ativa' : 'Inativa'}
                      </span>

                      {/* Reorder Buttons */}
                      <button
                        onClick={() => moveSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg disabled:opacity-30"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => moveSection(idx, 'down')}
                        disabled={idx === flatSections.length - 1}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg disabled:opacity-30"
                      >
                        <ArrowDown size={14} />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditClick(section)}
                        className="px-2.5 py-1.5 bg-primary/5 hover:bg-primary/10 text-accent font-bold rounded-lg"
                      >
                        Editar
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(section.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-neutral">
                Nenhuma seção cadastrada.
              </div>
            )}
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
