import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Edit, RefreshCw, AlertCircle, Wand2 } from 'lucide-react';
const Youtube = (props) => <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.388.555A3.002 3.002 0 0 0 .502 6.163C0 8.07 0 12 0 12s0 3.93.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.47 20.5 12 20.5 12 20.5s7.53 0 9.388-.555a3.002 3.002 0 0 0 2.11-2.108C24 15.93 24 12 24 12s0-3.93-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;

export default function AdminProducts() {
  const { token } = useAuth();

  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // AI assistant loading state
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchAiLoading, setBatchAiLoading] = useState(false);
  const [batchAiStatus, setBatchAiStatus] = useState('');

  const handleToggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.id));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleBatchEnrich = async (overrideIds = null) => {
    const idsToEnrich = overrideIds || (selectedIds.length > 0 ? selectedIds : products.map(p => p.id));
    if (!idsToEnrich || idsToEnrich.length === 0) {
      setError('Nenhum produto disponível para enriquecer com IA.');
      return;
    }

    setBatchAiLoading(true);
    setError('');
    setSuccess('');
    setBatchAiStatus(`Iniciando enriquecimento por IA para ${idsToEnrich.length} produto(s)... A IA está buscando descrições técnicas, fotos com marca d'água, manuais e vídeos.`);

    try {
      const res = await fetch('http://localhost:5000/api/ai/batch-enrich', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productIds: idsToEnrich })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro no processamento da IA');
      }

      setSuccess(`✨ IA concluiu o enriquecimento! ${data.results.successCount} produto(s) atualizados com descrições técnicas, fotos com marca d'água ServSolda, manuais em PDF e vídeos do YouTube.`);
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setBatchAiLoading(false);
      setBatchAiStatus('');
    }
  };

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
  const [referenceUrl, setReferenceUrl] = useState('');

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
      setReferenceUrl('');
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
      setReferenceUrl('');
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
        body: JSON.stringify({ productName: name, productUrl: referenceUrl })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro na resposta do assistente de IA.');
      }

      // Populate description, technical specifications, meta description and tags
      setDescription(data.description || '');
      setSpecs(data.specs || []);
      setMetaDesc(data.metaDescription || '');
      setMetaTitle(`${name} | ServSolda`);
      setWarranty(data.warranty || '');
      if (data.sectionId) {
        setSectionId(data.sectionId);
      }
      if (data.images && data.images.length > 0) {
        setImages(data.images);
      }
      if (data.pdfs && data.pdfs.length > 0) {
        setPdfs(data.pdfs);
      }
      if (data.videos && data.videos.length > 0) {
        setVideos(data.videos);
      }
      setSuccess('Descrição, especificações, categoria, imagens com marca d\'água, PDFs de manuais e vídeos de demonstração gerados autonomamente pela IA com sucesso! Revise tudo abaixo.');
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
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-primary/50 text-white hover:text-slate-900 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors uppercase tracking-wider shadow"
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
              <div className="bg-primary/5 border border-border p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-accent text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Wand2 size={14} />
                    <span>Assistente de Cadastro e Importação Autônoma com IA</span>
                  </p>
                  <button
                    type="button"
                    onClick={handleAISpecsGeneration}
                    disabled={aiLoading}
                    className="bg-primary/50 hover:bg-accent text-slate-900 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    {aiLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Importando Dados...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={14} />
                        <span>Preencher com IA</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nome do Produto</label>
                    <input
                      type="text"
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl bg-white"
                      placeholder="Ex: Rogue LHN ES 305i"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">URL do Produto no Fabricante (Opcional - Recomendado para Precisão)</label>
                    <input
                      type="text"
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl bg-white font-mono"
                      placeholder="Cole o link da página do produto (ex: https://esab.com/...)"
                      value={referenceUrl}
                      onChange={(e) => setReferenceUrl(e.target.value)}
                    />
                  </div>
                </div>
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
                    className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800"
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                  >
                    {(() => {
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

                      const flatSections = getFlattenedTree(buildTree(sections));
                      return flatSections.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.depth > 0 ? '\u00A0\u00A0'.repeat(s.depth) + '└─ ' : ''}{s.name}
                        </option>
                      ));
                    })()}
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
              <div className="space-y-4 border border-slate-200 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 uppercase">Imagens do Produto (URLs & Pré-visualização)</p>
                  <button
                    type="button"
                    onClick={() => setImages([...images, ''])}
                    className="text-xs font-bold text-accent uppercase"
                  >
                    + Adicionar Foto
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="flex gap-3 items-start border border-slate-100 p-3 rounded-xl bg-slate-50">
                      {/* Live Image Preview Thumbnail */}
                      <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 flex items-center justify-center">
                        {img && img.startsWith('http') ? (
                          <img src={img} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Sem Foto</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">URL da Imagem {idx + 1}</label>
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="text"
                            className="flex-1 text-xs px-3.5 py-2 border border-slate-200 rounded-xl bg-white"
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
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                  className="text-xs font-bold text-accent uppercase mt-1"
                >
                  + Adicionar Linha
                </button>
              </div>

              {/* PDF Documents */}
              <div className="space-y-4 border border-slate-200 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 uppercase">Manuais e Laudos Técnicos (PDFs)</p>
                  <button
                    type="button"
                    onClick={() => setPdfs([...pdfs, { title: '', url: '' }])}
                    className="text-xs font-bold text-accent uppercase"
                  >
                    + Adicionar PDF
                  </button>
                </div>
                <div className="space-y-3">
                  {pdfs.map((pdf, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-2 items-end md:items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="w-full md:w-1/3 space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Título</label>
                        <input
                          type="text"
                          placeholder="Manual Técnico"
                          className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                          value={pdf.title}
                          onChange={(e) => {
                            const newPdfs = [...pdfs];
                            newPdfs[idx].title = e.target.value;
                            setPdfs(newPdfs);
                          }}
                        />
                      </div>
                      <div className="w-full md:flex-1 space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">URL do arquivo PDF</label>
                        <input
                          type="text"
                          placeholder="https://exemplo.com/manual.pdf"
                          className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl bg-white"
                          value={pdf.url}
                          onChange={(e) => {
                            const newPdfs = [...pdfs];
                            newPdfs[idx].url = e.target.value;
                            setPdfs(newPdfs);
                          }}
                        />
                      </div>
                      <div className="flex gap-2 items-center pt-2 md:pt-0">
                        {pdf.url && pdf.url.startsWith('http') && (
                          <a
                            href={pdf.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg uppercase transition-all"
                          >
                            Visualizar
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setPdfs(pdfs.filter((_, i) => i !== idx))}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* YouTube Videos */}
              <div className="space-y-4 border border-slate-200 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 uppercase">Vídeos de Demonstração (YouTube)</p>
                  <button
                    type="button"
                    onClick={() => setVideos([...videos, { title: '', url: '' }])}
                    className="text-xs font-bold text-accent uppercase"
                  >
                    + Adicionar Vídeo
                  </button>
                </div>
                <div className="space-y-4">
                  {videos.map((vid, idx) => {
                    const videoId = vid.url ? vid.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/)?.[1] : null;
                    return (
                      <div key={idx} className="flex flex-col md:flex-row gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 items-start">
                        {/* Live YouTube Iframe Preview */}
                        <div className="w-full md:w-48 aspect-video bg-slate-200 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 flex items-center justify-center relative">
                          {videoId ? (
                            <iframe
                              title={vid.title}
                              src={`https://www.youtube.com/embed/${videoId}`}
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              allowFullScreen
                            />
                          ) : (
                            <div className="text-[10px] text-slate-400 font-bold uppercase flex flex-col items-center gap-1.5 p-4 text-center">
                              <Youtube size={24} className="text-slate-300" />
                              <span>Insira uma URL do YouTube para pré-visualizar</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-3 w-full">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Título do Vídeo</label>
                              <input
                                type="text"
                                placeholder="Review do Produto"
                                className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl bg-white"
                                value={vid.title}
                                onChange={(e) => {
                                  const newVids = [...videos];
                                  newVids[idx].title = e.target.value;
                                  setVideos(newVids);
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">URL do Vídeo</label>
                              <div className="flex gap-1.5 items-center">
                                <input
                                  type="text"
                                  placeholder="https://www.youtube.com/watch?v=..."
                                  className="flex-1 text-xs px-3.5 py-2 border border-slate-200 rounded-xl bg-white"
                                  value={vid.url}
                                  onChange={(e) => {
                                    const newVids = [...videos];
                                    newVids[idx].url = e.target.value;
                                    setVideos(newVids);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setVideos(videos.filter((_, i) => i !== idx))}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                  className="bg-slate-900 hover:bg-primary/50 text-white hover:text-slate-900 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider"
                >
                  Salvar Produto
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Batch AI Progress Status Banner */}
        {batchAiLoading && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />
              <div>
                <p className="text-xs font-black text-amber-900 uppercase tracking-wider">Assistente de IA em Execução</p>
                <p className="text-xs text-amber-700 font-medium">{batchAiStatus}</p>
              </div>
            </div>
          </div>
        )}

        {/* Products List Panel */}
        {!isFormOpen && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                  Catálogo de Produtos ({products.length})
                </h3>
                {selectedIds.length > 0 && (
                  <p className="text-xs text-amber-700 font-semibold mt-0.5">
                    {selectedIds.length} produto(s) selecionado(s)
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBatchEnrich()}
                  disabled={batchAiLoading || products.length === 0}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  title="A IA irá pesquisar especificações técnicas, fotos com marca d'água ServSolda, manuais em PDF e vídeos no YouTube"
                >
                  <Wand2 size={15} />
                  <span>
                    {selectedIds.length > 0
                      ? `Enriquecer (${selectedIds.length}) com IA`
                      : 'Enriquecer Todos com IA'}
                  </span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-neutral">
                <RefreshCw size={24} className="animate-spin text-primary" />
                <span className="text-sm font-semibold">Buscando catálogo...</span>
              </div>
            ) : products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="w-10 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          checked={selectedIds.length > 0 && selectedIds.length === products.length}
                          onChange={handleToggleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">SKU</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Produto</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Preço</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Estoque</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Conteúdo IA</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {products.map(prod => {
                      const hasImages = prod.images && (Array.isArray(prod.images) ? prod.images.length > 0 : JSON.parse(prod.images || '[]').length > 0);
                      const hasPdfs = prod.pdfs && (Array.isArray(prod.pdfs) ? prod.pdfs.length > 0 : JSON.parse(prod.pdfs || '[]').length > 0);
                      const hasVideos = prod.videos && (Array.isArray(prod.videos) ? prod.videos.length > 0 : JSON.parse(prod.videos || '[]').length > 0);
                      const isSelected = selectedIds.includes(prod.id);

                      return (
                        <tr key={prod.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-amber-50/50' : ''}`}>
                          <td className="w-10 px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOne(prod.id)}
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap font-bold text-slate-900">{prod.sku}</td>
                          <td className="px-4 py-4 font-semibold text-slate-800">
                            <div>{prod.name}</div>
                            {prod.warranty && (
                              <div className="text-[10px] text-amber-700 font-medium">🛡️ {prod.warranty}</div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap font-bold text-slate-900">R$ {prod.price.toFixed(2)}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-slate-500">{prod.stock} un.</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {hasImages ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold" title="Imagens com marca d'água anexadas">
                                  📷 Foto
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px]" title="Sem imagem">
                                  📷 Sem Foto
                                </span>
                              )}
                              {hasPdfs && (
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold" title="Manual PDF cadastrado">
                                  📄 PDF
                                </span>
                              )}
                              {hasVideos && (
                                <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold" title="Vídeo do YouTube cadastrado">
                                  ▶️ Vídeo
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleBatchEnrich([prod.id])}
                                disabled={batchAiLoading}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-bold flex items-center gap-1 text-[11px]"
                                title="Enriquecer este produto com IA"
                              >
                                <Wand2 size={14} />
                                <span>IA</span>
                              </button>
                              <button
                                onClick={() => handleOpenForm(prod)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
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
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-neutral">
                Nenhum produto cadastrado no catálogo.
              </div>
            )}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
