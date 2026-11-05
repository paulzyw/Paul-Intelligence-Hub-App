/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CookieConsentProvider } from './context/CookieConsentContext';
import { Layout } from './components/Layout';
import { ScrollReset } from './components/ScrollReset';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageSkeleton } from './components/PageSkeleton';
import { Home } from './pages/Home';
// Route-level code-splitting: Lazy load secondary pages to eliminate monolithic bundle payload
const AboutRevos = lazy(() => import('./pages/AboutRevos').then(m => ({ default: m.AboutRevos })));
const FounderProfile = lazy(() => import('./pages/founderProfile').then(m => ({ default: m.FounderProfile })));
const AboutFounder = lazy(() => import('./pages/aboutFounder').then(m => ({ default: m.AboutFounder })));
const FounderInsights = lazy(() => import('./pages/founderInsights').then(m => ({ default: m.FounderInsights })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const PostDetail = lazy(() => import('./pages/PostDetail').then(m => ({ default: m.PostDetail })));
const Insights = lazy(() => import('./pages/Insights').then(m => ({ default: m.Insights })));
const InsightDetail = lazy(() => import('./pages/InsightDetail').then(m => ({ default: m.InsightDetail })));
const FounderResearch = lazy(() => import('./pages/founderResearch').then(m => ({ default: m.FounderResearch })));
const ResearchDetail = lazy(() => import('./pages/ResearchDetail').then(m => ({ default: m.ResearchDetail })));
const FounderImpact = lazy(() => import('./pages/founderImpact').then(m => ({ default: m.FounderImpact })));
const ProductOverviewRevos = lazy(() => import('./pages/ProductOverviewRevos').then(m => ({ default: m.ProductOverviewRevos })));
const Auth = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const RevOSApp = lazy(() => import('./apps/revos/RevOSApp').then(m => ({ default: m.RevOSApp })));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy').then(m => ({ default: m.CookiePolicy })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(m => ({ default: m.TermsOfService })));
const AiDisclaimer = lazy(() => import('./pages/AiDisclaimer').then(m => ({ default: m.AiDisclaimer })));

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CookieConsentProvider>
          <BrowserRouter>
            <ScrollReset />
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  {/* About / Founder Routes */}
                  <Route path="about/aboutRevos" element={<AboutRevos />} />
                  <Route path="about/aboutFounder" element={<AboutFounder />} />
                  <Route path="about/founderProfile" element={<FounderProfile />} />
                  <Route path="about/founderImpact" element={<FounderImpact />} />
                  <Route path="about/founderInsights" element={<FounderInsights />} />
                  <Route path="about/founderResearch" element={<FounderResearch />} />
                  <Route path="about/contact" element={<Contact />} />

                  {/* Backward-compatibility redirects */}
                  <Route path="about/revos" element={<Navigate to="/about/aboutRevos" replace />} />
                  <Route path="about" element={<Navigate to="/about/aboutRevos" replace />} />
                  <Route path="founder" element={<Navigate to="/about/founderProfile" replace />} />
                  <Route path="impact" element={<Navigate to="/about/founderImpact" replace />} />
                  {/* Revenue Insights Module */}
                  <Route path="resources/insights" element={<Insights />} />
                  <Route path="resources/insights/:slug" element={<InsightDetail />} />
                  <Route path="insights" element={<Navigate to="/resources/insights" replace />} />
                  <Route path="insights/:slug" element={<Navigate to="/resources/insights/:slug" replace />} />
                  
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
                  <Route path="blog/:slug" element={<PostDetail />} />
                  <Route path="blog" element={<Navigate to="/about/founderInsights" replace />} />
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
            </Suspense>
          </BrowserRouter>
        </CookieConsentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
