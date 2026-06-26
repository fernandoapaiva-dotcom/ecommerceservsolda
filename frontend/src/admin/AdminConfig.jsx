import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from './AdminLayout';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { RefreshCw, Save, Wand2, Plus, Trash2, Eye, EyeOff } from 'lucide-react';


export default function AdminConfig() {
  const { token } = useAuth();
  const { refreshConfig } = useConfig();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Config fields
  const [logo, setLogo] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappSales, setWhatsappSales] = useState('');
  const [alertEmail, setAlertEmail] = useState('');
  const [validityDays, setValidityDays] = useState(5);
  const [socialLinks, setSocialLinks] = useState('{}');
  const [footerText, setFooterText] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [erpUrl, setErpUrl] = useState('');
  const [erpToken, setErpToken] = useState('');
  const [erpSyncMinutes, setErpSyncMinutes] = useState(15);
  const [pdfNotes, setPdfNotes] = useState('');
  const [installmentCount, setInstallmentCount] = useState(10);
  const [installmentInterest, setInstallmentInterest] = useState(false);

  // Gemini and SMTP Custom Fields
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');

  // Toggle UI visibility
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  // Async test loaders
  const [testingAI, setTestingAI] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  // Theme Colors state
  const [themeColors, setThemeColors] = useState({
    primary: '#f59e0b',
    secondary: '#1e293b',
    accent: '#d97706',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0'
  });
  const [paletteExplanation, setPaletteExplanation] = useState('');
  const [paletteLoading, setPaletteLoading] = useState(false);
  const logoImageRef = useRef(null);
  const fileInputRef = useRef(null);
  const mountedRef = useRef(false);
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.type = 'text';
      fileInputRef.current.type = 'file';
    }
    fetch('http://localhost:5000/api/configs')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setLogo(data.logo || '');
          setCompanyName(data.companyName || '');
          setCnpj(data.cnpj || '');
          setAddress(data.address || '');
          setPhone(data.phone || '');
          setWhatsappSales(data.whatsappSales || '');
          setAlertEmail(data.alertEmail || '');
          setValidityDays(data.validityDays || 5);
          setSocialLinks(data.socialLinks || '{}');
          setFooterText(data.footerText || '');
          setWorkingHours(data.workingHours || '');
          setErpUrl(data.erpUrl || '');
          setErpToken(data.erpToken || '');
          setErpSyncMinutes(data.erpSyncMinutes || 15);
          setPdfNotes(data.pdfNotes || '');
          setInstallmentCount(data.installmentCount || 10);
          setInstallmentInterest(data.installmentInterest || false);
          setGeminiApiKey(data.geminiApiKey || '');
          setGeminiModel(data.geminiModel || 'gemini-2.5-flash');
          setWhatsappMessage(data.whatsappMessage || '');
          setSmtpHost(data.smtpHost || '');
          setSmtpPort(data.smtpPort || 587);
          setSmtpUser(data.smtpUser || '');
          setSmtpPass(data.smtpPass || '');
          if (data.themeColors) {
            try {
              setThemeColors(typeof data.themeColors === 'string' ? JSON.parse(data.themeColors) : data.themeColors);
            } catch (err) {
              console.error(err);
            }
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => {
        setLoading(false);
        setInputKey(k => k + 1);
        setTimeout(() => { mountedRef.current = true; }, 500);
      });
  }, []);

  const handleLogoUploadAndExtractColors = (e) => {
    if (!mountedRef.current) return;
    const file = e.target.files[0];
    if (!file) return;
    
    setPaletteLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(img.width, 200);
        canvas.height = Math.min(img.height, 200);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Amostrar grid 10x10 = 100 pixels e pegar os mais frequentes não-brancos
        const samples = [];
        for (let px = 0.1; px <= 0.9; px += 0.1) {
          for (let py = 0.1; py <= 0.9; py += 0.1) {
            const x = Math.floor(px * canvas.width);
            const y = Math.floor(py * canvas.height);
            const d = ctx.getImageData(x, y, 1, 1).data;
            const hex = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
            // Ignorar pixels muito claros (brancos/transparentes)
            if (d[0] < 240 || d[1] < 240 || d[2] < 240) {
              samples.push(hex);
            }
          }
        }
        
        // Usar as primeiras 6 cores únicas encontradas
        const unique = [...new Set(samples)].slice(0, 6);
        const hexColors = unique.length >= 3 ? unique : ['#f59e0b', '#1e293b', '#d97706', '#f8fafc', '#ffffff', '#0f172a'];
        
        console.log('Cores extraídas:', hexColors);
        
        // Atualizar estado das cores
        const keys = ['primary','secondary','accent','background','surface','text'];
        setThemeColors(prev => {
          const next = { ...prev };
          hexColors.forEach((hex, i) => { if (keys[i]) next[keys[i]] = hex; });
          return next;
        });
        
        // Upload do arquivo
        const formData = new FormData();
        formData.append('file', file);
        fetch('http://localhost:5000/api/uploads', {
          method: 'POST',
          body: formData
        })
        .then(r => r.json())
        .then(data => { setLogo(data.url); setPaletteLoading(false); })
        .catch(() => setPaletteLoading(false));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const requestAIPalette = async (colorsList) => {
    if (!geminiApiKey) {
      alert("Configure e salve sua Gemini API Key para gerar sugestões com IA");
      return;
    }
    
    setPaletteLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch('http://localhost:5000/api/ai/generate-palette', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ colors: colorsList }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (res.ok && data.palette) {
        setThemeColors(data.palette);
        setPaletteExplanation(data.explanation || '');
      } else {
        alert(data.error || "Erro ao obter sugestão da IA.");
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        alert("Erro: Tempo limite de 10 segundos excedido ao conectar com a IA do Gemini.");
      } else {
        alert(`Erro ao solicitar paleta com IA: ${err.message}`);
      }
    } finally {
      setPaletteLoading(false);
    }
  };

  const handleRegenerateSuggestion = () => {
    // Regenerate color palette using the current primary values
    const currentList = Object.values(themeColors);
    requestAIPalette(currentList);
  };

  const handleColorChange = (key, value) => {
    setThemeColors(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAddCustomColor = () => {
    const key = prompt("Digite a variável de cor customizada (ex: primaryLight, textDark):");
    if (key) {
      setThemeColors(prev => ({
        ...prev,
        [key]: '#cccccc'
      }));
    }
  };

  const handleRemoveCustomColor = (key) => {
    const newColors = { ...themeColors };
    delete newColors[key];
    setThemeColors(newColors);
  };

  const handleApplyTheme = async () => {
    // Inject directly to document root variables for instantaneous view
    Object.keys(themeColors).forEach(key => {
      document.documentElement.style.setProperty(`--color-${key}`, themeColors[key]);
    });
    setSuccess('Tema de cores aplicado temporariamente no navegador. Salve as Configurações para persistir!');
    setTimeout(() => setSuccess(''), 4000);
  };

  // ESTA FUNÇÃO SÓ DEVE SER EXECUTADA MANUAMENTE PELO CLIQUE NO BOTÃO "Testar IA"
  const handleTestAI = async () => {
    if (!geminiApiKey) {
      alert("Por favor, preencha a chave Gemini API Key antes de testar.");
      return;
    }
    setTestingAI(true);
    try {
      console.log("AdminConfig: Executando teste manual de IA...");
      const res = await fetch('http://localhost:5000/api/configs/test-ai', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ geminiApiKey, geminiModel })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
      } else {
        alert(`Erro: ${data.error || "Falha na conexão"}`);
      }
    } catch (err) {
      alert(`Erro de conexão: ${err.message}`);
    } finally {
      setTestingAI(false);
    }
  };

  const handleTestEmail = async () => {
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !alertEmail) {
      alert("Por favor, preencha todos os campos SMTP e o e-mail de alerta antes de testar.");
      return;
    }
    setTestingEmail(true);
    try {
      const res = await fetch('http://localhost:5000/api/configs/test-email', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ smtpHost, smtpPort, smtpUser, smtpPass, alertEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
      } else {
        alert(`Erro: ${data.error || "Falha ao enviar e-mail"}`);
      }
    } catch (err) {
      alert(`Erro de conexão: ${err.message}`);
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/configs', {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          logo,
          companyName,
          cnpj,
          address,
          phone,
          whatsappSales,
          alertEmail,
          validityDays: parseInt(validityDays) || 5,
          socialLinks,
          footerText,
          workingHours,
          erpUrl,
          erpToken,
          erpSyncMinutes: parseInt(erpSyncMinutes) || 15,
          themeColors,
          pdfNotes,
          installmentCount: parseInt(installmentCount) || 10,
          installmentInterest: Boolean(installmentInterest),
          geminiApiKey,
          geminiModel,
          whatsappMessage,
          smtpHost,
          smtpPort: parseInt(smtpPort) || 587,
          smtpUser,
          smtpPass,
        })
      });

      if (!res.ok) {
        throw new Error('Falha ao salvar configurações.');
      }

      setSuccess('✅ Configurações salvas com sucesso');
      refreshConfig(); // reload settings client context
      setInputKey(k => k + 1);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(`❌ Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-10">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase">Configurações Gerais</h1>
          <p className="text-slate-500 text-xs">Ajuste dados de contato da loja, logotipo, faturamento do PDF e sincronismo com ERP</p>
        </div>

        {success && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl p-3.5 text-xs font-semibold">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3.5 text-xs font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <RefreshCw size={24} className="animate-spin text-amber-500" />
            <span className="text-sm font-semibold">Buscando configurações...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-8 text-xs font-semibold text-slate-600">
            
            {/* Section: Company Identity */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Identidade da Empresa</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Nome da Loja (Empresa)</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">CNPJ Oficial</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Upload de Logo (Extrai Cores automaticamente)</label>
                  <input
                    key={inputKey}
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="w-full text-xs px-3.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer"
                    onChange={handleLogoUploadAndExtractColors}
                  />
                  {logo && <span className="text-[10px] text-slate-400">Salvo em: {logo}</span>}
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="uppercase tracking-wider">Endereço Físico (Showroom)</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section: Dynamic Theme Colors */}
            <div className="space-y-4 border border-slate-200/80 p-5 rounded-2xl bg-slate-50/50">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Tema de Cores Inteligente</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddCustomColor}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Adicionar Cor</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerateSuggestion}
                    disabled={paletteLoading}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Wand2 size={14} />
                    <span>Regenerar com IA</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {paletteLoading ? (
                  <div className="flex items-center justify-center py-10 gap-2.5 text-slate-400 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <RefreshCw size={18} className="animate-spin text-amber-500" />
                    <span>Analisando logo e sugerindo paleta ideal com Gemini API...</span>
                  </div>
                ) : (
                  <>
                    {/* Colors suggest Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                      {Object.keys(themeColors).map(key => (
                        <div key={key} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center text-center space-y-2.5 relative group shadow-sm">
                          <div
                            className="w-12 h-12 rounded-lg border border-slate-200/60 shadow"
                            style={{ backgroundColor: themeColors[key] }}
                          />
                          <div className="w-full text-center">
                            <p className="font-extrabold text-[10px] text-slate-800 truncate" title={key}>{key}</p>
                            <input
                              type="text"
                              className="w-full text-[10px] text-center border border-slate-200 rounded mt-1.5 p-0.5 font-mono"
                              value={themeColors[key]}
                              onChange={(e) => handleColorChange(key, e.target.value)}
                            />
                          </div>
                          
                          {/* Remove custom color trigger */}
                          {!['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'textMuted', 'border'].includes(key) && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomColor(key)}
                              className="absolute -top-1 right-1 p-1 text-red-500 hover:text-red-600 bg-white rounded-full shadow border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-100/80 border border-slate-200 p-3 rounded-xl text-slate-500 text-[11px] text-center">
                      Clique em 'Regenerar com IA' para gerar uma paleta baseada na sua logo
                    </div>

                    {paletteExplanation && (
                      <div className="bg-amber-50/50 border border-amber-200 p-3.5 rounded-xl text-slate-600 text-[11px] leading-relaxed italic">
                        <strong>Explicação da Paleta (Gemini IA):</strong> {paletteExplanation}
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleApplyTheme}
                        className="bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-900 font-bold px-5 py-2 rounded-xl transition-all shadow text-xs uppercase"
                      >
                        Aplicar Tema (Injetar no Site)
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section: Artificial Intelligence (Gemini) */}
            <div className="space-y-4 border border-slate-200 p-5 rounded-2xl bg-amber-50/20">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Inteligência Artificial (Google Gemini)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2 space-y-1 relative">
                  <label className="uppercase tracking-wider">Gemini API Key</label>
                  <div className="relative">
                    <input
                      type={showGeminiKey ? 'text' : 'password'}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl pr-10"
                      placeholder="Obtido gratuitamente em aistudio.google.com"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Modelo da IA</label>
                  <select
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white"
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                  >
                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                    <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
                  </select>
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleTestAI}
                    disabled={testingAI}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-4 py-2 rounded-xl transition-all shadow text-xs uppercase"
                  >
                    {testingAI ? 'Testando...' : 'Testar IA'}
                  </button>
                </div>
              </div>
            </div>

            {/* Section: Contact & Sales WhatsApp */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Canais de Contato & WhatsApp de Vendas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Telefone Comercial</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">WhatsApp de Vendas (Sem formatação)</label>
                  <input
                    type="text"
                    placeholder="Ex: 5554999999999"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    value={whatsappSales}
                    onChange={(e) => setWhatsappSales(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Validade Padrão Orçamento (Dias)</label>
                  <input
                    type="number"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="uppercase tracking-wider">Horário de Funcionamento</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="uppercase tracking-wider">Mensagem Padrão que acompanha o link wa.me</label>
                  <textarea
                    rows={2}
                    placeholder="Use placeholders: {budgetNumber}, {total}, {customerName}, {customerContact}"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none"
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section: E-mail de Alertas & SMTP */}
            <div className="space-y-4 border border-slate-200 p-5 rounded-2xl bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">E-mail de Alertas & Servidor SMTP</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">E-mail destinatário dos alertas</label>
                  <input
                    type="email"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">SMTP Host</label>
                  <input
                    type="text"
                    placeholder="Ex: smtp.gmail.com"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">SMTP Port</label>
                  <input
                    type="number"
                    placeholder="Ex: 587 ou 465"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">SMTP Usuário</label>
                  <input
                    type="text"
                    placeholder="Ex: comercial@servsolda.com.br"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                  />
                </div>
                <div className="space-y-1 relative md:col-span-2">
                  <label className="uppercase tracking-wider">SMTP Senha</label>
                  <div className="relative">
                    <input
                      type={showSmtpPass ? 'text' : 'password'}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl pr-10"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showSmtpPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testingEmail}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl transition-all shadow text-xs uppercase"
                  >
                    {testingEmail ? 'Testando...' : 'Testar E-mail'}
                  </button>
                </div>
              </div>
            </div>

            {/* Section: Softsystem ERP Integration Configuration */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Integração ERP Softsystem</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="uppercase tracking-wider">URL da API REST do ERP</label>
                  <input
                    type="text"
                    placeholder="Ex: http://api.softsystem.com.br/v1"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono"
                    value={erpUrl}
                    onChange={(e) => setErpUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Frequência de Sincronismo (Minutos)</label>
                  <input
                    type="number"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    value={erpSyncMinutes}
                    onChange={(e) => setErpSyncMinutes(e.target.value)}
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="uppercase tracking-wider">Token / Chave de API de Integração</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono"
                    value={erpToken}
                    onChange={(e) => setErpToken(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section: Installments & PDF Configurations */}
            <div className="space-y-4 border border-slate-200/80 p-5 rounded-2xl bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wider">Configurações de Venda & Orçamentos (PDF)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Nº Máximo de Parcelas (Ex: 10)</label>
                  <input
                    type="number"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(e.target.value)}
                  />
                </div>
                <div className="space-y-1 flex flex-col justify-end pb-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold uppercase text-slate-700">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                      checked={installmentInterest}
                      onChange={(e) => setInstallmentInterest(e.target.checked)}
                    />
                    <span>Parcelamento sem juros</span>
                  </label>
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="uppercase tracking-wider">Notas Padrão no PDF do Orçamento</label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Faturamento sujeito a análise de crédito. Prazo de entrega de 10 dias úteis."
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none"
                    value={pdfNotes}
                    onChange={(e) => setPdfNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end border-t border-slate-100 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-900 font-bold px-6 py-3 rounded-xl transition-all uppercase tracking-wider text-xs shadow-md"
              >
                <Save size={16} />
                <span>{saving ? 'Gravando...' : 'Gravar Configurações'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </AdminLayout>
  );
}
