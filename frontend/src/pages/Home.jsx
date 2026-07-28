import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Eye, Percent, TrendingUp, ShieldCheck, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

export default function Home() {
  const { config } = useConfig();
  const [banners, setBanners] = useState([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [sections, setSections] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    // Load banners
    fetch('http://localhost:5000/api/banners')
      .then(res => res.json())
      .then(data => setBanners(data.filter(b => b.active)))
      .catch(err => console.error(err));

    // Load sections
    fetch('http://localhost:5000/api/sections')
      .then(res => res.json())
      .then(data => setSections(data.filter(s => s.active)))
      .catch(err => console.error(err));

    // Load featured products
    fetch('http://localhost:5000/api/products?status=FEATURED')
      .then(res => res.json())
      .then(data => setFeaturedProducts(data))
      .catch(err => console.error(err));
  }, []);

  // Automatic Banner transition
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  const handleNextBanner = () => {
    setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
  };

  const handlePrevBanner = () => {
    setCurrentBannerIdx((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. Banners Carousel */}
      {banners.length > 0 ? (
        <div className="relative w-full h-[320px] md:h-[500px] bg-slate-950 overflow-hidden shadow-2xl">
          <div 
            className="w-full h-full bg-cover bg-center transition-all duration-700 ease-in-out flex items-center"
            style={{ backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.3)), url(${banners[currentBannerIdx].image})` }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-xl text-white space-y-6">
                {banners[currentBannerIdx].title && (
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                    {banners[currentBannerIdx].title}
                  </h1>
                )}
                <p className="text-slate-300 text-sm md:text-lg">
                  Equipamentos profissionais e consumíveis com cotação direta no WhatsApp. Receba atendimento e feche com nossos especialistas.
                </p>
                {banners[currentBannerIdx].link && (
                  <div>
                    <Link
                      to={banners[currentBannerIdx].link}
                      className="inline-flex items-center gap-2 bg-primary/50 hover:bg-accent text-slate-900 font-bold px-6 py-3 rounded-full text-sm tracking-wide transition-all uppercase shadow-lg hover:shadow-primary/20 hover:scale-105"
                    >
                      <span>Ver Mais</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Carousel Arrows */}
          {banners.length > 1 && (
            <>
              <button
                onClick={handlePrevBanner}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-900/60 hover:bg-primary/50 hover:text-slate-900 text-white p-2.5 rounded-full transition-colors hidden sm:block"
              >
                <ArrowLeft size={20} />
              </button>
              <button
                onClick={handleNextBanner}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900/60 hover:bg-primary/50 hover:text-slate-900 text-white p-2.5 rounded-full transition-colors hidden sm:block"
              >
                <ArrowRight size={20} />
              </button>
            </>
          )}

          {/* Indicators */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentBannerIdx(idx)}
                className={`w-3 h-3 rounded-full transition-all ${currentBannerIdx === idx ? 'bg-primary/50 w-6' : 'bg-slate-700/80'}`}
              />
            ))}
          </div>
        </div>
      ) : (
        // Premium static default banner fallback
        <div className="relative w-full h-[320px] md:h-[450px] bg-gradient-industrial flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent)]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative">
            <div className="max-w-2xl text-white space-y-6">
              <span className="bg-primary/10 text-primary px-3.5 py-1 rounded-full text-xs font-bold tracking-widest uppercase border border-primary/20">
                Líder em Soldagem
              </span>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                Soldagem de <br /><span className="text-primary">Alta Performance</span>
              </h1>
              <p className="text-slate-400 text-sm md:text-base max-w-lg leading-relaxed">
                As melhores marcas e soluções técnicas em máquinas MIG/MAG, TIG, Eletrodo e Tochas especiais. Monte seu carrinho de cotação e feche diretamente pelo WhatsApp.
              </p>
              <div>
                <Link to="/produtos" className="inline-flex items-center gap-2 bg-primary/50 hover:bg-accent text-slate-900 font-bold px-8 py-3.5 rounded-full transition-all uppercase text-sm tracking-wider">
                  Explorar Catálogo
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Grid of Sections Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Categorias</h2>
            <p className="text-sm text-slate-500">Explore nossa linha especializada dividida por aplicações</p>
          </div>
          <Link to="/produtos" className="text-sm font-bold text-accent hover:text-accent mt-2 md:mt-0 inline-flex items-center gap-1">
            Ver Todos
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sections.map(section => (
            <Link
              key={section.id}
              to={`/secao/${section.id}`}
              className="group relative h-48 bg-slate-950 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110 opacity-70"
                style={{ 
                  backgroundImage: `url(${section.image || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80'})` 
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                {section.icon && (
                  <img src={`http://localhost:5000${section.icon}`} alt="" className="w-6 h-6 object-contain" />
                )}
                <span className="text-lg font-extrabold text-white group-hover:text-primary transition-colors uppercase tracking-wide">
                  {section.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Featured Products Section */}
      {featuredProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 text-primary mb-1">
                <Percent size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Produtos em Destaque</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Ofertas Especiais</h2>
            </div>
            <Link to="/produtos" className="text-sm font-bold text-accent hover:text-accent mt-2 md:mt-0">
              Ver Todos Produtos
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => {
              const images = JSON.parse(product.images || '[]');
              const mainImg = images[0] || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&auto=format&fit=crop&q=80';
              
              return (
                <div key={product.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    <img
                      src={mainImg}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-primary/50 text-slate-900 text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
                      Destaque
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">{product.section?.name}</p>
                      <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-accent transition-colors mt-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">SKU: {product.sku}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <div>
                        <p className="text-xs text-slate-400">Preço Estimado</p>
                        <p className="text-lg font-black text-slate-900">
                          {product.price > 0 ? `R$ ${product.price.toFixed(2)}` : 'Sob Consulta'}
                        </p>
                      </div>
                      <Link
                        to={`/produto/${product.sku}`}
                        className="bg-slate-900 hover:bg-primary/50 text-white hover:text-slate-900 p-2 rounded-xl transition-colors"
                      >
                        <Eye size={18} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Value Propositions (Benefits) */}
      <div className="bg-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm flex flex-col space-y-4 border border-slate-200/60">
              <div className="w-12 h-12 bg-primary/10 text-accent rounded-xl flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 uppercase">Qualidade Industrial</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Todos os produtos acompanham certificações e manuais oficiais. Alta durabilidade e garantia direto do fabricante.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm flex flex-col space-y-4 border border-slate-200/60">
              <div className="w-12 h-12 bg-primary/10 text-accent rounded-xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 uppercase">Faturamento Flexível</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Análise de crédito descomplicada para empresas B2B. Negociamos prazos e parcelamentos diretamente com seu departamento de compras.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm flex flex-col space-y-4 border border-slate-200/60">
              <div className="w-12 h-12 bg-primary/10 text-accent rounded-xl flex items-center justify-center">
                <MessageCircle size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 uppercase">Fechamento Rápido</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Crie seu carrinho, gere o PDF do orçamento e inicie o atendimento no WhatsApp em segundos. Fechamos negócio de forma humana e rápida.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Google Maps Embed & Location (Address and working hours) */}
      {(() => {
        let mapSrc = config?.googleMapsEmbedUrl || '';
        if (mapSrc) {
          const match = mapSrc.match(/src=["']([^"']+)["']/i);
          if (match && match[1]) {
            mapSrc = match[1];
          }
        }
        if (!mapSrc || (!mapSrc.startsWith('http://') && !mapSrc.startsWith('https://'))) {
          if (config?.address) {
            const fullAddress = `${config.address}${config.addressNumber ? ' ' + config.addressNumber : ''}, ${config.city || ''} - ${config.state || ''} ${config.cep || ''}`;
            mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
          } else {
            mapSrc = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3483.9213456788544!2d-51.1783456849042!3d-29.167345682206775!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x951ea32a321d321d%3A0x321d321d321d321d!2sCaxias%20do%20Sul%2C%20RS!5e0!3m2!1spt-BR!2sbr!4v1624632145678!5m2!1spt-BR!2sbr";
          }
        }

        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Onde Estamos</h2>
              <p className="text-sm text-slate-500 mt-2">Venha nos visitar e conferir nossa linha completa de soldagem</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-md border border-slate-200 h-80 lg:h-auto min-h-[320px]">
                <iframe
                  title={`Localização ${config?.companyName || 'ServSolda'}`}
                  src={mapSrc}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                />
              </div>
              <div className="bg-slate-900 text-white p-8 rounded-2xl flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-xl font-bold uppercase tracking-wider text-primary">{config?.companyName || 'ServSolda'} Showroom</h3>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                {config?.address ? (
                  <>
                    {config.address}{config.addressNumber ? `, ${config.addressNumber}` : ''}
                    {config.addressComplement ? ` - ${config.addressComplement}` : ''}<br />
                    {config.city ? `${config.city} - ` : ''}{config.state || ''}{config.cep ? ` - CEP: ${config.cep}` : ''}
                  </>
                ) : (
                  <>
                    Rua Principal da Soldagem, 123 - Distrito Industrial<br />
                    Caxias do Sul - RS - CEP: 95000-000
                  </>
                )}
              </p>
            </div>
            
            <div className="border-t border-slate-800 pt-6">
              <h4 className="font-bold text-sm tracking-wider uppercase">Horário Comercial</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed whitespace-pre-line">
                {config?.workingHours || "Segunda a Sexta-feira:\n08:00 às 12:00 e 13:30 às 18:00"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  })()}

    </div>
  );
}
