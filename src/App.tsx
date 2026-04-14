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
import { Research } from './pages/Research';
import { ResearchDetail } from './pages/ResearchDetail';
import { ScrollReset } from './components/ScrollReset';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollReset />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="insights" element={<Insights />} />
            <Route path="post/:slug" element={<PostDetail />} />
            <Route path="research" element={<Research />} />
            <Route path="research/:slug" element={<ResearchDetail />} />
            <Route path="contact" element={<Contact />} />
          </Route>
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
