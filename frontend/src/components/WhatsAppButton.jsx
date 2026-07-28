import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';

export default function WhatsAppButton() {
  const { config } = useConfig();
  
  if (!config || !config.whatsappSales) return null;

  const phone = config.whatsappSales.replace(/\D/g, '');
  const defaultMsg = config.whatsappMessage || 'Olá ServSolda! Gostaria de tirar algumas dúvidas sobre equipamentos de soldagem.';
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(defaultMsg)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
      aria-label="Falar no WhatsApp"
      id="whatsapp-floating-button"
    >
      <MessageCircle size={28} className="fill-current" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-out text-sm font-bold whitespace-nowrap">
        Orçamento Rápido
      </span>
    </a>
  );
}
