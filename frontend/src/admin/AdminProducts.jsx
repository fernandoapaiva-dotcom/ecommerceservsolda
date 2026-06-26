import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Edit, RefreshCw, AlertCircle, Wand2 } from 'lucide-react';

export default function AdminProducts() {
  const { token } = useAuth();

  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // AI assistant loading state
  const [aiLoading, setAiLoading] = useState(false);

  // Form Mode
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [sectionId, setSectionId] = useState('');
  const [warranty, setWarranty] = useState('');
  
  // JSON arrays states
  const [images, setImages] = useState(['']);
  const [specs, setSpecs] = useState([{ key: '', value: '' }]);
  const [pdfs, setPdfs] = useState([{ title: '', url: '' }]);
  const [videos, setVideos] = useState([{ title: '', url: '' }]);
  
  // SEO fields
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');

  const fetchProducts = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/products?status=ALL')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
    // Load sections for selector
    fetch('http://localhost:5000/api/sections')
      .then(res => res.json())
      .then(data => {
        setSections(data);
        if (data.length > 0) setSectionId(data[0].id);
      })
      .catch(err => console.error(err));
  }, []);

  const handleOpenForm = (prod = null) => {
    setError('');
    setSuccess('');
    if (prod) {
      setEditingId(prod.id);
      setSku(prod.sku);
      setName(prod.name);
      setPrice(prod.price);
      setStock(prod.stock);
      setDescription(prod.description);
      setStatus(prod.status);
      setSectionId(prod.sectionId);
      setImages(JSON.parse(prod.images || '[]'));
      setSpecs(JSON.parse(prod.specs || '[]'));
      setPdfs(JSON.parse(prod.pdfs || '[]'));
      setVideos(JSON.parse(prod.videos || '[]'));
      setMetaTitle(prod.metaTitle || '');
      setMetaDesc(prod.metaDesc || '');
      setWarranty(prod.warranty || '');
    } else {
      setEditingId(null);
      setSku('');
      setName('');
      setPrice('');
      setStock('0');
      setDescription('');
      setStatus('ACTIVE');
      setImages(['']);
      setSpecs([{ key: '', value: '' }]);
      setPdfs([]);
      setVideos([]);
      setMetaTitle('');
      setMetaDesc('');
      setWarranty('');
      if (sections.length > 0) setSectionId(sections[0].id);
    }
    setIsFormOpen(true);
  };

  const handleAISpecsGeneration = async () => {
    if (!name) {
      setError('Por favor, insira o nome do produto antes de gerar a descrição com IA.');
      return;
    }
    setAiLoading(true);
    setError('');
    
    try {
      const res = await fetch('http://localhost:5000/api/ai/generate-description', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productName: name })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro na resposta do assistente de IA.');
      }

      // Populate description, technical specifications, meta description and tags
      setDescription(data.description || '');
      setSpecs(data.specs || []);
      setMetaDesc(data.metaDescription || '');
      setMetaTitle(`${name} | ServoSolda`);
      setSuccess('Descrição e especificações geradas pela inteligência artificial com sucesso! Revise os campos abaixo.');
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Clean arrays from empty values
    const cleanImages = images.filter(i => i.trim() !== '');
    const cleanSpecs = specs.filter(s => s.key.trim() !== '' && s.value.trim() !== '');
    const cleanPdfs = pdfs.filter(p => p.title.trim() !== '' && p.url.trim() !== '');
    const cleanVideos = videos.filter(v => v.title.trim() !== '' && v.url.trim() !== '');

    const body = {
      sku,
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
      description,
      status,
      sectionId,
      images: cleanImages,
      specs: cleanSpecs,
      pdfs: cleanPdfs,
      videos: cleanVideos,
      metaTitle,
      metaDesc,
      warranty
    };

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId 
      ? `http://localhost:5000/api/products/${editingId}` 
      : 'http://localhost:5000/api/products';

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
        throw new Error(data.error || 'Erro ao salvar produto');
      }

      setSuccess('Produto salvo com sucesso!');
      setIsFormOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este produto?')) return;
    setError('');

    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Falha ao excluir produto');
      }

      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-10">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase">Produtos do Catálogo</h1>
            <p className="text-slate-500 text-xs">Crie, gerencie, adicione manuais e descrições com inteligência artificial</p>
          </div>
          {!isFormOpen && (
            <button
              onClick={() => handleOpenForm()}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-900 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors uppercase tracking-wider shadow"
            >
              <Plus size={16} />
              <span>Novo Produto</span>
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3.5 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl p-3.5 text-xs font-semibold">
            {success}
          </div>
        )}

        {/* Form Modal / Overlay view */}
        {isFormOpen && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-100 pb-2">
              {editingId ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 text-sm text-slate-700">
              
              {/* Product AI Description Helper Box */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-amber-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Wand2 size={14} />
                    <span>Assistente de Descrição com IA</span>
                  </p>
                  <p className="text-slate-600 text-xs mt-1">Preencha o "Nome do Produto", clique no botão e nós faremos a pesquisa de mercado e estruturaremos a cotação.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAISpecsGeneration}
                  disabled={aiLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 size={14} />
                      <span>Gerar com IA</span>
                    </>
                  )}
                </button>
              </div>

              {/* Main Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SKU / Código Único</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MIG-250"
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Comercial do Produto</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Máquina de Solda MIG/MAG 250A Flex"
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preço de Tabela (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 2490.00"
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estoque Local (Softsystem ERP)</label>
                  <input
                    type="number"
                    required
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seção / Categoria</label>
                  <select
                    className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl bg-white"
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                  >
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description HTML rich editor simulator */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição Comercial (Rich Text / HTML)</label>
                <textarea
                  rows="6"
                  className="w-full text-xs p-3.5 border border-slate-200 rounded-xl font-mono focus:outline-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Warranty Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Garantia do Produto (Termos de Garantia)</label>
                <textarea
                  rows="3"
                  placeholder="Ex: 1 ano de garantia de fábrica contra qualquer defeito."
                  className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                />
              </div>

              {/* Photos Gallery */}
              <div className="space-y-2 border border-slate-200 p-4 rounded-xl">
                <p className="text-xs font-bold text-slate-900 uppercase">Imagens do Produto (URLs)</p>
                {images.map((img, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      className="flex-1 text-xs px-3.5 py-2 border border-slate-200 rounded-xl"
                      value={img}
                      onChange={(e) => {
                        const newImages = [...images];
                        newImages[idx] = e.target.value;
                        setImages(newImages);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      className="p-2 text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setImages([...images, ''])}
                  className="text-xs font-bold text-amber-600 uppercase mt-1"
                >
                  + Adicionar Foto
                </button>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-2 border border-slate-200 p-4 rounded-xl">
                <p className="text-xs font-bold text-slate-900 uppercase">Especificações Técnicas (Tabela)</p>
                {specs.map((spec, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Chave (Ex: Tensão)"
                      className="w-1/2 text-xs px-3.5 py-2 border border-slate-200 rounded-xl"
                      value={spec.key}
                      onChange={(e) => {
                        const newSpecs = [...specs];
                        newSpecs[idx].key = e.target.value;
                        setSpecs(newSpecs);
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Valor (Ex: 220V)"
                      className="w-1/2 text-xs px-3.5 py-2 border border-slate-200 rounded-xl"
                      value={spec.value}
                      onChange={(e) => {
                        const newSpecs = [...specs];
                        newSpecs[idx].value = e.target.value;
                        setSpecs(newSpecs);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setSpecs(specs.filter((_, i) => i !== idx))}
                      className="p-2 text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSpecs([...specs, { key: '', value: '' }])}
                  className="text-xs font-bold text-amber-600 uppercase mt-1"
                >
                  + Adicionar Linha
                </button>
              </div>

              {/* PDF Documents */}
              <div className="space-y-2 border border-slate-200 p-4 rounded-xl">
                <p className="text-xs font-bold text-slate-900 uppercase">Manuais e Laudos Técnicos (PDFs)</p>
                {pdfs.map((pdf, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Título (Ex: Manual Técnico)"
                      className="w-1/2 text-xs px-3.5 py-2 border border-slate-200 rounded-xl"
                      value={pdf.title}
                      onChange={(e) => {
                        const newPdfs = [...pdfs];
                        newPdfs[idx].title = e.target.value;
                        setPdfs(newPdfs);
                      }}
                    />
                    <input
                      type="text"
                      placeholder="URL do arquivo PDF"
                      className="w-1/2 text-xs px-3.5 py-2 border border-slate-200 rounded-xl"
                      value={pdf.url}
                      onChange={(e) => {
                        const newPdfs = [...pdfs];
                        newPdfs[idx].url = e.target.value;
                        setPdfs(newPdfs);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setPdfs(pdfs.filter((_, i) => i !== idx))}
                      className="p-2 text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPdfs([...pdfs, { title: '', url: '' }])}
                  className="text-xs font-bold text-amber-600 uppercase mt-1"
                >
                  + Adicionar PDF
                </button>
              </div>

              {/* SEO and Tags */}
              <div className="space-y-4 border border-slate-200 p-4 rounded-xl">
                <p className="text-xs font-bold text-slate-900 uppercase">Otimização SEO (Helmet & Google)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Meta Title</label>
                    <input
                      type="text"
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Meta Description</label>
                    <input
                      type="text"
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl"
                      value={metaDesc}
                      onChange={(e) => setMetaDesc(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-900 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider"
                >
                  Salvar Produto
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Products List Panel */}
        {!isFormOpen && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 font-bold text-slate-900 text-sm uppercase tracking-wider">
              Catálogo de Produtos Cadastrados
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
                <RefreshCw size={24} className="animate-spin text-amber-500" />
                <span className="text-sm font-semibold">Buscando catálogo...</span>
              </div>
            ) : products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Produto</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Preço</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Estoque</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {products.map(prod => (
                      <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">{prod.sku}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{prod.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">R$ {prod.price.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">{prod.stock} un.</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            prod.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                            prod.status === 'FEATURED' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {prod.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenForm(prod)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg"
                            title="Editar"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                Nenhum produto cadastrado no catálogo.
              </div>
            )}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
