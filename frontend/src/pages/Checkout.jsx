import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { FileText, Send, Download, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Checkout() {
  const { items, getSubtotal, clearCart } = useCart();
  const { user, token } = useAuth();
  const { config } = useConfig();
  const navigate = useNavigate();

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [budgetResult, setBudgetResult] = useState(null);

  // Redirect to cart if empty and checkout not finished
  if (items.length === 0 && !budgetResult) {
    return (
      <div className="max-w-xl mx-auto my-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Seu carrinho está vazio</h2>
        <Link to="/carrinho" className="inline-block bg-amber-500 text-slate-900 font-bold px-6 py-2 rounded-full text-xs">
          Voltar ao Carrinho
        </Link>
      </div>
    );
  }

  const handleGenerateBudget = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/budgets', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items,
          subtotal: getSubtotal(),
          total: getSubtotal(),
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar orçamento.');
      }

      setBudgetResult(data);
      clearCart(); // Clear cart items upon success
      
      // Trigger canvas-confetti celebrate effect
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppRedirect = () => {
    if (budgetResult && budgetResult.whatsappRedirectUrl) {
      window.open(budgetResult.whatsappRedirectUrl, '_blank');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
          Fechamento de Cotação
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Confirme seus dados e gere a proposta técnica em PDF para fechar no WhatsApp
        </p>
      </div>

      {!budgetResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Form details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Customer specs card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Seus Dados de Contato</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-800">Nome / Razão Social</p>
                  <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1">{user?.name}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">E-mail</p>
                  <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1">{user?.email}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">CNPJ / CPF</p>
                  <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1">{user?.document || 'Não cadastrado'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Telefone / WhatsApp</p>
                  <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1">{user?.phone || 'Não cadastrado'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="font-semibold text-slate-800">Endereço de Entrega</p>
                  <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1">{user?.address || 'Não cadastrado'}</p>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                * Para alterar estes dados cadastrais, acesse a sua <Link to="/painel" className="text-amber-600 hover:underline">Área do Cliente</Link> antes de finalizar.
              </div>
            </div>

            {/* Notes textarea */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
              <label className="text-sm font-bold text-slate-800">Observações Especiais do Orçamento</label>
              <textarea
                rows="4"
                placeholder="Insira detalhes adicionais sobre prazo de entrega, faturamento corporativo B2B ou tochas especiais..."
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

          </div>

          {/* Checkout Totals Summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">Resumo do Pedido</h3>
            
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto space-y-3">
              {items.map(item => (
                <div key={item.sku} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <span className="font-semibold text-slate-700 flex-1 line-clamp-1">{item.name} ({item.qty}x)</span>
                  <span className="font-black text-slate-900">R$ {item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex justify-between font-black text-slate-900 text-sm">
                <span>TOTAL GERAL</span>
                <span className="text-amber-600 text-base">R$ {getSubtotal().toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 text-xs leading-relaxed">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerateBudget}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-md uppercase tracking-wider text-xs"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Gerando Orçamento...</span>
                </>
              ) : (
                <>
                  <FileText size={16} />
                  <span>Gerar PDF e WhatsApp</span>
                </>
              )}
            </button>
          </div>

        </div>
      ) : (
        // Success State (tested and configured exactly to specifications)
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">Orçamento Enviado com Sucesso!</h2>
            <p className="text-sm text-slate-500">
              O orçamento <strong>{budgetResult.order.budgetNumber}</strong> foi registrado em nosso sistema.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200/60 p-5 rounded-2xl space-y-3.5 max-w-md mx-auto text-left">
            <p className="text-xs text-amber-800 leading-relaxed font-bold">
              Instruções para Finalização:
            </p>
            <ol className="list-decimal list-inside text-xs text-amber-900 space-y-2 leading-relaxed">
              <li>Clique no botão abaixo para <strong>Baixar o PDF do Orçamento</strong> oficial.</li>
              <li>Em seguida, clique em <strong>Enviar para o Vendedor (WhatsApp)</strong>.</li>
              <li>Apresente o arquivo PDF gerado ao vendedor no WhatsApp para fecharem o negócio.</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* Download PDF button */}
            <a
              href={`http://localhost:5000${budgetResult.downloadUrl}`}
              download
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-3 rounded-xl transition-all border border-slate-200 text-xs uppercase tracking-wider"
            >
              <Download size={16} />
              <span>Baixar PDF Orçamento</span>
            </a>

            {/* WhatsApp Send button */}
            <button
              onClick={handleWhatsAppRedirect}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-xs uppercase tracking-wider"
            >
              <Send size={16} />
              <span>Enviar para o WhatsApp</span>
            </button>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <Link
              to="/painel"
              className="text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors uppercase tracking-wider inline-flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              <span>Ver meus Orçamentos anteriores</span>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
