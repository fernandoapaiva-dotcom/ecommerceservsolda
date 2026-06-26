import React from 'react';
import { Shield, EyeOff, Lock, Scale } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      
      {/* Policy Title */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Shield size={24} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Política de Privacidade</h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Conheça nosso compromisso de conformidade com a LGPD (Lei Geral de Proteção de Dados)
        </p>
      </div>

      {/* Main content sections */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8 text-sm text-slate-600 leading-relaxed">
        
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-2">
            <CheckIcon />
            <span>1. Controle e Tratamento dos Dados</span>
          </h2>
          <p>
            A <strong>ServoSolda LTDA</strong>, inscrita sob CNPJ 12.345.678/0001-99, atua como controladora do processamento de dados para esta plataforma de orçamentos e cotações. Os dados de login manuais e através do Google OAuth são criptografados e armazenados com segurança, com o único objetivo de estruturar a emissão da proposta comercial (PDF).
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-2">
            <CheckIcon />
            <span>2. Coleta de Informações Cadastrais</span>
          </h2>
          <p>
            Coletamos apenas informações necessárias para a confecção da proposta B2B/B2C, a saber:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-500 pl-2">
            <li>Nome Completo ou Razão Social da Empresa.</li>
            <li>Documento identificador (CPF ou CNPJ).</li>
            <li>Endereço comercial ou residencial para cálculo de estimativa de frete da proposta.</li>
            <li>Telefone de contato para envio das propostas via WhatsApp.</li>
            <li>Endereço de e-mail e hash seguro da senha.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-2">
            <CheckIcon />
            <span>3. Finalidade e Comunicação WhatsApp</span>
          </h2>
          <p>
            Nenhuma venda ou transação de cartão/PIX é efetuada online. Ao clicar em "Gerar Orçamento", as informações do carrinho e os dados do cliente são inseridos em uma planilha de orçamento digital (PDF), e o cliente é redirecionado via link seguro <code>wa.me</code> para confirmar a compra de forma humana com nossa mesa de vendas.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-2">
            <CheckIcon />
            <span>4. Seus Direitos (Artigo 18 da LGPD)</span>
          </h2>
          <p>
            O usuário tem total direito de solicitar a alteração dos seus dados, a eliminação definitiva da sua conta dos servidores ServoSolda ou a portabilidade. Para qualquer requisição legal de privacidade, entre em contato via e-mail <code>vendas@servsolda.com.br</code>.
          </p>
        </div>

      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <span className="w-5 h-5 bg-amber-100 text-amber-600 rounded-md flex items-center justify-center flex-shrink-0">
      <Scale size={12} />
    </span>
  );
}
