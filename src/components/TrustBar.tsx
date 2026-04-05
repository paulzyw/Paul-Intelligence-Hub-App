import suezLogo from '../assets/logos/Suez.png';
import veoliaLogo from '../assets/logos/Veolia.png';
import alstomLogo from '../assets/logos/Alstom.png';
import geLogo from '../assets/logos/GE.png';
import aspenLogo from '../assets/logos/aspentech.png';

export function TrustBar() {
  const logos = [
    { src: suezLogo, alt: "Suez" },
    { src: veoliaLogo, alt: "Veolia" },
    { src: alstomLogo, alt: "Alstom" },
    { src: geLogo, alt: "GE" },
    { src: aspenLogo, alt: "AspenTech" }
  ];

  return (
    <section className="w-full bg-obsidian dark:bg-obsidian py-16 border-y border-border/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 lg:gap-24">
          {logos.map((logo, index) => (
            <div key={index} className="flex items-center justify-center">
              <img 
                src={logo.src} 
                alt={logo.alt} 
                className="h-10 md:h-12 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
