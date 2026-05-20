/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Insights } from './pages/Insights';
import { Contact } from './pages/Contact';
import { Admin } from './pages/Admin';
import { PostDetail } from './pages/PostDetail';
import { Research } from './pages/Research';
import { ResearchDetail } from './pages/ResearchDetail';
import { Impact } from './pages/Impact';
import { Solutions } from './pages/Solutions';
import { Auth } from './pages/Auth';
import { RevOSApp } from './apps/revos/RevOSApp';
import { ScrollReset } from './components/ScrollReset';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollReset />
          <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="auth" element={<Auth />} />
            <Route path="solutions" element={<Solutions />} />
            
            {/* RevOS App Protected Routes */}
            <Route 
              path="solutions/revos/*" 
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
            
            <Route path="insights" element={<Insights />} />
            <Route path="post/:slug" element={<PostDetail />} />
            <Route path="research" element={<Research />} />
            <Route path="research/:slug" element={<ResearchDetail />} />
            <Route path="impact" element={<Impact />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          {/* Admin Dashboard Protected Route */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <Admin />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
