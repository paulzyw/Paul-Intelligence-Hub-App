import MechanicalWatch from '../components/MechanicalWatch';

export function Theme() {
  return (
    <div className="flex flex-col w-full">
      {/* HERO SECTION PLACEHOLDER */}
      <section className="relative w-full bg-bg-hero-primary py-20 lg:py-20 overflow-hidden flex items-center justify-center min-h-screen transition-colors duration-400">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-bg-hero-primary to-transparent"></div>
        
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
          <MechanicalWatch />
        </div>
      </section>
    </div>
  );
}
