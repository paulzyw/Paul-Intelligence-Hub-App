export function TrustBar() {
  const logos = [
    { src: "/Suez.png", alt: "Suez" },
    { src: "/Veolia.png", alt: "Veolia" },
    { src: "/Alstom.png", alt: "Alstom" },
    { src: "/GE.png", alt: "GE" },
    { src: "/aspentech.png", alt: "AspenTech" }
  ];

  return (
    <section className="w-full bg-obsidian py-16 border-b border-border/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 lg:gap-24">
          {logos.map((logo, index) => (
            <div key={index} className="flex items-center justify-center">
              <img 
                src={logo.src} 
                alt={logo.alt} 
                className="h-10 md:h-12 w-auto object-contain grayscale opacity-50 transition-all duration-500 ease-in-out hover:grayscale-0 hover:opacity-100 hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
