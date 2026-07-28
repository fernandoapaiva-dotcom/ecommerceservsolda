import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from './AdminLayout';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { RefreshCw, Save, Wand2, Plus, Trash2, Eye, EyeOff, Upload, Database, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

const API_URL = window.location.origin;

export default function AdminConfig() {
  const { token } = useAuth();
  const { refreshConfig } = useConfig();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Config fields
  const [logo, setLogo] = useState('');
  const [favicon, setFavicon] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [address, setAddress] = useState('');
  const [cep, setCep] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [googleMapsEmbedUrl, setGoogleMapsEmbedUrl] = useState('');
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

  // ERP File & Firebird sync state
  const [uploadingErpFile, setUploadingErpFile] = useState(false);
  const [syncingFirebird, setSyncingFirebird] = useState(false);
  const [erpFileResult, setErpFileResult] = useState(null);
  const [createMissingProducts, setCreateMissingProducts] = useState(false);
  const [onlyWebExport, setOnlyWebExport] = useState(true);
  const [firebirdPath, setFirebirdPath] = useState('');

  const handleUploadErpFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingErpFile(true);
    setErpFileResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('createIfMissing', createMissingProducts);
      formData.append('onlyWebExport', onlyWebExport);

      const res = await fetch(`${API_URL}/api/products/import-erp-file`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao processar arquivo');

      setErpFileResult({
        success: true,
        message: data.message,
        totalRecords: data.totalRecords,
        updatedCount: data.updatedCount,
        createdCount: data.createdCount,
        skippedCount: data.skippedCount,
        errors: data.errors,
      });
    } catch (err) {
      setErpFileResult({
        success: false,
        message: err.message,
      });
    } finally {
      setUploadingErpFile(false);
    }
  };

  const handleSyncFirebirdDirect = async () => {
    setSyncingFirebird(true);
    setErpFileResult(null);

    try {
      const res = await fetch(`${API_URL}/api/products/sync-firebird`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          databasePath: firebirdPath || erpUrl,
          createIfMissing: createMissingProducts,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao sincronizar com banco Firebird');

      setErpFileResult({
        success: true,
        message: data.message,
        totalRecords: data.totalRecords,
        updatedCount: data.updatedCount,
        createdCount: data.createdCount,
        skippedCount: data.skippedCount,
        errors: data.errors,
      });
    } catch (err) {
      setErpFileResult({
        success: false,
        message: err.message,
      });
    } finally {
      setSyncingFirebird(false);
    }
  };

  // Theme Colors state
  const [themeColors, setThemeColors] = useState({
    primary: '#f59e0b',
    secondary: '#1e293b',
    accent: '#d97706',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    neutral: '#94a3b8',
    adminSidebarBg: '#0f172a',
    adminSidebarText: '#cbd5e1',
    adminSidebarActiveBg: '#f59e0b',
    headerBg: '#0f172a',
    headerText: '#ffffff',
    navBg: '#1e293b',
    navText: '#ffffff',
    searchBg: '#1e293b',
    searchText: '#94a3b8'
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
    fetch(`${API_URL}/api/configs`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setLogo(data.logo || '');
          setFavicon(data.favicon || '');
          setCompanyName(data.companyName || '');
          setCnpj(data.cnpj || '');
          setAddress(data.address || '');
          setCep(data.cep || '');
          setAddressNumber(data.addressNumber || '');
          setAddressComplement(data.addressComplement || '');
          setCity(data.city || '');
          setState(data.state || '');
          setGoogleMapsEmbedUrl(data.googleMapsEmbedUrl || '');
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
    const file = e.target.files[0];
    if (!file) return;
    
    setPaletteLoading(true);

    const startUpload = () => {
      const formData = new FormData();
      // Slice file to create a clean Blob, bypassing Chrome file locks
      const blob = file.slice(0, file.size, file.type);
      formData.append('file', blob, file.name);
      
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_URL}/api/uploads`, true);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.url) {
              setLogo(data.url);
              alert(`Logo enviado com sucesso! Caminho temporário: ${data.url}`);
            } else {
              alert("Erro: O servidor não retornou a URL da imagem.");
            }
          } catch (e) {
            alert(`Erro ao ler resposta do servidor: ${e.message}`);
          }
        } else {
          alert(`Servidor respondeu com erro ${xhr.status}`);
        }
        setPaletteLoading(false);
      };
      xhr.onerror = () => {
        alert("Falha no upload da logo (erro de rede/CORS).");
        setPaletteLoading(false);
      };
      xhr.send(formData);
    };

    // Perform color extraction FIRST. Once read is complete, start upload to avoid concurrent file locking.
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(img.width, 200);
          canvas.height = Math.min(img.height, 200);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const samples = [];
            for (let px = 0.1; px <= 0.9; px += 0.1) {
              for (let py = 0.1; py <= 0.9; py += 0.1) {
                const x = Math.floor(px * canvas.width);
                const y = Math.floor(py * canvas.height);
                const d = ctx.getImageData(x, y, 1, 1).data;
                const hex = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
                if (d[0] < 240 || d[1] < 240 || d[2] < 240) {
                  samples.push(hex);
                }
              }
            }
            
            const unique = [...new Set(samples)].slice(0, 6);
            const hexColors = unique.length >= 3 ? unique : ['#f59e0b', '#1e293b', '#d97706', '#f8fafc', '#ffffff', '#0f172a'];
            
            console.log('Cores extraídas:', hexColors);
            
            const keys = ['primary','secondary','accent','background','surface','text','neutral'];
            setThemeColors(prev => {
              const next = { ...prev };
              hexColors.forEach((hex, i) => { if (keys[i]) next[keys[i]] = hex; });
              return next;
            });
          }
        } catch (error) {
          console.error("Failed to extract colors:", error);
        } finally {
          startUpload();
        }
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      startUpload();
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    const blob = file.slice(0, file.size, file.type);
    formData.append('file', blob, file.name);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/uploads`, true);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) {
            setFavicon(data.url);
            alert(`Favicon enviado com sucesso! Caminho temporário: ${data.url}`);
          } else {
            alert("Erro: O servidor não retornou a URL do favicon.");
          }
        } catch (e) {
          alert(`Erro ao ler resposta do servidor: ${e.message}`);
        }
      } else {
        alert(`Servidor respondeu com erro ${xhr.status}`);
      }
    };
    xhr.onerror = () => {
      alert("Falha no upload do favicon (erro de rede/CORS).");
    };
    xhr.send(formData);
  };

  const handleSearchCep = () => {
    if (!cep) return;
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      alert("CEP deve conter 8 dígitos.");
      return;
    }
    fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      .then(res => res.json())
      .then(data => {
        if (data.erro) {
          alert("CEP não encontrado.");
        } else {
          setAddress(data.logradouro || '');
          setAddressComplement(data.complemento || '');
          setCity(data.localidade || '');
          setState(data.uf || '');
        }
      })
      .catch(err => {
        console.error(err);
        alert("Erro ao buscar CEP.");
      });
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
      const res = await fetch(`${API_URL}/api/ai/generate-palette`, {
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
    localStorage.setItem('themeColors', JSON.stringify(themeColors));
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
      const res = await fetch(`${API_URL}/api/configs/test-ai`, {
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
      const res = await fetch(`${API_URL}/api/configs/test-email`, {
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
      const res = await fetch(`${API_URL}/api/configs`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          logo,
          favicon,
          companyName,
          cnpj,
          address,
          cep,
          addressNumber,
          addressComplement,
          city,
          state,
          googleMapsEmbedUrl,
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

  const renderColorCard = (key) => {
    const colorDescriptions = {
      primary: "Botões principais e destaques",
      secondary: "Cabeçalho e menu",
      accent: "Badges e promoções",
      background: "Fundo das páginas",
      surface: "Fundo de cards e caixas",
      text: "Texto principal",
      textMuted: "Texto secundário/legendas",
      border: "Bordas e divisórias",
      neutral: "Textos auxiliares, placeholders e elementos neutros",
      adminSidebarBg: "Fundo do menu lateral do admin",
      adminSidebarText: "Texto dos itens do menu lateral",
      adminSidebarActiveBg: "Fundo do item ativo/selecionado no menu",
      headerBg: "Fundo do cabeçalho do site",
      headerText: "Texto/ícones do cabeçalho",
      navBg: "Fundo do menu de navegação",
      navText: "Texto do menu de navegação",
      searchBg: "Fundo da barra de busca",
      searchText: "Texto digitado na busca",
    };
    
    const getPreview = (k, val) => {
      switch(k) {
        case 'primary':
          return <span style={{ backgroundColor: val }} className="px-2 py-0.5 text-[9px] font-bold text-white rounded shadow-sm">Botão</span>;
        case 'secondary':
          return <span style={{ color: val }} className="text-[10px] font-extrabold uppercase">Menu</span>;
        case 'accent':
          return <span style={{ backgroundColor: val }} className="px-1.5 py-0.5 text-[8px] font-black text-white rounded-full">New</span>;
        case 'background':
          return <div style={{ backgroundColor: val }} className="w-10 h-4 border border-slate-200 rounded shadow-inner" />;
        case 'surface':
          return <div style={{ backgroundColor: val }} className="w-10 h-4 border border-slate-300 rounded shadow-sm" />;
        case 'text':
          return <span style={{ color: val }} className="text-[10px] font-bold">Texto</span>;
        case 'textMuted':
          return <span style={{ color: val }} className="text-[9px] font-medium italic">Subtitle</span>;
        case 'border':
          return <div style={{ borderColor: val }} className="w-10 border-b-2" />;
        case 'neutral':
          return <span style={{ color: val }} className="text-[9px] border px-1 rounded font-mono">#tag</span>;
        case 'adminSidebarBg':
          return (
            <div style={{ backgroundColor: val }} className="w-10 h-6 rounded flex items-center justify-center border border-slate-200">
              <div style={{ backgroundColor: themeColors.adminSidebarText || '#cbd5e1' }} className="w-6 h-1 rounded-sm" />
            </div>
          );
        case 'adminSidebarText':
          return (
            <div style={{ backgroundColor: themeColors.adminSidebarBg || '#0f172a' }} className="w-10 h-6 rounded flex items-center justify-center border border-slate-200">
              <div style={{ backgroundColor: val }} className="w-6 h-1 rounded-sm" />
            </div>
          );
        case 'adminSidebarActiveBg':
          return (
            <div style={{ backgroundColor: themeColors.adminSidebarBg || '#0f172a' }} className="w-10 h-6 rounded flex items-center justify-center border border-slate-200">
              <div style={{ backgroundColor: val }} className="w-6 h-3 rounded-sm shadow-sm" />
            </div>
          );
        case 'headerBg':
          return (
            <div style={{ backgroundColor: val }} className="w-12 h-6 rounded flex items-center justify-between px-1 border border-slate-200">
              <div style={{ backgroundColor: themeColors.headerText || '#ffffff' }} className="w-3 h-2 rounded-sm" />
              <div style={{ backgroundColor: themeColors.headerText || '#ffffff' }} className="w-2 h-2 rounded-full" />
            </div>
          );
        case 'headerText':
          return (
            <div style={{ backgroundColor: themeColors.headerBg || '#0f172a' }} className="w-12 h-6 rounded flex items-center justify-center border border-slate-200">
              <span style={{ color: val }} className="text-[8px] font-black">TXT</span>
            </div>
          );
        case 'navBg':
          return (
            <div style={{ backgroundColor: val }} className="w-12 h-4 rounded flex items-center gap-1 px-1 border border-slate-200">
              <div style={{ backgroundColor: themeColors.navText || '#ffffff' }} className="w-2 h-1 rounded-sm" />
              <div style={{ backgroundColor: themeColors.navText || '#ffffff' }} className="w-2 h-1 rounded-sm" />
            </div>
          );
        case 'navText':
          return (
            <div style={{ backgroundColor: themeColors.navBg || '#1e293b' }} className="w-12 h-4 rounded flex items-center justify-center border border-slate-200">
              <span style={{ color: val }} className="text-[7px] font-extrabold uppercase">Nav</span>
            </div>
          );
        case 'searchBg':
          return (
            <div style={{ backgroundColor: val }} className="w-12 h-5 rounded-full flex items-center px-1 border border-slate-200">
              <div style={{ backgroundColor: themeColors.searchText || '#94a3b8' }} className="w-4 h-1.5 rounded-sm" />
            </div>
          );
        case 'searchText':
          return (
            <div style={{ backgroundColor: themeColors.searchBg || '#1e293b' }} className="w-12 h-5 rounded-full flex items-center px-1 border border-slate-200">
              <span style={{ color: val }} className="text-[7px] font-bold">Search</span>
            </div>
          );
        default:
          return <span style={{ backgroundColor: val }} className="w-4 h-4 rounded-full" />;
      }
    };

    if (!themeColors[key]) return null;

    return (
      <div key={key} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center text-center space-y-2 relative group shadow-sm">
        <div className="flex items-center gap-2 w-full justify-between">
          <div
            className="w-8 h-8 rounded-lg border border-slate-200/60 shadow"
            style={{ backgroundColor: themeColors[key] }}
          />
          <div className="flex-1 flex justify-center">
            {getPreview(key, themeColors[key])}
          </div>
        </div>
        <div className="w-full text-center">
          <p className="font-extrabold text-[10px] text-slate-800 truncate" title={key}>{key}</p>
          {colorDescriptions[key] && (
            <p className="text-[9px] text-neutral leading-tight mt-0.5 min-h-[24px] flex items-center justify-center">{colorDescriptions[key]}</p>
          )}
          <input
            type="text"
            className="w-full text-[10px] text-center border border-slate-200 rounded mt-1.5 p-0.5 font-mono"
            value={themeColors[key] || ''}
            onChange={(e) => handleColorChange(key, e.target.value)}
          />
        </div>
        
        {!['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'textMuted', 'border', 'neutral', 'adminSidebarBg', 'adminSidebarText', 'adminSidebarActiveBg', 'headerBg', 'headerText', 'navBg', 'navText', 'searchBg', 'searchText'].includes(key) && (
          <button
            type="button"
            onClick={() => handleRemoveCustomColor(key)}
            className="absolute -top-1 right-1 p-1 text-red-500 hover:text-red-600 bg-white rounded-full shadow border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={10} />
          </button>
        )}
      </div>
    );
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
          <div className="flex items-center justify-center py-20 gap-3 text-neutral">
            <RefreshCw size={24} className="animate-spin text-primary" />
            <span className="text-sm font-semibold">Buscando configurações...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-8 text-xs font-semibold text-slate-600">
            
            {/* Section: Company Identity */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Identidade da Empresa</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <label className="uppercase tracking-wider">Upload de Logo</label>
                  <input
                    key={inputKey}
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="w-full text-xs px-3.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer"
                    onChange={handleLogoUploadAndExtractColors}
                  />
                  {logo && (
                    <div className="flex items-center gap-2 mt-2">
                      <img src={`${API_URL}${logo}`} alt="Logo atual" className="h-12 object-contain border rounded p-1 bg-white" />
                      <span className="text-[10px] text-slate-500">Logo atual (Salvo em: {logo})</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Upload de Favicon</label>
                  <input
                    type="file"
                    accept="image/png, image/x-icon, image/jpeg, image/svg+xml"
                    className="w-full text-xs px-3.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer"
                    onChange={handleFaviconUpload}
                  />
                  {favicon && (
                    <div className="flex items-center gap-2 mt-2">
                      <img src={`${API_URL}${favicon}`} alt="Favicon atual" className="h-8 w-8 object-contain border rounded p-1 bg-white" />
                      <span className="text-[10px] text-slate-500">Favicon atual (Salvo em: {favicon})</span>
                    </div>
                  )}
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
                    className="bg-primary/10 hover:bg-primary/20 text-accent px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Wand2 size={14} />
                    <span>Regenerar com IA</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {paletteLoading ? (
                  <div className="flex items-center justify-center py-10 gap-2.5 text-neutral bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <RefreshCw size={18} className="animate-spin text-primary" />
                    <span>Analisando logo e sugerindo paleta ideal com Gemini API...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Inputs */}
                    <div className="lg:col-span-8 space-y-6">
                      {/* Explanatory Box */}
                      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-xs leading-relaxed">
                        💡 <strong>Tema de Cores Inteligente:</strong> Estas cores controlam toda a aparência do site automaticamente. Altere qualquer valor hexadecimal e clique em 'Aplicar Tema' para visualizar, depois 'Gravar Configurações' para salvar definitivamente.
                      </div>

                      {/* Brand Colors Group */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                          🎨 Cores de Marca
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {['primary', 'secondary', 'accent'].map(renderColorCard)}
                        </div>
                      </div>

                      {/* Interface Colors Group */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                          ⚙️ Cores de Interface (Site Público)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {['background', 'surface', 'text', 'textMuted', 'border', 'neutral', 'headerBg', 'headerText', 'navBg', 'navText', 'searchBg', 'searchText'].map(renderColorCard)}
                        </div>
                      </div>

                      {/* Admin Panel Colors Group */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                          🛡️ Cores do Painel Admin
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {['adminSidebarBg', 'adminSidebarText', 'adminSidebarActiveBg'].map(renderColorCard)}
                        </div>
                      </div>

                      {/* Custom Colors Group if exists */}
                      {Object.keys(themeColors).filter(k => !['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'textMuted', 'border', 'neutral', 'adminSidebarBg', 'adminSidebarText', 'adminSidebarActiveBg', 'headerBg', 'headerText', 'navBg', 'navText', 'searchBg', 'searchText'].includes(k)).length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                            ✨ Cores Customizadas
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Object.keys(themeColors).filter(k => !['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'textMuted', 'border', 'neutral', 'adminSidebarBg', 'adminSidebarText', 'adminSidebarActiveBg', 'headerBg', 'headerText', 'navBg', 'navText', 'searchBg', 'searchText'].includes(k)).map(renderColorCard)}
                          </div>
                        </div>
                      )}

                      <div className="bg-slate-100/80 border border-slate-200 p-3 rounded-xl text-slate-500 text-[11px] text-center">
                        Clique em 'Regenerar com IA' para gerar uma paleta baseada na sua logo
                      </div>

                      {paletteExplanation && (
                        <div className="bg-primary/5 border border-border p-3.5 rounded-xl text-slate-600 text-[11px] leading-relaxed italic">
                          <strong>Explicação da Paleta (Gemini IA):</strong> {paletteExplanation}
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleApplyTheme}
                          className="bg-adminSidebarActiveBg text-white font-bold px-5 py-2 rounded-xl transition-all shadow text-xs uppercase"
                          style={{ backgroundColor: themeColors.adminSidebarActiveBg || '#f59e0b' }}
                        >
                          Aplicar Tema (Injetar no Site)
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Live Mockup Previews */}
                    <div className="lg:col-span-4 space-y-6 sticky top-24 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                        👁️ Mapa de Cores Interativo (Visualização)
                      </h3>
                      
                      {/* Public Site Mockup */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Site Público (E-commerce)</p>
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner text-[9px]" style={{ backgroundColor: themeColors.background }}>
                          {/* Header */}
                          <div className="px-2 py-1.5 flex items-center justify-between transition-colors duration-200" style={{ backgroundColor: themeColors.headerBg, color: themeColors.headerText }}>
                            <div className="font-extrabold flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColors.primary }} />
                              <span>ServSolda</span>
                            </div>
                            <div className="w-24 h-4 rounded-full flex items-center px-2 text-[7px]" style={{ backgroundColor: themeColors.searchBg, color: themeColors.searchText }}>
                              Buscar...
                            </div>
                          </div>
                          {/* Navigation bar */}
                          <div className="px-2 py-1 flex gap-2 text-[7px] border-b transition-colors duration-200" style={{ backgroundColor: themeColors.navBg, color: themeColors.navText, borderColor: themeColors.border }}>
                            <span className="font-bold">Home</span>
                            <span>Produtos</span>
                            <span>Máquinas</span>
                          </div>
                          {/* Content / Page background */}
                          <div className="p-2 space-y-2">
                            {/* Accent Badge example */}
                            <div className="flex gap-2">
                              <div className="p-2 rounded border flex-1 flex flex-col space-y-1.5 relative transition-colors duration-200" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
                                <span className="absolute top-1 right-1 px-1 text-[6px] font-bold rounded text-white" style={{ backgroundColor: themeColors.accent }}>
                                  Badge
                                </span>
                                <div className="w-full h-8 rounded bg-slate-200/50 flex items-center justify-center text-[7px]" style={{ color: themeColors.textMuted }}>
                                  Imagem
                                </div>
                                <div className="space-y-0.5">
                                  <div className="font-bold truncate" style={{ color: themeColors.text }}>Título do Produto</div>
                                  <div className="text-[8px]" style={{ color: themeColors.textMuted }}>Subtexto / Preço</div>
                                </div>
                                <div className="py-1 rounded text-center text-[7px] font-bold text-white uppercase transition-colors duration-200" style={{ backgroundColor: themeColors.primary }}>
                                  Orçamento (Primary)
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Admin Panel Mockup */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Painel Administrativo</p>
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner flex h-28 text-[9px] bg-slate-100">
                          {/* Sidebar */}
                          <div className="w-1/3 p-1.5 space-y-2 flex flex-col transition-colors duration-200" style={{ backgroundColor: themeColors.adminSidebarBg, color: themeColors.adminSidebarText }}>
                            <div className="font-bold text-[8px] border-b pb-1 truncate" style={{ borderColor: themeColors.border }}>Admin</div>
                            <div className="space-y-1 flex-1">
                              <div className="p-1 rounded text-[7px] font-bold text-white transition-colors duration-200" style={{ backgroundColor: themeColors.adminSidebarActiveBg }}>
                                Active Item
                              </div>
                              <div className="p-0.5 rounded text-[7px] opacity-75">
                                Menu Item 2
                              </div>
                            </div>
                          </div>
                          {/* Admin Content */}
                          <div className="flex-1 p-2 space-y-1.5">
                            <div className="h-3 w-16 bg-slate-200 rounded" />
                            <div className="p-2 rounded border flex flex-col gap-1 transition-colors duration-200" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
                              <div className="h-2 w-full bg-slate-200/50 rounded" />
                              <div className="h-2 w-2/3 bg-slate-200/50 rounded" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Legend explanation */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border text-[10px] leading-relaxed text-slate-500">
                        💡 <strong>Legenda Interativa:</strong><br />
                        As cores mostradas acima mudam em tempo real conforme você altera as caixas de texto ao lado. O mockup simula o layout oficial da ServSolda.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section: Artificial Intelligence (Gemini) */}
            <div className="space-y-4 border border-slate-200 p-5 rounded-2xl bg-primary/5">
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
                      className="absolute right-3.5 top-3 text-neutral hover:text-slate-600"
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
                    className="bg-primary/50 hover:bg-accent text-slate-900 font-bold px-4 py-2 rounded-xl transition-all shadow text-xs uppercase"
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

            {/* Section: Location & Map */}
            <div className="space-y-4 border border-slate-200/80 p-5 rounded-2xl bg-slate-50/20">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Localização & Mapa da Loja</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1 relative">
                  <label className="uppercase tracking-wider">CEP</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleSearchCep}
                      className="bg-primary text-slate-900 font-bold px-3 rounded-xl hover:opacity-90 transition-opacity"
                    >
                      Buscar
                    </button>
                  </div>
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="uppercase tracking-wider">Endereço Completo (Logradouro)</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Número</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    value={addressNumber}
                    onChange={(e) => setAddressNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Complemento</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    value={addressComplement}
                    onChange={(e) => setAddressComplement(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Cidade</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Estado (UF)</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="uppercase tracking-wider">Link do Iframe do Google Maps (Embed URL)</label>
                  <input
                    type="text"
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono"
                    value={googleMapsEmbedUrl}
                    onChange={(e) => setGoogleMapsEmbedUrl(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="uppercase tracking-wider">Horário de Funcionamento</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
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
                      className="absolute right-3.5 top-3 text-neutral hover:text-slate-600"
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

            {/* Section: Softsystem ERP & Firebird Integration */}
            <div className="space-y-5 border border-amber-200/80 bg-amber-50/30 p-6 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-600" />
                    Integração ERP Softsystem & Banco Firebird
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Sincronize estoques e preços via banco Firebird (.FDB) ou upload de arquivos de backup/exportação.</p>
                </div>
              </div>

              {/* Opções de Filtro e Criação de Produtos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-white/80 p-3 rounded-xl border border-slate-200/80">
                  <input
                    type="checkbox"
                    id="onlyWebExport"
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                    checked={onlyWebExport}
                    onChange={(e) => setOnlyWebExport(e.target.checked)}
                  />
                  <label htmlFor="onlyWebExport" className="text-xs text-slate-700 font-medium cursor-pointer">
                    Filtrar apenas produtos marcados com <span className="font-bold text-amber-700">"Exportar Web"</span> no Softsystem (Recomendado)
                  </label>
                </div>

                <div className="flex items-center gap-2 bg-white/80 p-3 rounded-xl border border-slate-200/80">
                  <input
                    type="checkbox"
                    id="createMissingProducts"
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                    checked={createMissingProducts}
                    onChange={(e) => setCreateMissingProducts(e.target.checked)}
                  />
                  <label htmlFor="createMissingProducts" className="text-xs text-slate-700 font-medium cursor-pointer">
                    Cadastrar novos produtos automaticamente no site se o SKU não existir
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Importação de Arquivo (.FDB / .CSV / .TXT / .JSON) */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Upload className="w-4 h-4 text-amber-500" />
                    1. Upload de Arquivo de Backup ou Relatório
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Selecione um arquivo de backup Firebird (<code>.FBK</code> / <code>.FDB</code>) ou relatório exportado (<code>.CSV</code>, <code>.TXT</code>, <code>.JSON</code>) para atualizar preços e estoque:
                  </p>
                  <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/40 transition-all rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer text-center space-y-2">
                    <FileText className="w-8 h-8 text-amber-500" />
                    <span className="text-xs font-semibold text-slate-700">
                      {uploadingErpFile ? 'Descompactando e processando backup...' : 'Clique para selecionar o arquivo (.FBK, .FDB, .CSV, .TXT, .JSON)'}
                    </span>
                    <input
                      type="file"
                      accept=".fbk,.fdb,.gdb,.csv,.txt,.json,.xml,.sql"
                      disabled={uploadingErpFile}
                      onChange={handleUploadErpFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 2. Conexão Direta ao Banco Firebird Local / Rede */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Database className="w-4 h-4 text-amber-500" />
                      2. Conexão Direta ao Banco Firebird (.FDB)
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Informe o caminho local ou de rede do banco de dados Firebird do Softsystem:
                    </p>
                    <input
                      type="text"
                      placeholder="Ex: C:\Softsystem\Dados\DATABASE.FDB"
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono"
                      value={firebirdPath || erpUrl}
                      onChange={(e) => {
                        setFirebirdPath(e.target.value);
                        setErpUrl(e.target.value);
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncFirebirdDirect}
                    disabled={syncingFirebird}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow text-xs uppercase flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncingFirebird ? 'animate-spin' : ''}`} />
                    {syncingFirebird ? 'Sincronizando Banco Firebird...' : 'Sincronizar Banco Firebird Agora'}
                  </button>
                </div>
              </div>

              {/* Resultado da Sincronização / Importação */}
              {erpFileResult && (
                <div className={`p-4 rounded-xl text-xs space-y-2 border ${erpFileResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {erpFileResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
                    {erpFileResult.message}
                  </div>
                  {erpFileResult.success && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/60 font-semibold text-slate-700">
                      <div>Lidos: <span className="font-mono text-emerald-700">{erpFileResult.totalRecords || 0}</span></div>
                      <div>Atualizados: <span className="font-mono text-emerald-700">{erpFileResult.updatedCount || 0}</span></div>
                      <div>Novos: <span className="font-mono text-emerald-700">{erpFileResult.createdCount || 0}</span></div>
                      <div>Ignorados: <span className="font-mono text-slate-600">{erpFileResult.skippedCount || 0}</span></div>
                    </div>
                  )}
                  {erpFileResult.errors && erpFileResult.errors.length > 0 && (
                    <div className="mt-2 text-rose-700 space-y-1 max-h-32 overflow-y-auto font-mono text-[11px]">
                      {erpFileResult.errors.map((err, idx) => (
                        <div key={idx}>• {err}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                      className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
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
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-primary/50 text-white hover:text-slate-900 font-bold px-6 py-3 rounded-xl transition-all uppercase tracking-wider text-xs shadow-md"
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
