/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Insights } from './pages/Insights';
import { Contact } from './pages/Contact';
import { Admin } from './pages/Admin';
import { PostDetail } from './pages/PostDetail';
import { ScrollToTop } from './components/ScrollToTop';

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="insights" element={<Insights />} />
            <Route path="post/:slug" element={<PostDetail />} />
            <Route path="contact" element={<Contact />} />
          </Route>
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
