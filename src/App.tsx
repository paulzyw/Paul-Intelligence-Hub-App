/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CookieConsentProvider } from './context/CookieConsentContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { FounderProfile } from './pages/founderProfile';
import { AboutFounder } from './pages/aboutFounder';
import { FounderInsights } from './pages/founderInsights';
import { Contact } from './pages/Contact';
import { Admin } from './pages/Admin';
import { PostDetail } from './pages/PostDetail';
import { FounderResearch } from './pages/founderResearch';
import { ResearchDetail } from './pages/ResearchDetail';
import { FounderImpact } from './pages/founderImpact';
import { ProductOverviewRevos } from './pages/ProductOverviewRevos';
import { Auth } from './pages/Auth';
import { RevOSApp } from './apps/revos/RevOSApp';
import { CookiePolicy } from './pages/CookiePolicy';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { AiDisclaimer } from './pages/AiDisclaimer';
import { ScrollReset } from './components/ScrollReset';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CookieConsentProvider>
          <BrowserRouter>
          <ScrollReset />
          <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            {/* About / Founder Routes */}
            <Route path="about/aboutFounder" element={<AboutFounder />} />
            <Route path="about/founderProfile" element={<FounderProfile />} />
            <Route path="about/founderImpact" element={<FounderImpact />} />
            <Route path="about/founderInsights" element={<FounderInsights />} />
            <Route path="about/founderResearch" element={<FounderResearch />} />
            <Route path="about/contact" element={<Contact />} />

            {/* Backward-compatibility redirects */}
            <Route path="about" element={<Navigate to="/about/aboutFounder" replace />} />
            <Route path="founder" element={<Navigate to="/about/founderProfile" replace />} />
            <Route path="impact" element={<Navigate to="/about/founderImpact" replace />} />
            <Route path="insights" element={<Navigate to="/about/founderInsights" replace />} />
            <Route path="research" element={<Navigate to="/about/founderResearch" replace />} />
            <Route path="contact" element={<Navigate to="/about/contact" replace />} />
            <Route path="theme" element={<Navigate to="/" replace />} />
            <Route path="auth" element={<Auth />} />
            <Route path="product" element={<Navigate to="/product/overview/revos" replace />} />
            <Route path="product/overview" element={<Navigate to="/product/overview/revos" replace />} />
            <Route path="product/feature" element={<Navigate to="/product/overview/revos" replace />} />
            <Route path="product/overview/revos" element={<ProductOverviewRevos />} />
            
            {/* RevOS App Protected Routes */}
            <Route 
              path="product/revos/*" 
              element={
                <ProtectedRoute allowedRoles={[
                  'free_user', 
                  'paid_user', 
                  'enterprise_user', 
                  'workspace_admin', 
                  'enterprise_executive', 
                  'revos_admin', 
                  'super_admin'
                ]}>
                  <RevOSApp />
                </ProtectedRoute>
              } 
            />

            {/* Backward-compatibility redirects */}
            <Route path="solutions" element={<Navigate to="/product/overview/revos" replace />} />
            <Route path="solutions/revos/*" element={<Navigate to="/product/revos" replace />} />
            
            <Route path="post/:slug" element={<PostDetail />} />
            <Route path="research/:slug" element={<ResearchDetail />} />
            <Route path="cookie-policy" element={<CookiePolicy />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="privacy" element={<Navigate to="/privacy-policy" replace />} />
            <Route path="terms-of-service" element={<TermsOfService />} />
            <Route path="terms" element={<Navigate to="/terms-of-service" replace />} />
            <Route path="ai-disclaimer" element={<AiDisclaimer />} />
            <Route path="ai-notice" element={<Navigate to="/ai-disclaimer" replace />} />
            
            {/* Admin Dashboard Protected Route */}
            <Route 
              path="admin" 
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <Admin />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </BrowserRouter>
      </CookieConsentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
