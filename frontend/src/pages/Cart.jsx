import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, FileText, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { items, updateQty, removeItem, getSubtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckoutRedirect = () => {
    if (user) {
      navigate('/checkout');
    } else {
      // Save intent to navigate to checkout after login
      navigate('/login?redirect=checkout');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Title & Breadcrumbs */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
          Carrinho de Orçamento
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gerencie os produtos selecionados antes de gerar a sua cotação oficial
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Items list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-base">Itens Selecionados ({items.length})</span>
                <button
                  onClick={clearCart}
                  className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider"
                >
                  Esvaziar Carrinho
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map(item => (
                  <div key={item.sku} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=150&auto=format&fit=crop&q=80'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{item.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">SKU: {item.sku}</p>
                        <p className="text-xs font-black text-slate-800 mt-1">
                          {item.price > 0 ? `Unitário: R$ ${item.price.toFixed(2)}` : 'Sob Consulta'}
                        </p>
                      </div>
                    </div>

                    {/* Quantity Selector & Remove Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                        <button
                          onClick={() => updateQty(item.sku, item.qty - 1)}
                          className="px-2.5 py-1 hover:bg-slate-200 text-slate-600 font-extrabold"
                        >
                          -
                        </button>
                        <span className="px-3.5 py-1 text-xs font-bold text-slate-800 bg-white border-x border-slate-200 w-10 text-center">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.sku, item.qty + 1)}
                          className="px-2.5 py-1 hover:bg-slate-200 text-slate-600 font-extrabold"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right min-w-[80px]">
                        <p className="text-xs text-slate-400">Total do Item</p>
                        <p className="text-sm font-black text-slate-900">
                          {item.price > 0 ? `R$ ${item.total.toFixed(2)}` : 'Sob Consulta'}
                        </p>
                      </div>

                      <button
                        onClick={() => removeItem(item.sku)}
                        className="text-slate-400 hover:text-red-500 p-2 rounded-xl transition-colors border border-transparent hover:border-slate-100"
                        title="Remover item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Budget Summary Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">Resumo da Cotação</h3>
            
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Total de Itens</span>
                <span>{items.reduce((acc, item) => acc + item.qty, 0)} unidades</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Subtotal Estimado</span>
                <span>R$ {getSubtotal().toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between font-black text-slate-900 text-base">
                <span>TOTAL ESTIMADO</span>
                <span className="text-amber-600">R$ {getSubtotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/60 text-xs text-amber-800 leading-relaxed">
              <strong>Atenção:</strong> Nenhuma transação financeira é finalizada no site. Ao prosseguir, geraremos um orçamento oficial em PDF e abriremos o WhatsApp para finalização direta com nossos consultores de vendas.
            </div>

            <button
              onClick={handleCheckoutRedirect}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-md uppercase tracking-wider text-xs"
            >
              <span>{user ? 'Prosseguir para Checkout' : 'Fazer Login para Prosseguir'}</span>
              <ArrowRight size={16} />
            </button>

            <Link
              to="/produtos"
              className="block text-center text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors py-2 uppercase tracking-wider"
            >
              Continuar Adicionando
            </Link>
          </div>

        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-6 max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShoppingBag size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Seu carrinho está vazio</h3>
            <p className="text-sm text-slate-400 mt-1">Navegue pelas nossas seções para adicionar inversores, tochas e consumíveis de soldagem.</p>
          </div>
          <Link
            to="/produtos"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-full text-xs tracking-wider uppercase transition-all"
          >
            <span>Ver Produtos</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      )}

    </div>
  );
}
