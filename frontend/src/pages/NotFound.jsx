import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto my-24 px-4 text-center space-y-6">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
        <AlertCircle size={32} />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-slate-800">Página Não Encontrada</h2>
        <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
          Desculpe, a página que você está tentando acessar não existe ou foi movida.
        </p>
      </div>

      <div>
        <Link
          to="/"
          className="inline-block bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-900 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
        >
          Voltar para Home
        </Link>
      </div>
    </div>
  );
}
