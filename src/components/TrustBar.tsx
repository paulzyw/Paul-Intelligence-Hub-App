import { useState } from 'react';
import logo1 from '@/public/logos/logo1.png';
import logo2 from '@/public/logos/logo2.png';
import logo3 from '@/public/logos/logo3.png';
import logo4 from '@/public/logos/logo4.png';
import logo5 from '@/public/logos/logo5.png';

export function TrustBar() {
  const logos = [
    { src: logo1, name: 'Suez' },
    { src: logo2, name: 'Veolia' },
    { src: logo3, name: 'Alstom' },
    { src: logo4, name: 'GE' },
    { src: logo5, name: 'AspenTech' }
  ];

  return (
    <section className="w-full bg-obsidian py-16 border-y border-border/20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-8 md:gap-x-12 lg:gap-x-16">
          {logos.map((logo, index) => (
            <LogoItem key={index} src={logo.src} name={logo.name} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LogoItem({ src, name }: { src: string; name: string }) {
  const [error, setError] = useState(false);

  return (
    <div className="flex items-center justify-center min-w-[100px] md:min-w-[140px]">
      {!error ? (
        <img 
          src={src} 
          alt={name} 
          loading="lazy"
          onError={() => setError(true)}
          className="h-10 w-auto max-w-[120px] md:max-w-[160px] object-contain opacity-50 hover:opacity-100 hover:scale-110 transition-all duration-500 ease-in-out cursor-default will-change-transform"
        />
      ) : (
        <span className="text-ivory font-medium text-lg opacity-50 hover:opacity-100 transition-opacity duration-500 cursor-default">
          {name}
        </span>
      )}
    </div>
  );
}
