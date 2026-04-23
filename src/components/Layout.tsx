import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ChatAssistant } from './ChatAssistant';
import { ScrollToTop } from './ScrollToTop';
import { useTrafficTracking } from '../hooks/useTrafficTracking';

export function Layout() {
  useTrafficTracking();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <ScrollToTop />
      <ChatAssistant />
      <Footer />
    </div>
  );
}
