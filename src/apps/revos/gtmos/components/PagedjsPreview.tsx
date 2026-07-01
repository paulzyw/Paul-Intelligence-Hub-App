import React, { useEffect, useRef, useState } from 'react';
import { Previewer } from 'pagedjs';

interface PagedjsPreviewProps {
  children: React.ReactNode;
}

export const PagedjsPreview: React.FC<PagedjsPreviewProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const contentHashRef = useRef<string>('');

  useEffect(() => {
    let isMounted = true;
    
    const renderPdf = async () => {
      if (!containerRef.current || !contentRef.current) return;
      
      const currentHtml = contentRef.current.innerHTML;
      if (!currentHtml || currentHtml === contentHashRef.current) {
        return; // No meaningful change
      }
      contentHashRef.current = currentHtml;

      setLoading(true);
      
      if (previewerRef.current) {
        // Clean up previous previewer if possible
        try {
          previewerRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      
      containerRef.current.innerHTML = '';
      
      const previewer = new Previewer();
      previewerRef.current = previewer;
      
      // Get all current document stylesheets
      const styles = Array.from(document.styleSheets).map(sheet => {
        try {
          return sheet.href || '';
        } catch (e) {
          return '';
        }
      }).filter(Boolean);

      // For Vite / development, also get raw inline styles
      const inlineStyles = Array.from(document.head.querySelectorAll('style'))
        .map(style => style.innerHTML)
        .join('\n');

      if (inlineStyles) {
         const styleEl = document.createElement('style');
         styleEl.innerHTML = inlineStyles;
         containerRef.current.appendChild(styleEl);
      }

      // Clone node to prevent Paged.js from consuming the React-managed DOM elements
      const contentClone = contentRef.current.cloneNode(true) as HTMLDivElement;

      try {
        const flow = await previewer.preview(contentClone, styles, containerRef.current);
        if (isMounted) {
          console.log("Paged.js rendered", flow?.total || '?', "pages.");
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Paged.js error:", err);
          setLoading(false);
        }
      }
    };

    // Use a small timeout to allow React to finish rendering the hidden content
    const timeoutId = setTimeout(renderPdf, 100);

    return () => {
       isMounted = false;
       clearTimeout(timeoutId);
    };
  }, [children]);

  return (
    <div className="pagedjs-wrapper">
      <div style={{ display: 'none' }} ref={contentRef}>
        {children}
      </div>
      {loading && <div className="p-4 text-center text-slate-500">Formatting pages for print...</div>}
      <div ref={containerRef} className="pagedjs-render-container" />
    </div>
  );
};
