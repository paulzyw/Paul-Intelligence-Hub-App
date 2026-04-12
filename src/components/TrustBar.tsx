import { useState } from 'react';
import { motion } from 'motion/react';

const LOGO_DATA = [
  { name: 'SUEZ', url: 'https://yfonihlpdvelssfmzokp.supabase.co/storage/v1/object/public/trust_bar_logos/logo1.png' },
  { name: 'VEOLIA', url: 'https://yfonihlpdvelssfmzokp.supabase.co/storage/v1/object/public/trust_bar_logos/logo2.png' },
  { name: 'Alstom', url: 'https://yfonihlpdvelssfmzokp.supabase.co/storage/v1/object/public/trust_bar_logos/logo3.png' },
  { name: 'GE', url: 'https://yfonihlpdvelssfmzokp.supabase.co/storage/v1/object/public/trust_bar_logos/logo4.png' },
  { name: 'Aspentech', url: 'https://yfonihlpdvelssfmzokp.supabase.co/storage/v1/object/public/trust_bar_logos/logo5.png' },
];

export function TrustBar() {
  return (
    <section id="trust-bar" className="w-full bg-bg-hero-primary py-12 border-y border-border-hero transition-colors duration-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 lg:gap-16">
          {LOGO_DATA.map((logo) => (
            <LogoItem key={logo.name} logo={logo} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LogoItem({ logo }: { logo: typeof LOGO_DATA[0] }) {
  const [hasError, setHasError] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.15 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="flex items-center justify-center"
    >
      {!hasError ? (
        <img
          src={logo.url}
          alt={`${logo.name} logo`}
          loading="lazy"
          onError={() => setHasError(true)}
          className="h-10 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-500 cursor-default dark:invert"
        />
      ) : (
        <div className="border-l-4 border-accent pl-3 py-1">
          <span className="text-text-primary font-sans font-medium tracking-wider uppercase text-sm md:text-base">
            {logo.name}
          </span>
        </div>
      )}
    </motion.div>
  );
}
