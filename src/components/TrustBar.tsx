import { useState } from 'react';

export function TrustBar() {
  const logos = [
    { id: 'logo1', name: 'Suez' },
    { id: 'logo2', name: 'Veolia' },
    { id: 'logo3', name: 'Alstom' },
    { id: 'logo4', name: 'GE' },
    { id: 'logo5', name: 'AspenTech' }
  ];

  return (
    <section className="w-full bg-obsidian py-16 border-y border-border/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-8 md:gap-x-12 lg:gap-x-16">
          {logos.map((logo) => (
            <LogoItem key={logo.id} id={logo.id} name={logo.name} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LogoItem({ id, name }: { id: string; name: string }) {
  const [error, setError] = useState(false);

  return (
    <div className="flex items-center justify-center min-w-[100px] md:min-w-[140px]">
      {!error ? (
        <img 
          src={`/logos/${id}.png`} 
          alt={name} 
          loading="lazy"
          onError={() => setError(true)}
          className="h-8 md:h-10 w-auto max-w-[120px] md:max-w-[160px] object-contain opacity-50 hover:opacity-100 hover:scale-110 transition-all duration-500 ease-in-out cursor-default will-change-transform"
        />
      ) : (
        <span className="text-ivory font-medium text-lg opacity-50 hover:opacity-100 transition-opacity duration-500 cursor-default">
          {name}
        </span>
      )}
    </div>
  );
}
