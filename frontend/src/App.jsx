import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';

// Public Pages
import Home from './pages/Home';
import ProductsList from './pages/ProductsList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AuthPage from './pages/AuthPage';
import ClientDashboard from './pages/ClientDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminDashboard from './admin/AdminDashboard';
import AdminSections from './admin/AdminSections';
import AdminProducts from './admin/AdminProducts';
import AdminBanners from './admin/AdminBanners';
import AdminClients from './admin/AdminClients';
import AdminBudgets from './admin/AdminBudgets';
import AdminConfig from './admin/AdminConfig';
import AdminLogin from './admin/AdminLogin';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ConfigProvider } from './context/ConfigContext';
import { HelmetProvider } from 'react-helmet-async';

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CartProvider>
          <ConfigProvider>
            <BrowserRouter>
              <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
                {/* Header (hidden for admin endpoints) */}
                {!window.location.pathname.startsWith('/admin') && <Header />}

                {/* Primary page body */}
                <main className="flex-grow">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/produtos" element={<ProductsList />} />
                    <Route path="/secao/:sectionId" element={<ProductsList />} />
                    <Route path="/produto/:sku" element={<ProductDetail />} />
                    <Route path="/carrinho" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/painel" element={<ClientDashboard />} />
                    <Route path="/privacidade" element={<PrivacyPolicy />} />

                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/secoes" element={<AdminSections />} />
                    <Route path="/admin/produtos" element={<AdminProducts />} />
                    <Route path="/admin/banners" element={<AdminBanners />} />
                    <Route path="/admin/clientes" element={<AdminClients />} />
                    <Route path="/admin/orcamentos" element={<AdminBudgets />} />
                    <Route path="/admin/config" element={<AdminConfig />} />

                    {/* 404 Fallback */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>

                {/* Footer and WhatsApp Widget (hidden for admin endpoints) */}
                {!window.location.pathname.startsWith('/admin') && (
                  <>
                    <Footer />
                    <WhatsAppButton />
                  </>
                )}
              </div>
            </BrowserRouter>
          </ConfigProvider>
        </CartProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
