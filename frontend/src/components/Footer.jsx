import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
// Custom simple SVG icons for Facebook, Instagram, Linkedin for maximum compatibility
const Facebook = (props) => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
const Instagram = (props) => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
const Linkedin = (props) => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
import { useConfig } from '../context/ConfigContext';

export default function Footer() {
  const { config } = useConfig();
  
  const social = config?.socialLinks ? JSON.parse(config.socialLinks) : {};

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      
      {/* Top Footer Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand details */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-bold tracking-wider uppercase">
              SERV<span className="text-primary">SOLDA</span>
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Equipamentos industriais de alta performance, máquinas de solda, consumíveis e tochas. Soluções completas com atendimento especializado e pós-venda garantido.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <Facebook size={20} />
                </a>
              )}
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <Instagram size={20} />
                </a>
              )}
              {social.linkedin && (
                <a href={social.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <Linkedin size={20} />
                </a>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white text-sm font-bold tracking-wider uppercase mb-4">Navegação</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">Página Inicial</Link>
              </li>
              <li>
                <Link to="/produtos" className="hover:text-primary transition-colors">Todos os Produtos</Link>
              </li>
              <li>
                <Link to="/carrinho" className="hover:text-primary transition-colors">Carrinho de Orçamento</Link>
              </li>
              <li>
                <Link to="/privacidade" className="hover:text-primary transition-colors">Política de Privacidade (LGPD)</Link>
              </li>
            </ul>
          </div>

          {/* Opening info */}
          <div>
            <h4 className="text-white text-sm font-bold tracking-wider uppercase mb-4">Funcionamento</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Clock size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-300">Horários de Atendimento</p>
                  <p className="text-slate-500 text-xs mt-1">{config?.workingHours || 'Seg-Sex 08:00 - 18:00'}</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-300">Endereço da Loja</p>
                  <p className="text-slate-500 text-xs mt-1">{config?.address || 'Caxias do Sul - RS'}</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white text-sm font-bold tracking-wider uppercase mb-4">Fale Conosco</h4>
            <ul className="space-y-3 text-sm">
              {config?.phone && (
                <li className="flex items-center gap-2">
                  <Phone size={16} className="text-primary" />
                  <span>{config.phone}</span>
                </li>
              )}
              {config?.alertEmail && (
                <li className="flex items-center gap-2">
                  <Mail size={16} className="text-primary" />
                  <span>{config.alertEmail}</span>
                </li>
              )}
              <li className="text-xs text-slate-500 border-t border-slate-800 pt-3">
                CNPJ: {config?.cnpj || '12.345.678/0001-99'}
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="bg-slate-950 text-slate-600 py-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs">
          <p>{config?.footerText || 'ServSolda © Todos os direitos reservados. Design premium e robusto.'}</p>
        </div>
      </div>
    </footer>
  );
}
