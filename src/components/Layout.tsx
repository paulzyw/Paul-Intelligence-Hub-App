import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ChatAssistant } from './ChatAssistant';
import { ScrollToTop } from './ScrollToTop';
import { useTrafficTracking } from '../hooks/useTrafficTracking';
import { CookieConsentBanner } from './cookies/CookieConsentBanner';
import { CookiePreferenceCenter } from './cookies/CookiePreferenceCenter';

export function Layout() {
  useTrafficTracking();

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <ScrollToTop />
      <ChatAssistant />
      <Footer />
      <CookieConsentBanner />
      <CookiePreferenceCenter />
    </div>
  );
}
