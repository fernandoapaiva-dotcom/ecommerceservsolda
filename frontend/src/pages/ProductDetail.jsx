import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, RefreshCw, FileText, Check, Star } from 'lucide-react';
const Youtube = (props) => <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.388.555A3.002 3.002 0 0 0 .502 6.163C0 8.07 0 12 0 12s0 3.93.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.47 20.5 12 20.5 12 20.5s7.53 0 9.388-.555a3.002 3.002 0 0 0 2.11-2.108C24 15.93 24 12 24 12s0-3.93-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { Helmet } from 'react-helmet-async';

export default function ProductDetail() {
  const { sku } = useParams();
  const { addToCart } = useCart();
  const { user, token } = useAuth();
  const { config } = useConfig();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [successAdded, setSuccessAdded] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/products/${sku}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setReviewsList(data.reviews || []);
        setActiveImageIdx(0);
        // Load related items (products from the same section)
        if (data.sectionId) {
          fetch(`http://localhost:5000/api/products?sectionId=${data.sectionId}`)
            .then(r => r.json())
            .then(all => {
              setRelatedProducts(all.filter(p => p.sku !== data.sku).slice(0, 4));
            });
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [sku]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setReviewError('Você precisa fazer login para avaliar.');
      return;
    }
    setReviewError('');
    setReviewSuccess('');
    setSubmittingReview(true);

    try {
      const res = await fetch(`http://localhost:5000/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || 'Erro ao salvar avaliação.');
      } else {
        setReviewSuccess('Avaliação enviada com sucesso!');
        setComment('');
        setRating(5);
        setReviewsList(prev => [data, ...prev]);
      }
    } catch (err) {
      setReviewError('Erro ao enviar avaliação.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, qty);
      setSuccessAdded(true);
      setTimeout(() => setSuccessAdded(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-slate-400">
        <RefreshCw size={40} className="animate-spin text-amber-500" />
        <p className="text-sm font-semibold">Carregando detalhes do produto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Produto não encontrado</h2>
        <p className="text-sm text-slate-500">O produto com SKU {sku} não existe ou foi removido do catálogo.</p>
        <Link to="/produtos" className="inline-block bg-amber-500 text-slate-900 font-bold px-6 py-2.5 rounded-full text-sm">
          Voltar ao Catálogo
        </Link>
      </div>
    );
  }

  const images = JSON.parse(product.images || '[]');
  const specs = JSON.parse(product.specs || '[]');
  const pdfs = JSON.parse(product.pdfs || '[]');
  const videos = JSON.parse(product.videos || '[]');

  // Schema.org Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": images[0] || "",
    "description": product.metaDesc || product.name,
    "sku": product.sku,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "BRL",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "ServoSolda"
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Dynamic SEO Head Tags */}
      <Helmet>
        <title>{product.metaTitle || `${product.name} | ServoSolda`}</title>
        <meta name="description" content={product.metaDesc || `Adquira ${product.name} na ServoSolda. Preços especiais para faturamento B2B.`} />
        <meta property="og:title" content={product.metaTitle || product.name} />
        <meta property="og:description" content={product.metaDesc || product.name} />
        {images[0] && <meta property="og:image" content={images[0]} />}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Main product specs grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-video w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
            <img
              src={images[activeImageIdx] || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80'}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {product.stock <= 0 && (
              <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-black tracking-widest px-3 py-1 rounded-full uppercase shadow">
                Fora de Estoque
              </div>
            )}
          </div>
          
          {/* Thumbnails row */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`aspect-video w-24 bg-slate-100 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImageIdx === idx ? 'border-amber-500' : 'border-slate-200'}`}
                >
                  <img src={img} alt={`thumbnail-${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product core specs */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full border border-slate-200 uppercase">
                {product.section?.name || 'Geral'}
              </span>
              <span className="text-xs text-slate-400 font-medium">SKU: {product.sku}</span>
              {reviewsList.length > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-slate-700">{averageRating}</span>
                  <span className="text-xs text-slate-400">({reviewsList.length})</span>
                </div>
              )}
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>
          </div>

          <div className="border-y border-slate-200 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400">Preço de Referência</p>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {product.price > 0 ? `R$ ${product.price.toFixed(2)}` : 'Sob Consulta'}
              </p>
              {product.price > 0 && config && config.installmentCount > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  ou R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em até {config.installmentCount}x de R$ {(product.price / config.installmentCount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {config.installmentInterest ? 'com juros' : 'sem juros'}
                </p>
              )}
            </div>

            {/* Qty & Add to Cart */}
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-3.5 py-2 hover:bg-slate-200 text-slate-600 transition-colors font-extrabold text-base"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-bold text-slate-800 bg-white border-x border-slate-200 w-12 text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  className="px-3.5 py-2 hover:bg-slate-200 text-slate-600 transition-colors font-extrabold text-base"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0 && product.price <= 0}
                className={`flex-1 flex items-center justify-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md ${
                  successAdded 
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                    : 'bg-amber-500 hover:bg-amber-600 text-slate-900 hover:shadow-amber-500/10'
                }`}
              >
                {successAdded ? (
                  <>
                    <Check size={18} />
                    <span>Adicionado!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    <span>Adicionar ao Carrinho</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Specifications */}
          {specs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Características Principais</h3>
              <div className="grid grid-cols-2 gap-4">
                {specs.slice(0, 4).map((spec, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{spec.key}</p>
                    <p className="text-xs text-slate-800 font-semibold mt-0.5">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Tabs Menu [Description | Specifications | PDFs | YouTube Videos | Garantia | Avaliações] */}
      <div className="space-y-6">
        <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('description')}
            className={`py-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-all uppercase tracking-wider flex-shrink-0 ${activeTab === 'description' ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Descrição
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-all uppercase tracking-wider flex-shrink-0 ${activeTab === 'specs' ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Especificações Técnicas
          </button>
          <button
            onClick={() => setActiveTab('pdfs')}
            className={`py-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-all uppercase tracking-wider flex-shrink-0 ${activeTab === 'pdfs' ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Manuais
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`py-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-all uppercase tracking-wider flex-shrink-0 ${activeTab === 'videos' ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Vídeos
          </button>
          <button
            onClick={() => setActiveTab('warranty')}
            className={`py-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-all uppercase tracking-wider flex-shrink-0 ${activeTab === 'warranty' ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Garantia
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-all uppercase tracking-wider flex-shrink-0 ${activeTab === 'reviews' ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Avaliações ({reviewsList.length})
          </button>
        </div>

        {/* Tab contents */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[160px]">
          
          {activeTab === 'description' && (
            <div 
              className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: product.description || '<p>Nenhuma descrição comercial fornecida para este item.</p>' }}
            />
          )}

          {activeTab === 'specs' && (
            specs.length > 0 ? (
              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {specs.map((spec, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="px-6 py-4 font-bold text-slate-700 w-1/3">{spec.key}</td>
                        <td className="px-6 py-4 text-slate-600">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">Nenhuma especificação técnica cadastrada para este produto.</p>
            )
          )}

          {activeTab === 'pdfs' && (
            pdfs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pdfs.map((pdf, idx) => (
                  <a
                    key={idx}
                    href={pdf.url.startsWith('/uploads') ? `http://localhost:5000${pdf.url}` : pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                        <FileText size={20} />
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{pdf.title || 'Ficha Técnica / Manual'}</span>
                    </div>
                    <span className="text-xs font-bold text-amber-600">Visualizar PDF</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">Nenhum documento PDF disponível para este item.</p>
            )
          )}

          {activeTab === 'videos' && (
            videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {videos.map((vid, idx) => {
                  let videoId = '';
                  try {
                    const url = new URL(vid.url);
                    if (url.hostname.includes('youtube.com')) {
                      videoId = url.searchParams.get('v') || '';
                    } else if (url.hostname.includes('youtu.be')) {
                      videoId = url.pathname.slice(1);
                    }
                  } catch (e) {
                    console.error('Invalid video URL mapping');
                  }

                  return (
                    <div key={idx} className="space-y-2">
                      <p className="text-sm font-bold text-slate-800">{vid.title || 'Apresentação YouTube'}</p>
                      {videoId ? (
                        <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                          <iframe
                            title={vid.title}
                            src={`https://www.youtube.com/embed/${videoId}`}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <a 
                          href={vid.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700"
                        >
                          <Youtube size={16} />
                          <span>Assistir vídeo no YouTube</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">Nenhum vídeo demonstrativo do YouTube disponível para este item.</p>
            )
          )}

          {activeTab === 'warranty' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-800">Termos de Garantia</h3>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.warranty || 'Garantia legal de 90 dias contra defeitos de fabricação.'}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form area */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 h-fit">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Deixe sua Avaliação</h3>
                  {token ? (
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      {reviewSuccess && <p className="text-xs font-bold text-emerald-600">{reviewSuccess}</p>}
                      {reviewError && <p className="text-xs font-bold text-red-600">{reviewError}</p>}
                      
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 block">Sua Nota</label>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setRating(val)}
                              className="text-amber-400 hover:scale-110 transition-transform"
                            >
                              <Star size={24} className={rating >= val ? 'fill-amber-400' : 'text-slate-300'} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 block">Comentário</label>
                        <textarea
                          rows={3}
                          value={comment}
                          onChange={e => setComment(e.target.value)}
                          required
                          placeholder="Escreva sua opinião sincera sobre o produto..."
                          className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 outline-none transition-all resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="bg-amber-500 text-slate-900 font-bold text-xs uppercase px-5 py-2.5 rounded-xl transition-all shadow hover:bg-amber-600 disabled:opacity-50"
                      >
                        {submittingReview ? 'Enviando...' : 'Publicar Avaliação'}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-4 space-y-2">
                      <p className="text-xs text-slate-500">Você precisa estar logado para enviar uma avaliação.</p>
                      <Link to="/auth" className="inline-block bg-slate-800 text-white font-bold text-[10px] uppercase px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">
                        Fazer Login
                      </Link>
                    </div>
                  )}
                </div>

                {/* History list */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Histórico de Avaliações</h3>
                  {reviewsList.length > 0 ? (
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                      {reviewsList.map(rev => (
                        <div key={rev.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">{rev.user?.name || 'Cliente'}</span>
                            <span className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(v => (
                              <Star key={v} size={12} className={rev.rating >= v ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                            ))}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed italic">"{rev.comment}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs italic">Nenhuma avaliação ainda para este produto. Seja o primeiro a avaliar!</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900 uppercase border-b border-slate-200 pb-3">Produtos Relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(prod => {
              const images = JSON.parse(prod.images || '[]');
              const mainImg = images[0] || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&auto=format&fit=crop&q=80';
              
              return (
                <div key={prod.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
                  <div>
                    <div className="aspect-video bg-slate-100 overflow-hidden">
                      <img src={mainImg} alt={prod.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4 space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{prod.name}</h3>
                      <p className="text-xs text-slate-400">SKU: {prod.sku}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 pt-0 flex items-center justify-between">
                    <p className="text-sm font-black text-slate-800">
                      {prod.price > 0 ? `R$ ${prod.price.toFixed(2)}` : 'Sob Consulta'}
                    </p>
                    <Link to={`/produto/${prod.sku}`} className="text-xs font-bold text-amber-500 hover:underline">
                      Ver Detalhes
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
