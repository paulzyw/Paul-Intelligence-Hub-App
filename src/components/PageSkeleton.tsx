import React from 'react';

export const PageSkeleton: React.FC = () => {
  return (
    <div 
      className="min-h-[70vh] w-full flex flex-col items-center justify-center p-8 bg-bg-primary/50 text-text-primary transition-opacity duration-200"
      aria-label="Loading page content"
      role="status"
    >
      <div className="relative flex items-center justify-center">
        {/* Subtle glowing pulse ring */}
        <div className="absolute w-12 h-12 rounded-full border-2 border-accent/20 animate-ping opacity-60" />
        {/* Core spinning loader */}
        <div className="w-9 h-9 rounded-full border-2 border-border border-t-accent animate-spin" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default PageSkeleton;
